import { useEffect, useState } from "react";
import { DollarSign, FileText, TrendingUp, Loader2 } from "lucide-react";
import api from "../lib/api";

function MetricCard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
    
    // Set up 60-second autorefresh
    const interval = setInterval(fetchMetrics, 60000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/invoices", {
        validateStatus: (s) => s < 500,
      });

      if (res.status === 401) {
        setError("Invalid API Key. Check your Settings.");
        return;
      }

      const invoices = Array.isArray(res.data) ? res.data : [];
      const paid = invoices.filter((i) => i.status === "PAID");
      const volume = paid.reduce((sum, i) => sum + i.amount, 0);
      const rate =
        invoices.length > 0
          ? ((paid.length / invoices.length) * 100).toFixed(1)
          : "0.0";

      setMetrics({
        volume: `${volume.toFixed(2)} SOLE`,
        total: invoices.length.toString(),
        rate: `${rate}%`,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">Real-time payment overview.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total Volume"
          value={metrics?.volume}
          accent="bg-yellow-400/10 text-yellow-400"
          loading={loading}
        />
        <MetricCard
          icon={FileText}
          label="Total Invoices"
          value={metrics?.total}
          accent="bg-blue-400/10 text-blue-400"
          loading={loading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Success Rate"
          value={metrics?.rate}
          accent="bg-emerald-400/10 text-emerald-400"
          loading={loading}
        />
      </div>
    </div>
  );
}
