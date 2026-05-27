"use client";

import { UserButton, Show } from "@clerk/nextjs";
import { Search, Bell, LayoutGrid, Key, Webhook, Database, Settings, HelpCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard/overview", icon: LayoutGrid },
    { name: "API Keys", href: "/dashboard", icon: Key },
    { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
    { name: "Logs", href: "/dashboard/logs", icon: Database },
  ];

  const bottomItems = [
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Support", href: "/dashboard/support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex font-sans selection:bg-[#fde047] selection:text-black">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-neutral-800 bg-[#0d0d0d] flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-transparent shrink-0 mt-2">
          <div className="flex flex-col">
             <span className="text-xl font-bold text-white tracking-tight">HookShot</span>
             <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase mt-0.5">Webhook Engine</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href as Route}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${isActive ? 'bg-white/[0.03] text-[#fde047] font-medium border-l-2 border-[#fde047] rounded-l-none -ml-3 pl-[17px]' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-neutral-800">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href as Route}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm text-neutral-400 hover:text-white hover:bg-white/[0.02]"
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#111]">
        {/* Topbar */}
        <header className="h-[72px] border-b border-neutral-800 flex items-center justify-between px-6 bg-[#0d0d0d] shrink-0">
          <div className="flex-1 max-w-lg relative">
             <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Search keys or logs..." 
               className="w-full bg-transparent border border-neutral-800 text-[13px] rounded-md pl-10 pr-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
             />
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-neutral-300 hover:text-white transition-colors">Documentation</Link>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Bell className="w-[18px] h-[18px]" />
            </button>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-full border border-neutral-800", userButtonTrigger: "focus:shadow-none focus:outline-none" } }} />
            </Show>
            <Show when="signed-out">
              <div className="w-8 h-8 rounded-full bg-[#fde047] flex items-center justify-center text-black font-bold">
                 U
              </div>
            </Show>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
