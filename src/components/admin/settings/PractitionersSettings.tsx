"use client";

import { useState, useTransition } from "react";
import {
  upsertPractitionerAction,
  togglePractitionerAction,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import type { Practitioner } from "@/lib/types/database.types";

export function PractitionersSettings({
  practitioners,
}: {
  practitioners: Practitioner[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Practitioner | null>(null);
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(p: Practitioner) {
    setEditing(p);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertPractitionerAction(formData);
      if (result.success) {
        toast.success(editing ? "Practitioner updated" : "Practitioner added");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(p: Practitioner) {
    startTransition(async () => {
      const result = await togglePractitionerAction(p.id, !p.is_active);
      if (result.success) {
        toast.success(
          p.is_active ? "Practitioner deactivated" : "Practitioner activated"
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {practitioners.length} practitioner
          {practitioners.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add practitioner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit practitioner" : "Add practitioner"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="flex flex-col gap-4 mt-2">
              {editing && <input type="hidden" name="id" value={editing.id} />}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input
                  id="p-email"
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                  placeholder="optional"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-bio">Bio</Label>
                <Textarea
                  id="p-bio"
                  name="bio"
                  defaultValue={editing?.bio ?? ""}
                  placeholder="optional"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Add practitioner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {practitioners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">
              No practitioners yet. Add one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {practitioners.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {p.email && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.email}
                    </p>
                  )}
                  {p.bio && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.bio}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(p)}
                    disabled={pending}
                  >
                    {p.is_active ? (
                      <UserX className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
