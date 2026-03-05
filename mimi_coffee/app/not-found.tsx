"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", window.location.pathname);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center bg-card border border-border rounded-xl shadow-card px-10 py-12">
        <h1 className="mb-3 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-5 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
