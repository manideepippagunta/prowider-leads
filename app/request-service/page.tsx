"use client";

import { useState } from "react";
import Link from "next/link";

export default function RequestService() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    serviceId: "1",
    description: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [assignedProviders, setAssignedProviders] = useState<{name: string, leadsReceived: number, monthlyQuota: number}[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setAssignedProviders([]);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setAssignedProviders(data.assignments?.map((a: { provider: {name: string, leadsReceived: number, monthlyQuota: number} }) => a.provider) || []);
      setStatus("success");
      
      // Optionally reset form
      // setFormData({ name: "", phone: "", city: "", serviceId: "1", description: "" });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
      
      <div className="z-10 w-full max-w-xl">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors mb-8 inline-flex items-center gap-2">
          &larr; Back to Home
        </Link>
        
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <h1 className="text-3xl font-bold mb-2">Request Service</h1>
          <p className="text-slate-400 mb-8">Submit a lead and let the engine find the best providers.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Service Type</label>
              <select
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              >
                <option value="1">Service 1</option>
                <option value="2">Service 2</option>
                <option value="3">Service 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
              <textarea
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-24"
                placeholder="Details about the request..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              {status === "loading" ? "Processing..." : "Submit Lead"}
            </button>
          </form>

          {/* Error Message */}
          {status === "error" && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <p className="font-medium flex items-center gap-2">
                <span className="text-xl">⚠️</span> Error
              </p>
              <p className="mt-1 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {status === "success" && (
            <div className="mt-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="font-medium text-emerald-400 flex items-center gap-2 mb-3">
                <span className="text-xl">✅</span> Lead Successfully Assigned!
              </p>
              <p className="text-sm text-slate-300 mb-3">This lead was routed to the following providers:</p>
              <ul className="space-y-2">
                {assignedProviders.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {p.name.charAt(p.name.length - 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">Quota Used: {p.leadsReceived}/{p.monthlyQuota}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {assignedProviders.length === 0 && (
                <p className="text-sm text-yellow-400">No providers had available quota to accept this lead.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
