"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadLogoAction } from "@/lib/actions/settings";
import { sendInviteAction } from "@/lib/actions/auth";
import { UserPlus } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "../ui/button";

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
  const [logoutPending, startLogoutTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    office?.logo_url ?? null
  );
  const [uploadPending, startUploadTransition] = useTransition();
  const [invitePending, startInviteTransition] = useTransition();

  function handleLogoClick() {
    fileInputRef.current?.click();
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("logo", file);
    startUploadTransition(async () => {
      const result = await uploadLogoAction(formData);
      if (result.success && result.data) {
        setLogoUrl(result.data.logo_url);
        toast.success("Logo updated");
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to upload logo");
      }
    });
  }

  function handleInviteSubmit(formData: FormData) {
    setInviteError(null);
    startInviteTransition(async () => {
      const result = await sendInviteAction(formData);
      if (result.success) {
        setInviteSuccess(true);
        setInviteEmail("");
      } else {
        setInviteError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleLogout() {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-background border-r h-full">
      {/* Office header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            disabled={uploadPending}
            className="relative w-8 h-8 rounded-lg shrink-0 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
            title="Click to upload logo"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Office logo"
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: office?.brand_color ?? "#6470f3" }}
              >
                {office?.name?.charAt(0)?.toUpperCase() ?? "O"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[9px] font-medium">Upload</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setInviteSuccess(false);
              setInviteError(null);
              setInviteOpen(true);
            }}
            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            Invite admin
          </button>
          <button
            onClick={handleLogout}
            disabled={logoutPending}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite admin</DialogTitle>
          </DialogHeader>
          {inviteSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Invite sent!</p>
              <p className="text-xs text-muted-foreground">
                They&apos;ll receive an email with a link to set up their
                account.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInviteSuccess(false);
                  setInviteOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <form
              action={handleInviteSubmit}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              {inviteError && (
                <p className="text-sm text-destructive">{inviteError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={invitePending}>
                  {invitePending ? "Sending…" : "Send invite"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}
