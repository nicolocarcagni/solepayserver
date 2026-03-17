import { useState } from "react";
import { Sun, X, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import api from "../lib/api";
import useModalKeydown from "../hooks/useModalKeydown";

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useModalKeydown(onClose);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(amount) || 0;
      const step = 1;
      const next = e.key === "ArrowUp" ? current + step : Math.max(1, current - step);
      setAmount(next.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 1) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/invoices", {
        amount: parseFloat(amount),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess(res.data);
        onClose();
        setSuccess(false);
        setAmount("1");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800/50 rounded-[2.5rem] w-full max-w-xs overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">Request</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">New Payment</h2>
            <p className="text-xs text-slate-500">Enter the amount to request</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-2xl animate-in shake">
              {error}
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 animate-in zoom-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Invoice Created</p>
                <p className="text-sm text-slate-500">Redirecting to payment link...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative group">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <input
                      autoFocus
                      required
                      type="number"
                      step="any"
                      min="1"
                      value={amount}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-center text-6xl font-black text-white placeholder:text-slate-800 outline-none transition-all selection:bg-amber-500/30"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="mt-4 px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
                    <span className="text-sm font-black text-amber-500 tracking-widest uppercase">SOLE</span>
                  </div>
                </div>
                <div className="absolute inset-0 -z-10 bg-amber-500/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              </div>

              <div className="pt-4">
                <button
                  disabled={loading || !amount || parseFloat(amount) < 1}
                  type="submit"
                  className="group relative w-full h-16 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-3xl transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-lg">Processing...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
