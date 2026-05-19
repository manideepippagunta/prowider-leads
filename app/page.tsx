import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
      
      <main className="z-10 max-w-5xl text-center space-y-12">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-indigo-600 drop-shadow-sm">
          Prowider Leads
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          Intelligent, concurrent, and fair lead allocation engine built with Next.js App Router, Prisma, and PostgreSQL.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {/* Card 1 */}
          <Link href="/request-service" className="group relative rounded-3xl p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] text-left flex flex-col items-start">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
              📝
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors">Submit Lead</h2>
            <p className="text-slate-400 leading-relaxed flex-grow">Create new lead requests and see the real-time allocation engine distribute them to the correct providers.</p>
            <span className="mt-6 font-medium text-blue-400 group-hover:underline">Open Form &rarr;</span>
          </Link>
          
          {/* Card 2 */}
          <Link href="/dashboard" className="group relative rounded-3xl p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] text-left flex flex-col items-start">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
              📊
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-100 group-hover:text-emerald-400 transition-colors">Live Dashboard</h2>
            <p className="text-slate-400 leading-relaxed flex-grow">Monitor provider quotas, received leads, and assignments via a real-time Server-Sent Events stream.</p>
            <span className="mt-6 font-medium text-emerald-400 group-hover:underline">View Dashboard &rarr;</span>
          </Link>
          
          {/* Card 3 */}
          <Link href="/test-tools" className="group relative rounded-3xl p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] text-left flex flex-col items-start">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
              ⚡
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-100 group-hover:text-purple-400 transition-colors">Test Tools</h2>
            <p className="text-slate-400 leading-relaxed flex-grow">Stress-test the system with concurrent lead generation and verify idempotent quota-reset webhooks.</p>
            <span className="mt-6 font-medium text-purple-400 group-hover:underline">Run Tests &rarr;</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
