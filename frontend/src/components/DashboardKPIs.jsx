import { useMemo } from "react";
import { Sun, Clock, TrendingUp } from "lucide-react";

function KPICard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-black text-white">{value}</p>
      )}
    </div>
  );
}

export default function DashboardKPIs({ invoices = [], loading }) {
  const metrics = useMemo(() => {
    if (!invoices.length) return { volume: "0.00 SOLE", pending: "0", successRate: "0.0%" };

    const paid = invoices.filter((i) => i.status === "PAID");
    const pending = invoices.filter((i) => i.status === "PENDING");
    const expired = invoices.filter((i) => i.status === "EXPIRED");

    const totalVolume = paid.reduce((sum, i) => sum + i.amount, 0);
    
    // Denominator for success rate: PAID vs EXPIRED (Exclude PENDING as per task)
    const completedCount = paid.length + expired.length;
    const successRate = completedCount > 0 
      ? ((paid.length / completedCount) * 100).toFixed(1) 
      : "0.0";

    return {
      volume: `${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SOLE`,
      pending: pending.length.toString(),
      successRate: `${successRate}%`
    };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <KPICard
        icon={Sun}
        label="Total Volume"
        value={metrics.volume}
        accent="bg-amber-400/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
        loading={loading}
      />
      <KPICard
        icon={Clock}
        label="Pending Count"
        value={metrics.pending}
        accent="bg-blue-400/10 text-blue-400"
        loading={loading}
      />
      <KPICard
        icon={TrendingUp}
        label="Success Rate"
        value={metrics.successRate}
        accent="bg-emerald-400/10 text-emerald-400"
        loading={loading}
      />
    </div>
  );
}
