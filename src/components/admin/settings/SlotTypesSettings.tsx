"use client";

import { useState, useTransition } from "react";
import {
  upsertSlotTypeAction,
  toggleSlotTypeAction,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Clock } from "lucide-react";
import type { SlotType } from "@/lib/types/database.types";

export function SlotTypesSettings({ slotTypes }: { slotTypes: SlotType[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SlotType | null>(null);
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(s: SlotType) {
    setEditing(s);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertSlotTypeAction(formData);
      if (result.success) {
        toast.success(editing ? "Slot type updated" : "Slot type added");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(s: SlotType) {
    startTransition(async () => {
      const result = await toggleSlotTypeAction(s.id, !s.is_active);
      if (result.success) {
        toast.success(
          s.is_active ? "Slot type deactivated" : "Slot type activated"
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
          {slotTypes.length === 0
            ? "No slot types defined — default slot length will be used."
            : `${slotTypes.length} slot type${slotTypes.length !== 1 ? "s" : ""}`}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add slot type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit slot type" : "Add slot type"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="flex flex-col gap-4 mt-2">
              {editing && <input type="hidden" name="id" value={editing.id} />}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-name">Name</Label>
                <Input
                  id="st-name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="e.g. First visit, Follow-up"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-duration">Duration (minutes)</Label>
                <Input
                  id="st-duration"
                  name="duration_minutes"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={editing?.duration_minutes ?? 30}
                  required
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
                      : "Add slot type"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {slotTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          {slotTypes.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {s.duration_minutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(s)}
                    disabled={pending}
                  >
                    <Badge
                      variant={s.is_active ? "secondary" : "default"}
                      className="text-xs cursor-pointer"
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </Badge>
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
