"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarCheck2,
  Users,
  UserSquare2,
  LayoutTemplate,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarCheck2,
  },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  {
    label: "Practitioners",
    href: "/dashboard/practitioners",
    icon: UserSquare2,
  },
  { label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  admin: { name: string; email: string };
  office: { name: string; logo_url: string | null; brand_color: string } | null;
}

export function Sidebar({ admin, office }: SidebarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-background border-r h-full">
      {/* Office header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ backgroundColor: office?.brand_color ?? "#6470f3" }}
          >
            {office?.name?.charAt(0)?.toUpperCase() ?? "O"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {office?.name ?? "My Office"}
            </p>
            <p className="text-xs text-muted-foreground">Admin dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {active && (
                <ChevronRight className="w-3 h-3 ml-auto text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin footer */}
      <div className="px-2 py-3 border-t">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium truncate">{admin.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {admin.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={pending}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground",
            "hover:bg-destructive/10 hover:text-destructive transition-colors",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
