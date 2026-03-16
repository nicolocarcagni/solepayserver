import { useEffect, useState } from "react";
import { Loader2, Sun, Copy, Check, Clock, AlertCircle, XCircle } from "lucide-react";
import api from "../lib/api";

const statusStyles = {
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/30",
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-800 text-slate-400 border-slate-700";
  
  const getIcon = () => {
    switch (status) {
      case "PAID": return <Sun className="w-3 h-3 fill-emerald-400/20" />;
      case "PENDING": return <Clock className="w-3 h-3" />;
      case "EXPIRED": return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${style}`}>
      {getIcon()}
      {status}
    </span>
  );
}

function CopyableId({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-[10px] text-slate-400 break-all max-w-[120px] sm:max-w-none">
        {id}
      </span>
      <button
        onClick={handleCopy}
        className={`p-1 rounded transition-colors ${
          copied ? "text-emerald-400 bg-emerald-400/10" : "text-slate-600 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100"
        }`}
        title="Copy ID"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/50">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();

    const interval = setInterval(fetchInvoices, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/invoices", {
        validateStatus: (s) => s < 500,
      });

      if (res.status === 401) {
        setError("Invalid API Key. Check your Settings.");
        return;
      }

      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Invoices</h1>
          <p className="text-slate-500">All generated payment invoices.</p>
        </div>
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Memo
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && invoices.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <Sun className="w-12 h-12 text-slate-800 animate-pulse fill-slate-800/10" />
                      <p className="text-slate-600 font-medium">No invoices found yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <CopyableId id={inv.id} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      {inv.amount} SOLE
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[200px] truncate">
                      {inv.memo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-white">Invoice Details</h2>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                  <p className="text-2xl font-black text-white">{selectedInvoice.amount} SOLE</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Invoice ID</p>
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-300 break-all">{selectedInvoice.id}</span>
                    <CopyableId id={selectedInvoice.id} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memo</p>
                  <p className="text-sm text-slate-300 font-mono">{selectedInvoice.memo}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sender Address</p>
                  <p className="text-xs text-slate-400 font-mono break-all">{selectedInvoice.sender_address || "None (Payment Pending)"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created At</p>
                    <p className="text-xs text-slate-400">{new Date(selectedInvoice.created_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expires At</p>
                    <p className="text-xs text-slate-400">{selectedInvoice.expires_at ? new Date(selectedInvoice.expires_at).toLocaleString() : "Never"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-4 border-t border-slate-800 text-center">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
