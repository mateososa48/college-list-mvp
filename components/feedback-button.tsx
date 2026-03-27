"use client";

import { useState } from "react";
import { ChatBubbleLeftEllipsisIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setLoading(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setLoading(false);
    setSent(true);
    setMessage("");
    setTimeout(() => { setOpen(false); setSent(false); }, 2000);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Share feedback"
        className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full transition-all hover:bg-stone-200"
        style={{ color: "#A8A29E" }}
      >
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div
            className="w-80 rounded-2xl border shadow-2xl pointer-events-auto overflow-hidden"
            style={{ backgroundColor: "white", borderColor: "#E7E5E4" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E7E5E4" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Share feedback</p>
                <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>Ideas, bugs, or anything else</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-stone-100 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" style={{ color: "#78716C" }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {sent ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Thanks for the feedback!</p>
                </div>
              ) : (
                <>
                  <textarea
                    autoFocus
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    className="w-full text-sm rounded-lg border px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 transition-shadow"
                    style={{ borderColor: "#E7E5E4", color: "#1A1A1A", backgroundColor: "#FAFAF9" }}
                  />
                  <button
                    onClick={submit}
                    disabled={loading || !message.trim()}
                    className="mt-3 w-full h-9 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "#1E3A8A", color: "white" }}
                  >
                    {loading ? "Sending..." : "Send feedback"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
