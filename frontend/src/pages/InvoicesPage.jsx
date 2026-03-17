import { useEffect, useState, useMemo } from "react";
import { Loader2, Sun, Plus, Search, Download, X } from "lucide-react";
import api from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import CopyableId from "../components/CopyableId";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import InvoiceDetailModal from "../components/InvoiceDetailModal";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newInvoice) => {
    fetchInvoices();
    setSelectedInvoice(newInvoice);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesFilter = activeFilter === "ALL" || inv.status === activeFilter;
      const matchesSearch = 
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.memo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.sender_address && inv.sender_address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });
  }, [invoices, activeFilter, searchQuery]);

  const exportToCSV = () => {
    const headers = ["Invoice ID", "Amount (SOLE)", "Memo", "Status", "Created", "Sender"];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.amount,
      inv.memo || "",
      inv.status,
      new Date(inv.created_at).toLocaleString(),
      inv.sender_address || "N/A"
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(val => `"${val}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solepay_invoices_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Invoices</h1>
          <p className="text-slate-500">All generated payment invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
          {["ALL", "PAID", "PENDING", "EXPIRED"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === filter
                  ? "bg-slate-800 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Search ID, Memo, or Sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Memo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Created</th>
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
                filteredInvoices.map((inv) => (
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

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
