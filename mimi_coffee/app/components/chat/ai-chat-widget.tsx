"use client";

import { useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your CRM Assistant. Ask me anything about your customers, campaigns, or marketing strategy.",
      isUser: false,
    },
  ]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageText = input;
    setInput("");

    try {
      setSending(true);

      const response = await api.sendChatMessage(
        messageText,
        messages.map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        }))
      );

      const aiMsg: Message = {
        id: Date.now() + 1,
        text: response.message,
        isUser: false,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I apologize, but I'm having trouble connecting right now. Please try again!",
          isUser: false,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] bg-card border border-border rounded-2xl shadow-elevated flex flex-col animate-in slide-in-from-bottom-5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
            <div>
              <p className="text-sm font-semibold text-foreground">
                CRM Assistant
              </p>
              <p className="text-xs text-muted-foreground">AI-powered insights</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.isUser
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md border border-border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed bg-muted text-muted-foreground rounded-bl-md border border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground text-center px-4 py-1">
            AI responses are based on your CRM data
          </p>
          
          <div className="p-3 border-t border-border flex gap-2 bg-card">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your customers..."
              className="h-9 text-sm bg-card"
              disabled={sending}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={sending || !input.trim()}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
