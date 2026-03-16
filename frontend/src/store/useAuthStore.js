import { create } from "zustand";

const useAuthStore = create((set) => ({
  apiUrl: localStorage.getItem("solepay_api_url") || "https://pay.nicolocarcagni.dev",
  apiKey: localStorage.getItem("solepay_api_key") || "",

  setApiUrl: (url) => {
    localStorage.setItem("solepay_api_url", url);
    set({ apiUrl: url });
  },

  setApiKey: (key) => {
    localStorage.setItem("solepay_api_key", key);
    set({ apiKey: key });
  },

  clearAuth: () => {
    localStorage.removeItem("solepay_api_url");
    localStorage.removeItem("solepay_api_key");
    set({ apiUrl: "https://pay.nicolocarcagni.dev", apiKey: "" });
  },
}));

export default useAuthStore;
