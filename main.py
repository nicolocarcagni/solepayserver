import asyncio
import json
import logging
import uuid
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.templating import Jinja2Templates
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import websockets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("solepay")

# ==========================================
# 1. Database & Models (SQLAlchemy)
# ==========================================
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./solepay.db")
engine = sa.create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Merchant(Base):
    __tablename__ = "merchants"

    id = sa.Column(sa.String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = sa.Column(sa.String, nullable=False)
    api_key = sa.Column(sa.String, unique=True, index=True, nullable=False)
    wallet_address = sa.Column(sa.String, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"

    id = sa.Column(sa.String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    merchant_id = sa.Column(sa.String, sa.ForeignKey("merchants.id"), nullable=False)
    amount = sa.Column(sa.Float, nullable=False)
    memo = sa.Column(sa.String, unique=True, index=True, nullable=False)
    sender_address = sa.Column(sa.String, nullable=True)
    webhook_url = sa.Column(sa.String, nullable=True)
    status = sa.Column(sa.String, default="PENDING")
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow)
    expires_at = sa.Column(sa.DateTime, nullable=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# CONSTANTS 
# ==========================================
WS_MEMPOOL_URL = os.getenv("NODE_WS_URL")
if not WS_MEMPOOL_URL:
    raise ValueError("NODE_WS_URL environment variable is required")

SOLE_DECIMALS = 8
ATOMIC_DIVISOR = 10 ** SOLE_DECIMALS
INVOICE_EXPIRY_MINUTES = 15

# ==========================================
# 3. Webhook Dispatcher
# ==========================================
async def send_webhook(invoice):
    """Sends a POST request to the merchant's webhook URL upon payment."""
    if not invoice.webhook_url:
        return
        
    payload = {
        "invoice_id": invoice.id,
        "status": invoice.status,
        "amount": invoice.amount,
        "memo": invoice.memo
    }
    
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                logger.info(f"Dispatching webhook for invoice {invoice.id} to {invoice.webhook_url} (Attempt {attempt + 1}/3)")
                response = await client.post(invoice.webhook_url, json=payload, timeout=5.0)
                response.raise_for_status()
                logger.info(f"Webhook delivered successfully for invoice {invoice.id}")
                return
            except Exception as e:
                logger.warning(f"Webhook delivery failed for invoice {invoice.id}: {e}")
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error(f"Webhook delivery completely failed for invoice {invoice.id} after 3 attempts.")

# ==========================================
# 4. WebSocket Listener (Background Task)
# ==========================================
async def listen_to_mempool():
    """Listens to SOLE node mempool websocket and updates invoice status."""
    while True:
        try:
            logger.info(f"Connecting to SOLE Mempool WebSocket at {WS_MEMPOOL_URL}...")
            async with websockets.connect(WS_MEMPOOL_URL) as websocket:
                logger.info("Connected to WebSocket. Listening for transactions...")
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        txid = data.get("txid")
                        memo = data.get("memo")
                        sender_addr = data.get("sender_address")
                        outputs = data.get("outputs", [])
                        
                        if memo and outputs:
                            logger.info(f"Received transaction msg| txid:{txid} memo:{memo} sender:{sender_addr} outputs:{len(outputs)}")
                            
                            db = SessionLocal()
                            try:
                                invoice = db.query(Invoice).filter(
                                    Invoice.memo == memo,
                                    Invoice.status == "PENDING"
                                ).first()
                                
                                if invoice:
                                    expected_atomic = int(round(invoice.amount * ATOMIC_DIVISOR))
                                    for output in outputs:
                                        received_atomic = int(output.get("value", 0))
                                        if received_atomic >= expected_atomic:
                                            if received_atomic > expected_atomic:
                                                logger.warning(f"Overpayment on invoice {invoice.id}: received {received_atomic}, expected {expected_atomic}")
                                            logger.info(f"Payment confirmed for invoice {invoice.id}! (matched {received_atomic} atomic units)")
                                            invoice.status = "PAID"
                                            if sender_addr:
                                                invoice.sender_address = sender_addr
                                            db.commit()
                                            if invoice.webhook_url:
                                                asyncio.create_task(send_webhook(invoice))
                                            break
                                        elif received_atomic > 0 and received_atomic < expected_atomic:
                                            logger.warning(f"Underpayment on invoice {invoice.id}: received {received_atomic}, expected {expected_atomic}")
                                            invoice.status = "UNDERPAID"
                                            if sender_addr:
                                                invoice.sender_address = sender_addr
                                            db.commit()
                                            if invoice.webhook_url:
                                                asyncio.create_task(send_webhook(invoice))
                                            break
                            except Exception as db_e:
                                logger.error(f"Database error during WebSocket processing: {db_e}")
                            finally:
                                db.close()
                                
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse websocket message: {message}")
                        
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

# ==========================================
# 5. Invoice Sweeper (Expiration Background Task)
# ==========================================
async def invoice_sweeper():
    """Periodically marks expired PENDING invoices as EXPIRED."""
    while True:
        await asyncio.sleep(60)
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired = db.query(Invoice).filter(
                Invoice.status == "PENDING",
                Invoice.expires_at < now
            ).all()
            
            if expired:
                for inv in expired:
                    inv.status = "EXPIRED"
                    logger.info(f"Invoice {inv.id} marked as EXPIRED.")
                db.commit()
                logger.info(f"Sweeper: {len(expired)} invoice(s) expired.")
        except Exception as e:
            logger.error(f"Invoice sweeper error: {e}")
        finally:
            db.close()

# ==========================================
# FastAPI Application & Lifespan
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    ws_task = asyncio.create_task(listen_to_mempool())
    sweeper_task = asyncio.create_task(invoice_sweeper())
    yield
    ws_task.cancel()
    sweeper_task.cancel()
    try:
        await ws_task
    except asyncio.CancelledError:
        logger.info("Background WebSocket listener task cancelled on shutdown.")
    try:
        await sweeper_task
    except asyncio.CancelledError:
        logger.info("Invoice sweeper task cancelled on shutdown.")

app = FastAPI(title="SOLEPay Server MVP", lifespan=lifespan)

# ==========================================
# CORS Configuration
# ==========================================
raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# ==========================================
# 2. Security / Authentication
# ==========================================
api_key_header = APIKeyHeader(name="X-API-Key")

def get_current_merchant(api_key: str = Depends(api_key_header), db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.api_key == api_key).first()
    if not merchant:
        raise HTTPException(
            status_code=401,
            detail="Invalid API Key"
        )
    return merchant

# ==========================================
# 3. The REST API Endpoints
# ==========================================

@app.get("/api/health")
def health_check():
    """Unauthenticated endpoint to verify server reachability."""
    return {"status": "ok", "service": "SOLEPay Server", "version": "1.0.0"}

class InvoiceCreateReq(BaseModel):
    amount: float
    webhook_url: Optional[str] = None

class InvoiceRes(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    amount: float
    memo: str
    sender_address: Optional[str] = None
    webhook_url: Optional[str] = None
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    uri: Optional[str] = None

from typing import List

@app.get("/api/invoices", response_model=List[InvoiceRes])
def get_invoices(merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    """Retrieves all invoices generated by the authenticated merchant, newest first."""
    invoices = db.query(Invoice).filter(Invoice.merchant_id == merchant.id).order_by(Invoice.created_at.desc()).all()
    
    # We must manually map the computed 'uri' property since from_attributes doesn't natively trigger it on lists
    # unless using an explicit mapping or the property itself. Pydantic v2 handles @property differently.
    result = []
    for inv in invoices:
        res_dict = {
            "id": inv.id,
            "amount": inv.amount,
            "memo": inv.memo,
            "sender_address": inv.sender_address,
            "webhook_url": inv.webhook_url,
            "status": inv.status,
            "created_at": inv.created_at,
            "expires_at": inv.expires_at,
            "uri": inv.uri
        }
        result.append(InvoiceRes(**res_dict))
    
    return result

@app.post("/api/invoices", response_model=InvoiceRes)
def create_invoice(payload: InvoiceCreateReq, merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    """Creates a new PENDING invoice and returns SOLE payment URI."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    memo = f"INV-{uuid.uuid4().hex[:12].upper()}"
    
    new_invoice = Invoice(
        merchant_id=merchant.id,
        amount=payload.amount,
        memo=memo,
        webhook_url=payload.webhook_url,
        status="PENDING",
        expires_at=datetime.utcnow() + timedelta(minutes=INVOICE_EXPIRY_MINUTES)
    )
    
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    
    uri = f"sole:{merchant.wallet_address}?amount={new_invoice.amount}&memo={new_invoice.memo}"
    
    response = InvoiceRes.model_validate(new_invoice)
    response.uri = uri
    
    return response

@app.get("/api/invoices/{invoice_id}", response_model=InvoiceRes)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Retrieves current status of an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    merchant = db.query(Merchant).filter(Merchant.id == invoice.merchant_id).first()
    uri = f"sole:{merchant.wallet_address}?amount={invoice.amount}&memo={invoice.memo}"
    response = InvoiceRes.model_validate(invoice)
    response.uri = uri

    return response

# ==========================================
# 4. Frontend View Endpoint
# ==========================================
@app.get("/invoice/{invoice_id}")
def view_invoice(request: Request, invoice_id: str, db: Session = Depends(get_db)):
    """Renders the HTML checkout page for an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    merchant = db.query(Merchant).filter(Merchant.id == invoice.merchant_id).first()
    uri = f"sole:{merchant.wallet_address}?amount={invoice.amount}&memo={invoice.memo}"

    return templates.TemplateResponse("checkout.html", {
        "request": request,
        "invoice": invoice,
        "uri": uri
    })

