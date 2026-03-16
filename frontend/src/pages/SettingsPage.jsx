import { useState } from "react";
import { Server, Key, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";

import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { apiUrl, apiKey, setApiUrl, setApiKey } = useAuthStore();
  const [localUrl, setLocalUrl] = useState(apiUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const cleanUrl = localUrl.replace(/\/+$/, "");
      const res = await axios.get(`${cleanUrl}/api/invoices`, {
        headers: { "X-API-Key": localKey },
        validateStatus: (s) => s < 500,
      });

      if (res.status === 401 || res.status === 403) {
        setStatus({ ok: false, msg: "Invalid API Key. Connection refused." });
        return;
      }

      if (res.status !== 200) {
        setStatus({ ok: false, msg: `Server returned error ${res.status}` });
        return;
      }

      // Valid key, save to store and redirect
      setApiUrl(localUrl);
      setApiKey(localKey);
      navigate("/");
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-slate-500 mb-8">
        Configure your SOLEPay Server connection.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Server className="w-4 h-4 text-slate-500" />
            SOLEPay Server URL
          </label>
          <input
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="https://pay.example.com"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Key className="w-4 h-4 text-slate-500" />
            Master API Key
          </label>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="sole_live_..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition"
          />
        </div>

        <button
          onClick={handleConnect}
          disabled={loading || !localUrl || !localKey}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Save & Connect"
          )}
        </button>

        {status && (
          <div
            className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
              status.ok
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {status.ok ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{status.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
