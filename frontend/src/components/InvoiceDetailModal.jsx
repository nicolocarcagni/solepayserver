import { Sun, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import CopyableId from "./CopyableId";
import useModalKeydown from "../hooks/useModalKeydown";

export default function InvoiceDetailModal({ invoice, onClose }) {
  useModalKeydown(onClose);

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Invoice Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
              <p className="text-2xl font-black text-white">{invoice.amount} SOLE</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Invoice ID</p>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg">
                <CopyableId id={invoice.id} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memo</p>
              <p className="text-sm text-slate-300 font-mono">{invoice.memo}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sender Address</p>
              <p className="text-xs text-slate-400 font-mono break-all">{invoice.sender_address || "None (Payment Pending)"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created At</p>
                <p className="text-xs text-slate-400">{new Date(invoice.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expires At</p>
                <p className="text-xs text-slate-400">{invoice.expires_at ? new Date(invoice.expires_at).toLocaleString() : "Never"}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 p-4 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
