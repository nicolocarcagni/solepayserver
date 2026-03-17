import { Clock, Sun, XCircle, AlertCircle } from "lucide-react";

const statusStyles = {
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function StatusBadge({ status }) {
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
