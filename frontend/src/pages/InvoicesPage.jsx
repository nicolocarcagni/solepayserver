import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../lib/api";

const statusStyles = {
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PENDING: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/30",
  UNDERPAID: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  OVERPAID: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-800 text-slate-400 border-slate-700";
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${style}`}>
      {status}
    </span>
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

  useEffect(() => {
    fetchInvoices();
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
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
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-600">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {inv.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {inv.amount} SOLE
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {inv.memo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
