"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTemplateAction } from "@/lib/actions/templates";
import { TemplateEditor } from "@/components/admin/templates/TemplateEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, LayoutTemplate } from "lucide-react";
import type {
  Template,
  TemplateSlot,
  SlotType,
} from "@/lib/types/database.types";

type TemplateWithSlots = Template & { template_slots: TemplateSlot[] };
const supabase = createClient();

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateWithSlots[]>([]);
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"daily" | "weekly">("daily");
  const [pending, startTransition] = useTransition();

  async function load() {
    const { data: adminData } = await supabase
      .from("admins")
      .select("office_id")
      .single();

    if (!adminData) return;

    const [{ data: ts }, { data: sts }] = await Promise.all([
      supabase
        .from("templates")
        .select("*, template_slots(*)")
        .eq("office_id", adminData.office_id)
        .order("created_at"),
      supabase
        .from("slot_types")
        .select("*")
        .eq("office_id", adminData.office_id)
        .eq("is_active", true),
    ]);

    setTemplates((ts as TemplateWithSlots[]) ?? []);
    setSlotTypes(sts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const { data: adminData } = await supabase
        .from("admins")
        .select("office_id")
        .single();

      if (!adminData) return;

      const [{ data: ts }, { data: sts }] = await Promise.all([
        supabase
          .from("templates")
          .select("*, template_slots(*)")
          .eq("office_id", adminData.office_id)
          .order("created_at"),
        supabase
          .from("slot_types")
          .select("*")
          .eq("office_id", adminData.office_id)
          .eq("is_active", true),
      ]);

      setTemplates((ts as TemplateWithSlots[]) ?? []);
      setSlotTypes(sts ?? []);
      setLoading(false);
    }

    init();
  }, []);

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName);
      formData.set("type", newType);
      const result = await createTemplateAction(formData);
      if (result.success) {
        toast.success("Template created");
        setOpen(false);
        setNewName("");
        setNewType("daily");
        load();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading templates…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build reusable daily and weekly slot patterns.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              New template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New template</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder="e.g. Standard Monday, Full week"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as "daily" | "weekly")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      Daily — pattern for a single day
                    </SelectItem>
                    <SelectItem value="weekly">
                      Weekly — pattern for a full week
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={pending || !newName.trim()}
                >
                  {pending ? "Creating…" : "Create template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <LayoutTemplate className="w-10 h-10 opacity-30" />
          <p className="text-sm">No templates yet.</p>
          <p className="text-xs">
            Create a template to quickly populate your calendar with slots.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {templates.map((t) => (
            <TemplateEditor
              key={t.id}
              template={t}
              slotTypes={slotTypes}
              onDeleted={load}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
