import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../lib/api";
import DashboardKPIs from "../components/DashboardKPIs";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import InvoiceDetailModal from "../components/InvoiceDetailModal";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();

    // Set up 60-second autorefresh
    const interval = setInterval(fetchInvoices, 60000);

    // Cleanup interval on unmount
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

  const handleCreateSuccess = (newInvoice) => {
    fetchInvoices();
    setSelectedInvoice(newInvoice);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-500">Payment overview.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <DashboardKPIs invoices={invoices} loading={loading} />

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
