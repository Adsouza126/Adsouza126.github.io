"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Compass, Users, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Discover", icon: Compass },
  { href: "/communities", label: "Communities", icon: Users },
];

/** Top navigation for signed-in areas of the app. */
export function Navbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    // In demo mode there's no real session to clear.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-100",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-ink-100 md:flex"
          >
            <Avatar name={profile.full_name} url={profile.avatar_url} size={32} />
            <span className="text-sm font-medium text-ink-700">
              {profile.full_name?.split(" ")[0] ?? "Profile"}
            </span>
          </Link>
          <button
            onClick={signOut}
            className="hidden rounded-xl p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 md:block"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-xl p-2 text-ink-700 hover:bg-ink-100 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="space-y-1 border-t border-ink-200 px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Avatar name={profile.full_name} url={profile.avatar_url} size={20} />
            Profile
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </nav>
      ) : null}
    </header>
  );
}
