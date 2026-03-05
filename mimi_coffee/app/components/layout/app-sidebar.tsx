"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, Users, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { title: "Customers", href: "/customers", icon: <Users className="w-4 h-4" /> },
  { title: "Campaigns", href: "/campaigns", icon: <Megaphone className="w-4 h-4" /> },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 min-h-screen bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="block font-semibold text-lg font-display text-sidebar-foreground">
                  Kopi Kita CRM
                </span>
                <span className="block text-xs text-muted-foreground">Promo Helper</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                >
                  {item.icon}
                  {item.title}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground">(c) 2026 Mimi&apos;s Coffee Shop</p>
          </div>
        </div>
      </aside>
    </>
  );
}
