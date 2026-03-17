import { useState, useEffect } from "react";
import { Server, Key, CheckCircle, AlertTriangle, Loader2, Wallet, User } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";

import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { apiUrl, apiKey, merchant, setApiUrl, setApiKey, setMerchant, clearAuth } = useAuthStore();
  const [localUrl, setLocalUrl] = useState(apiUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const maskApiKey = (key) => {
    if (!key || key.length < 12) return key;
    const firstPart = key.slice(0, 9);
    const lastPart = key.slice(-4);
    return `${firstPart}...${lastPart}`;
  };

  const handleConnect = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const cleanUrl = localUrl.replace(/\/+$/, "");
      
      // 1. Verify connection and fetch merchant profile
      const res = await axios.get(`${cleanUrl}/api/merchants/me`, {
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

      // 2. Save credentials and merchant profile
      setApiUrl(localUrl);
      setApiKey(localKey);
      setMerchant(res.data);
      setIsEditing(false);
      setStatus({ ok: true, msg: "Successfully connected to SOLEPay Server." });
      
      // Optional: Auto-redirect after short delay
      setTimeout(() => navigate("/"), 1500);
      
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearAuth();
    setLocalUrl("https://pay.nicolocarcagni.dev");
    setLocalKey("");
    setIsEditing(true);
    setStatus(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-slate-500 mb-8">
        Configure your SOLEPay Server connection.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg space-y-6">
        
        {/* Connection Form */}
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Server className="w-4 h-4 text-slate-500" />
              SOLEPay Server URL
            </label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              disabled={!isEditing}
              placeholder="https://pay.example.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Key className="w-4 h-4 text-slate-500" />
              Master API Key
            </label>
            {!isEditing ? (
              <div className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-400 flex items-center justify-between">
                <span>{maskApiKey(apiKey)}</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            ) : (
              <input
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="sole_live_..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
              />
            )}
          </div>

          {!isEditing ? (
            <button
              onClick={handleDisconnect}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Disconnect & Reset
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading || !localUrl || !localKey}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Save & Connect"
              )}
            </button>
          )}

          {status && (
            <div
              className={`flex items-start gap-2 text-sm p-3 rounded-xl ${
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

        {/* Merchant Profile Details */}
        {!isEditing && merchant && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-4">Connected Profile</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <User className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Merchant Name</p>
                  <p className="text-sm font-semibold text-white">{merchant.name}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Wallet Address</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                  <p className="text-xs font-mono text-slate-300 break-all">{merchant.wallet_address}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
