import { create } from "zustand";

const getSavedMerchant = () => {
  try {
    const saved = localStorage.getItem("solepay_merchant");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set) => ({
  apiUrl: localStorage.getItem("solepay_api_url") || "https://pay.nicolocarcagni.dev",
  apiKey: localStorage.getItem("solepay_api_key") || "",
  merchant: getSavedMerchant(),

  setApiUrl: (url) => {
    localStorage.setItem("solepay_api_url", url);
    set({ apiUrl: url });
  },

  setApiKey: (key) => {
    localStorage.setItem("solepay_api_key", key);
    set({ apiKey: key });
  },

  setMerchant: (merchantData) => {
    localStorage.setItem("solepay_merchant", JSON.stringify(merchantData));
    set({ merchant: merchantData });
  },

  clearAuth: () => {
    localStorage.removeItem("solepay_api_url");
    localStorage.removeItem("solepay_api_key");
    localStorage.removeItem("solepay_merchant");
    set({ apiUrl: "https://pay.nicolocarcagni.dev", apiKey: "", merchant: null });
  },
}));

export default useAuthStore;
