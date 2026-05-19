"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function TestTools() {
  const [logs, setLogs] = useState<{ time: string, message: string, type: 'info'|'success'|'error'|'warn' }[]>([]);
  const [loading, setLoading] = useState<{ reset: boolean, idem: boolean, concurrent: boolean }>({ reset: false, idem: false, concurrent: false });
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info'|'success'|'error'|'warn' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // TEST 1: Reset All Quotas
  const handleResetQuotas = async () => {
    setLoading(prev => ({ ...prev, reset: true }));
    addLog("Initiating Quota Reset...", "info");
    try {
      const idempotencyKey = "reset-all-" + Date.now();
      addLog(`Sending idempotencyKey: ${idempotencyKey}`, "info");
      
      const res = await fetch("/api/webhook/quota-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey }),
      });
      const data = await res.json();
      
      if (res.ok) {
        addLog(`Reset Success: ${data.message}`, "success");
      } else {
        throw new Error(data.error || "Reset failed");
      }
    } catch (err: any) {
      addLog(`Reset Error: ${err.message}`, "error");
    } finally {
      setLoading(prev => ({ ...prev, reset: false }));
    }
  };

  // TEST 2: Call Webhook 5x (Idempotency Test)
  const handleIdempotencyTest = async () => {
    setLoading(prev => ({ ...prev, idem: true }));
    addLog("Initiating 5x Webhook Idempotency Test...", "info");
    
    const idempotencyKey = "idem-test-" + Date.now();
    addLog(`Using shared idempotencyKey: ${idempotencyKey}`, "info");

    const promises = Array.from({ length: 5 }).map((_, i) => {
      return fetch("/api/webhook/quota-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey }),
      }).then(res => res.json().then(data => ({ status: res.status, data, index: i + 1 })));
    });

    try {
      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res.data.message === "already processed") {
          addLog(`Call ${res.index}: ${res.data.message} (Idempotency Protected)`, "warn");
        } else if (res.data.message === "quota reset successfully") {
          addLog(`Call ${res.index}: ${res.data.message} (Processed!)`, "success");
        } else {
          addLog(`Call ${res.index}: Unexpected - ${JSON.stringify(res.data)}`, "error");
        }
      });
    } catch (err: any) {
      addLog(`Test Error: ${err.message}`, "error");
    } finally {
      setLoading(prev => ({ ...prev, idem: false }));
    }
  };

  // TEST 3: Generate 10 Leads Simultaneously
  const handleConcurrentTest = async () => {
    setLoading(prev => ({ ...prev, concurrent: true }));
    addLog("Initiating 10 Concurrent Leads Generation...", "info");

    const names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"];
    
    const promises = names.map((name, i) => {
      // Intentional duplicate risk setup: Random phone between 10 options, random service 1-3
      // We force a high chance of collision to test the DB constraint
      const randomId = Math.floor(Math.random() * 5); 
      const phone = `+1-555-000-000${randomId}`; 
      const serviceId = Math.floor(Math.random() * 3) + 1;

      return fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${name} Test`,
          phone,
          city: "Test City",
          serviceId: serviceId.toString(),
          description: "Concurrent testing payload",
        }),
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
          return Promise.reject({ status: res.status, data, name });
        }
        return { status: res.status, data, name };
      });
    });

    try {
      const results = await Promise.allSettled(promises);
      let successCount = 0;
      let conflictCount = 0;
      
      results.forEach(res => {
        if (res.status === "fulfilled") {
          successCount++;
          addLog(`${res.value.name}: Success (Assigned ${res.value.data.assignments?.length || 0} providers)`, "success");
        } else if (res.status === "rejected") {
          const rejectedData = res.reason;
          if (rejectedData.status === 409) {
            conflictCount++;
            addLog(`${rejectedData.name}: Conflict (Duplicate Phone+Service)`, "warn");
          } else {
            addLog(`${rejectedData.name || 'Unknown'}: Error - ${rejectedData.data?.error || 'Unknown Error'}`, "error");
          }
        }
      });
      
      addLog(`Concurrent Test Finished: ${successCount} Created, ${conflictCount} Conflicts`, "info");
    } catch (err: any) {
      addLog(`Test Error: ${err.message}`, "error");
    } finally {
      setLoading(prev => ({ ...prev, concurrent: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden flex flex-col h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <div className="z-10 max-w-6xl w-full mx-auto flex-grow flex flex-col h-full relative">
        <div className="flex-shrink-0 mb-8">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors mb-4 inline-flex items-center gap-2">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold mt-2">System Test Tools</h1>
          <p className="text-slate-400 mt-2">Verify race conditions, constraints, and idempotency safely.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-grow min-h-0">
          
          {/* Controls Panel */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <button 
              onClick={handleResetQuotas} 
              disabled={loading.reset}
              className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-blue-500 hover:bg-blue-900/20 text-left p-6 rounded-2xl transition-all disabled:opacity-50 group"
            >
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 mb-2">Reset All Quotas</h3>
              <p className="text-sm text-slate-400">Calls the webhook once to drop all leadsReceived back to 0.</p>
              {loading.reset && <div className="mt-4 h-1 w-full bg-blue-500/50 rounded overflow-hidden"><div className="h-full bg-blue-400 w-1/2 animate-pulse"></div></div>}
            </button>

            <button 
              onClick={handleIdempotencyTest} 
              disabled={loading.idem}
              className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-purple-500 hover:bg-purple-900/20 text-left p-6 rounded-2xl transition-all disabled:opacity-50 group"
            >
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 mb-2">Webhook Idempotency (5x)</h3>
              <p className="text-sm text-slate-400">Fires 5 simultaneous webhook calls with the identical idempotency key to test collision handling.</p>
              {loading.idem && <div className="mt-4 h-1 w-full bg-purple-500/50 rounded overflow-hidden"><div className="h-full bg-purple-400 w-1/2 animate-pulse"></div></div>}
            </button>

            <button 
              onClick={handleConcurrentTest} 
              disabled={loading.concurrent}
              className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-rose-500 hover:bg-rose-900/20 text-left p-6 rounded-2xl transition-all disabled:opacity-50 group"
            >
              <h3 className="text-xl font-bold text-white group-hover:text-rose-400 mb-2">Generate 10 Leads Concurrent</h3>
              <p className="text-sm text-slate-400">Throws 10 parallel API requests to the leads engine. Expects exactly 3 assignments per lead and valid deduplication.</p>
              {loading.concurrent && <div className="mt-4 h-1 w-full bg-rose-500/50 rounded overflow-hidden"><div className="h-full bg-rose-400 w-1/2 animate-pulse"></div></div>}
            </button>
          </div>

          {/* Console Output */}
          <div className="w-full lg:w-2/3 bg-black/80 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs font-mono text-slate-500">system-log.sh</span>
              <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Clear</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow font-mono text-sm space-y-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for events...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                    <span className={`
                      ${log.type === 'info' ? 'text-blue-300' : ''}
                      ${log.type === 'success' ? 'text-emerald-400' : ''}
                      ${log.type === 'error' ? 'text-red-400' : ''}
                      ${log.type === 'warn' ? 'text-yellow-400' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 1); 
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
