"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Briefcase,
  LayoutDashboard,
  Upload,
  Phone,
  User,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { href: "/upload", label: "Upload & Extract", icon: Upload, short: "Upload" },
  { href: "/todos", label: "Call Todos", icon: Phone, short: "Calls" },
  { href: "/profile", label: "Profile", icon: User, short: "Profile" },
  { href: "/history", label: "Email History", icon: History, short: "History" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ── Desktop / Tablet fixed sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-slate-900 w-16 lg:w-60">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight hidden lg:block">
            JobSeeker Pro
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1 px-2 lg:px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
                {/* Tooltip — tablet only */}
                <span className="lg:hidden absolute left-full ml-3 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-xl">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 lg:px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            title="Sign out"
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Sign out</span>
            <span className="lg:hidden absolute left-full ml-3 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-xl">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile: fixed top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-slate-900 px-4 h-14 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">JobSeeker Pro</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile: fixed bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 flex items-center justify-around px-1 h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all",
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-medium leading-none">{item.short}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile: slide-in drawer ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">JobSeeker Pro</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
