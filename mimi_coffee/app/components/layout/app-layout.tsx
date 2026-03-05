"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { AppSidebar } from "./app-sidebar";
import { LogOut, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { AIChatWidget } from "../chat/ai-chat-widget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const displayName = session?.user?.name || "Mimi";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground font-display">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                  aria-label="Open account menu"
                >
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {displayName}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{avatarInitial}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-background">{children}</main>
      </div>

      <AIChatWidget />
    </div>
  );
}
