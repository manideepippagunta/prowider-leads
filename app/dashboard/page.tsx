"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      // Sort by ID to keep layout stable
      if (Array.isArray(data)) {
        setProviders(data.sort((a, b) => a.id - b.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();

    const eventSource = new EventSource("/api/leads/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // data.message === 'connected' is sent initially
        if (Array.isArray(data) && data.length > 0) {
          // Trigger refetch when new assignments arrive
          fetchProviders();
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
      
      <div className="z-10 max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-10">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors mb-4 inline-flex items-center gap-2">
              &larr; Back to Home
            </Link>
            <h1 className="text-4xl font-bold mt-2">Provider Dashboard</h1>
            <p className="text-slate-400 mt-2">Real-time SSE live updates on quota and allocations.</p>
          </div>
          {/* Live Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900 border border-emerald-500/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400">Live SSE Connected</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-800/50 rounded-3xl border border-slate-700/50"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.map((p) => {
              const quotaPercentage = Math.min((p.leadsReceived / p.monthlyQuota) * 100, 100);
              const isFull = p.leadsReceived >= p.monthlyQuota;
              
              return (
                <div key={p.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{p.name}</h2>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">ID: {p.id}</span>
                  </div>
                  
                  {/* Quota Stats */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Quota Used</span>
                      <span className={isFull ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                        {p.leadsReceived} / {p.monthlyQuota}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2.5 border border-slate-700 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                        style={{ width: `${quotaPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Assigned Leads List */}
                  <div className="flex-grow mt-2 flex flex-col min-h-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Leads</span>
                    <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-3 overflow-y-auto max-h-40 flex-grow custom-scrollbar">
                      {p.assignedLeads.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">No leads yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {p.assignedLeads.map((l: any) => (
                            <li key={l.id} className="text-sm border-b border-slate-800/50 pb-2 last:border-0 last:pb-0 flex flex-col">
                              <span className="text-slate-200">{l.customerName}</span>
                              <span className="text-xs text-slate-500">{l.serviceName} • {new Date(l.assignedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Global CSS for scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8); 
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
