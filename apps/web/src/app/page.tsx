import Image from "next/image";
import Link from "next/link";
import { Rocket, Target, Eye, Terminal, GitBranch, Cloud } from "lucide-react";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-[#fde047] selection:text-black">
      <Header />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-6 px-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Image src="/screen.png" alt="HookShot Logo" width={28} height={28} className="object-contain" />
        <span className="text-xl font-bold text-[#fde047]">HookShot</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest uppercase text-neutral-400">
        <Link href="#" className="border-b-2 border-[#fde047] text-white pb-1">Documentation</Link>
        <Link href="#" className="hover:text-white pb-1 transition-colors">Features</Link>
        <Link href="#" className="hover:text-white pb-1 transition-colors">Pricing</Link>
      </nav>
      <Show when="signed-out">
        <Link href="/auth" className="bg-[#fde047] text-black px-5 py-2.5 text-sm font-semibold rounded hover:bg-[#fce96a] transition-colors cursor-pointer">
          Get Started
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className="bg-[#fde047] text-black px-5 py-2.5 text-sm font-semibold rounded hover:bg-[#fce96a] transition-colors">
          Go to Dashboard
        </Link>
      </Show>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
      <div className="flex-1 space-y-8">
        <h1 className="text-5xl md:text-[3.5rem] font-bold leading-[1.1] tracking-tight">
          Reliable Webhook Delivery,<br />
          <span className="text-[#fde047]">Built for the Stars</span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-xl leading-relaxed">
          Ensure every packet reaches its destination with HookShot. High-accuracy delivery, real-time monitoring, and an effortless developer experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Show when="signed-out">
            <Link href="/auth" className="bg-[#fde047] text-black px-6 py-3.5 rounded text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#fce96a] transition-colors w-full sm:w-auto cursor-pointer">
              Deploy Your First Hook <Rocket className="w-4 h-4" />
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="bg-[#fde047] text-black px-6 py-3.5 rounded text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#fce96a] transition-colors w-full sm:w-auto">
              Deploy Your First Hook <Rocket className="w-4 h-4" />
            </Link>
          </Show>
          <Link href="#" className="border border-neutral-800 bg-[#111] px-6 py-3.5 rounded text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center w-full sm:w-auto">
            View API Reference
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-6 pt-10">
          <div>
            <div className="text-[#fde047] text-2xl md:text-3xl font-bold mb-1">99.99%</div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Accuracy</div>
          </div>
          <div>
            <div className="text-[#fde047] text-2xl md:text-3xl font-bold mb-1">Sub-10ms</div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Latency</div>
          </div>
          <div>
            <div className="text-[#fde047] text-2xl md:text-3xl font-bold mb-1">Zero</div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Dropped Hooks</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full max-w-[500px] relative">
        {/* Corner accent */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-[#fde047] opacity-60" />
        
        <div className="bg-[#111] border border-neutral-800/60 rounded-xl p-6 shadow-2xl font-mono text-[13px] leading-loose relative z-10">
          <div className="flex gap-2 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ec6a5e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#f4bf4f]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
          </div>
          <div className="text-neutral-300">
            <span className="text-[#fde047] mr-3">$</span>npm install hookshot-sdk
          </div>
          <div className="text-neutral-500 mb-5 ml-5">
            {`> installing dependencies...`}
            <br />
            {`> hookshot-sdk@2.4.1 added 12 packages`}
            <br />
            {`> success!`}
          </div>
          <div className="text-neutral-300 mb-5">
            <span className="text-[#fde047] mr-3">$</span>hookshot login
          </div>
          <div className="text-neutral-300">
            <span className="text-[#fde047] mr-3">$</span>hookshot deploy --endpoint /v1/hooks
          </div>
        </div>
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#fde047] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Precise Targeting */}
      <div className="col-span-1 border border-neutral-800 bg-[#111] rounded-xl p-10 relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 left-10 w-16 h-[2px] bg-[#fde047]/80" />
        
        <div>
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest uppercase border border-neutral-800 bg-neutral-900/50 px-2 py-1 rounded text-neutral-400">
              Performance
            </span>
            <Target className="w-6 h-6 text-neutral-600 group-hover:text-neutral-400 transition-colors" strokeWidth={1.5} />
          </div>
          
          <h3 className="text-2xl font-semibold mb-4 tracking-tight">Precise Targeting</h3>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-12 max-w-[90%]">
            Reach any endpoint with guaranteed delivery. Our intelligent routing system bypasses congestion and ensures your data lands exactly where it needs to be.
          </p>
        </div>
        
        {/* Mock UI graphic */}
        <div className="h-44 w-[110%] -ml-5 -mb-10 bg-[#0d0d0d] border border-neutral-800 rounded-t-xl transform rotate-3 translate-y-4 shadow-2xl relative overflow-hidden flex flex-col opacity-80 group-hover:rotate-2 group-hover:translate-y-2 transition-all duration-500">
          <div className="border-b border-neutral-800 h-10 flex items-center px-5 gap-3">
             <div className="h-2.5 w-20 bg-neutral-800/80 rounded-full"></div>
             <div className="h-2.5 w-32 bg-neutral-800/50 rounded-full"></div>
          </div>
          <div className="p-5 space-y-4">
             <div className="h-2.5 w-[85%] bg-neutral-800/60 rounded-full"></div>
             <div className="h-2.5 w-[60%] bg-neutral-800/40 rounded-full"></div>
             <div className="h-2.5 w-[95%] bg-neutral-800/50 rounded-full"></div>
             <div className="h-2.5 w-[40%] bg-neutral-800/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Deep Visibility */}
      <div className="col-span-1 border border-neutral-800 bg-[#111] rounded-xl p-10 relative flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <Eye className="w-6 h-6 text-[#fde047]" strokeWidth={1.5} />
          </div>
          
          <h3 className="text-2xl font-semibold mb-4 tracking-tight">Deep Visibility</h3>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-12 max-w-[90%]">
            Track every hook with detailed logs and retries. Get real-time feedback on payload delivery states.
          </p>
        </div>
        
        <div className="mt-auto pt-8 border-t border-neutral-800 font-mono text-[13px] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-sm bg-[#fde047]" />
            <span className="text-neutral-300">HTTP 200 OK - 12ms</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-sm bg-red-400" />
            <span className="text-neutral-500">HTTP 503 FAIL - Retrying...</span>
          </div>
        </div>
      </div>

      {/* Developer First */}
      <div className="col-span-1 lg:col-span-2 border border-neutral-800 bg-[#111] rounded-xl p-10 relative flex flex-col md:flex-row items-center gap-12 overflow-hidden group">
        <div className="absolute top-0 left-10 w-16 h-[2px] bg-[#fde047]/80" />
        
        <div className="flex-1">
          <div className="mb-8">
            <span className="text-[10px] font-mono tracking-widest uppercase border border-neutral-800 bg-neutral-900/50 px-2 py-1 rounded text-neutral-400">
              Ecosystem
            </span>
          </div>
          
          <h3 className="text-2xl font-semibold mb-4 tracking-tight">Developer First</h3>
          <p className="text-neutral-400 text-[15px] leading-relaxed max-w-[90%] mb-10">
            Simple NPM package integration and robust CLI. Built to fit into your existing CI/CD pipelines without friction.
          </p>
          
          <div className="flex gap-5 text-neutral-600">
            <Terminal className="w-5 h-5" strokeWidth={1.5} />
            <GitBranch className="w-5 h-5" strokeWidth={1.5} />
            <Cloud className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="flex-1 w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl p-8 font-mono text-[13px] leading-loose overflow-x-auto shadow-inner group-hover:border-neutral-700 transition-colors">
          <div><span className="text-[#ff7b72]">const</span> hook = <span className="text-[#ff7b72]">new</span> <span className="text-[#fde047]">HookShot</span>({`{`}</div>
          <div className="pl-6">apiKey: process.env.<span className="text-[#79c0ff]">HS_KEY</span>,</div>
          <div className="pl-6">region: <span className="text-[#a5d6ff]">'us-east-1'</span></div>
          <div>{`});`}</div>
          <br />
          <div><span className="text-[#ff7b72]">await</span> hook.<span className="text-[#d2a8ff]">send</span>({`{`}</div>
          <div className="pl-6">event: <span className="text-[#a5d6ff]">'order.created'</span>,</div>
          <div className="pl-6">payload: {`{`} id: <span className="text-[#79c0ff]">123</span> {`}`}</div>
          <div>{`});`}</div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6 text-center flex flex-col items-center">
      <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to launch?</h2>
      <p className="text-neutral-400 mb-10 max-w-xl text-lg md:text-xl">
        Join thousands of developers ensuring their event-driven architectures stay rock solid.
      </p>
      <Show when="signed-out">
        <Link href="/auth" className="bg-[#fde047] text-black px-8 py-4 rounded text-base font-semibold hover:bg-[#fce96a] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(253,224,71,0.3)] cursor-pointer">
          Get Started Free
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className="bg-[#fde047] text-black px-8 py-4 rounded text-base font-semibold hover:bg-[#fce96a] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(253,224,71,0.3)] flex items-center justify-center">
          Go to Dashboard
        </Link>
      </Show>
      <p className="text-neutral-600 text-[10px] mt-8 font-mono uppercase tracking-widest">
        No credit card required. 10k free hooks/mo.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-900 py-10 px-6 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <span className="text-[#fde047] font-bold text-lg tracking-tight">HookShot</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[11px] font-mono tracking-widest uppercase text-neutral-500">
          <Link href="#" className="hover:text-neutral-300 transition-colors">Documentation</Link>
          <Link href="#" className="hover:text-neutral-300 transition-colors">Status</Link>
          <Link href="#" className="hover:text-neutral-300 transition-colors">Changelog</Link>
          <Link href="#" className="hover:text-neutral-300 transition-colors">Terms</Link>
          <Link href="#" className="hover:text-neutral-300 transition-colors">Privacy</Link>
        </div>
        <div className="text-neutral-600 text-[11px] font-mono tracking-widest uppercase">
          &copy; 2024 HookShot. Made for developers.
        </div>
      </div>
    </footer>
  );
}
