"use client";

import { useState } from "react";
import { Plus, Filter, RefreshCw, Copy, Activity, Clock, BarChart3 } from "lucide-react";

export default function WebhooksPage() {
  const [selectedWebhook, setSelectedWebhook] = useState(0);

  const webhooks = [
    {
      name: "Stripe-Payment-Success",
      url: "https://api.hookshot.io/v1/stripe/inbound...",
      events: ["PAYMENT_SUCCEEDED"],
      status: "active",
    },
    {
      name: "Github-Repo-Push",
      url: "https://webhooks.example.com/github/push",
      events: ["PUSH_EVENT", "+2"],
      status: "active",
    },
    {
      name: "Auth0-User-Signup",
      url: "https://internal.service/provisioning",
      events: ["USER_CREATED"],
      status: "warning",
    },
    {
      name: "Intercom-Ping-Test",
      url: "https://dev.null/ping",
      events: ["PING"],
      status: "inactive",
    }
  ];

  return (
    <div className="p-8 md:p-10 max-w-[1200px] w-full mx-auto flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Webhooks</h1>
          <p className="text-neutral-400 text-[15px]">
            Manage and monitor real-time data delivery streams.
          </p>
        </div>
        <button className="bg-[#fde047] text-black px-5 py-2.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-[#fce96a] transition-colors shrink-0 shadow-[0_0_15px_-3px_rgba(253,224,71,0.3)]">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> CREATE NEW WEBHOOK
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              Active Webhooks
            </div>
            <Activity className="w-4 h-4 text-[#fde047]" />
          </div>
          <div className="text-4xl font-bold text-white">12</div>
        </div>
        
        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              Success Rate (24h)
            </div>
            <BarChart3 className="w-4 h-4 text-[#fde047]" />
          </div>
          <div className="text-4xl font-bold text-white">99.98%</div>
        </div>

        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              Avg Delivery Time
            </div>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="text-4xl font-bold text-white">142ms</div>
        </div>
      </div>

      {/* Data Stream Registry */}
      <div className="border border-neutral-800 bg-[#111] rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#161616]">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            Data Stream Registry
          </div>
          <div className="flex items-center gap-4">
            <button className="text-neutral-500 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="text-neutral-500 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-800 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-5">URL Endpoint</div>
          <div className="col-span-3">Events</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        <div className="divide-y divide-neutral-800">
          {webhooks.map((hook, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedWebhook(idx)}
              className={`grid grid-cols-12 gap-4 px-6 py-5 items-center cursor-pointer transition-colors ${selectedWebhook === idx ? 'bg-white/[0.03]' : 'hover:bg-white/[0.015]'}`}
            >
              <div className="col-span-3 min-w-0 flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${hook.status === 'active' ? 'bg-green-500' : hook.status === 'warning' ? 'bg-[#fde047]' : 'bg-neutral-600'}`} />
                <div className="truncate text-[15px] font-semibold text-white leading-tight">
                  {hook.name.split('-').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </div>
              </div>
              <div className="col-span-5 min-w-0">
                <div className="truncate font-mono text-[13px] text-neutral-400">
                  {hook.url}
                </div>
              </div>
              <div className="col-span-3 flex flex-wrap gap-2">
                {hook.events.map((ev, i) => (
                  <span key={i} className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded text-[10px] font-mono font-medium tracking-wide">
                    {ev}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex justify-end">
                <div className={`w-2 h-2 rounded-sm ${hook.status === 'active' ? 'bg-green-500' : hook.status === 'warning' ? 'bg-[#fde047]' : 'bg-neutral-600'}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-[#161616] text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
          <div>Showing 4 of 12 Webhooks</div>
          <div className="flex gap-3">
            <button className="hover:text-white transition-colors">Previous</button>
            <span className="text-[#fde047]">01</span>
            <span>02</span>
            <span>03</span>
            <button className="hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Bottom Insights section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-neutral-800 bg-[#161616] rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Payload Insight</h2>
              <p className="text-sm text-neutral-400">Last successful JSON structure delivered to {webhooks[selectedWebhook]?.name || 'endpoint'}</p>
            </div>
            <button className="text-neutral-500 hover:text-white transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-md p-6 font-mono text-[13px] leading-loose text-neutral-300 overflow-x-auto flex-1">
            <div className="text-[#e2c08d]">{`{`}</div>
            <div className="pl-4">
              <span className="text-[#98c379]">"id"</span>: <span className="text-[#e5c07b]">"evt_1P8HjV2eZvKYLo2CRv9X"</span>,
            </div>
            <div className="pl-4">
              <span className="text-[#98c379]">"object"</span>: <span className="text-[#e5c07b]">"event"</span>,
            </div>
            <div className="pl-4">
              <span className="text-[#98c379]">"api_version"</span>: <span className="text-[#e5c07b]">"2023-10-16"</span>,
            </div>
            <div className="pl-4">
              <span className="text-[#98c379]">"created"</span>: <span className="text-[#d19a66]">17124123456</span>,
            </div>
            <div className="pl-4">
              <span className="text-[#98c379]">"data"</span>: <span className="text-[#e2c08d]">{`{`}</span>
            </div>
            <div className="pl-8">
              <span className="text-[#98c379]">"object"</span>: <span className="text-[#e2c08d]">{`{`}</span>
            </div>
            <div className="pl-12">
              <span className="text-[#98c379]">"id"</span>: <span className="text-[#e5c07b]">"pi_3P8HjU2eZvKYLo2C1W"</span>,
            </div>
            <div className="pl-12">
              <span className="text-[#98c379]">"amount"</span>: <span className="text-[#d19a66]">2000</span>,
            </div>
            <div className="pl-12">
              <span className="text-[#98c379]">"currency"</span>: <span className="text-[#e5c07b]">"usd"</span>,
            </div>
            <div className="pl-12">
              <span className="text-[#98c379]">"status"</span>: <span className="text-[#e5c07b]">"succeeded"</span>
            </div>
            <div className="pl-8 text-[#e2c08d]">{`}`}</div>
            <div className="pl-4 text-[#e2c08d]">{`},`}</div>
            <div className="pl-4">
              <span className="text-[#98c379]">"type"</span>: <span className="text-[#e5c07b]">"payment_intent.succeeded"</span>
            </div>
            <div className="text-[#e2c08d]">{`}`}</div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#fde047] rounded-lg p-8 flex flex-col justify-between text-black">
          <div>
            <div className="mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
                <path d="M20.5 2.5L21.3 5.7L24.5 6.5L21.3 7.3L20.5 10.5L19.7 7.3L16.5 6.5L19.7 5.7L20.5 2.5Z" fill="currentColor" />
                <path d="M4 17L4.5 19.5L7 20L4.5 20.5L4 23L3.5 20.5L1 20L3.5 19.5L4 17Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Automation<br/>Builder</h2>
            <p className="text-[15px] font-medium opacity-80 leading-relaxed">
              Connect your webhooks to over 400+ destinations using our low-latency delivery network. No configuration needed.
            </p>
          </div>
          <button className="mt-8 bg-black text-[#fde047] w-full py-4 rounded text-xs font-mono font-bold tracking-widest uppercase hover:bg-neutral-900 transition-colors">
            EXPLORE ECOSYSTEM
          </button>
        </div>
      </div>
    </div>
  );
}
