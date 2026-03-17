import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyableId({ id }) {
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
