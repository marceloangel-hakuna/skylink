"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";

const INITIAL_MESSAGES = [
  { id: "1", sender: "other", text: "Hey! I noticed we're both in the business cabin. Are you headed to the SF tech summit?", time: "10:24 AM" },
  { id: "2", sender: "me",    text: "Yes! Small world. I'm speaking on the AI panel Saturday morning.", time: "10:26 AM" },
  { id: "3", sender: "other", text: "That's amazing! I'll definitely be there. I'm Sarah — CTO at Vertex AI.", time: "10:27 AM" },
  { id: "4", sender: "me",    text: "Great to meet you! I saw your talk at NeurIPS last year.", time: "10:28 AM" },
  { id: "5", sender: "other", text: "That sounds like a great opportunity! Let's connect at the lounge.", time: "10:30 AM" },
];

export default function ConversationPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "me", text, time: "Now" },
    ]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      <PageHeader
        title="Sarah Chen"
        subtitle="CTO at Vertex AI · Seat 3A"
        showBack
        action={
          <button className="p-2 rounded-full active:bg-surface-muted transition text-slate-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm ${
                msg.sender === "me"
                  ? "gradient-card text-white rounded-br-sm"
                  : "bg-surface-card text-navy-900 shadow-card rounded-bl-sm"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-sky-200" : "text-slate-400"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 glass border-t border-surface-border"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="input-field flex-1"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center active:scale-90 transition disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
