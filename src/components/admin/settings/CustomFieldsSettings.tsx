"use client";

import { useState, useTransition, useRef, KeyboardEvent } from "react";
import {
  upsertCustomFieldAction,
  toggleCustomFieldAction,
  updateCustomFieldsOrderAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, GripVertical, X } from "lucide-react";
import type { CustomField } from "@/lib/types/database.types";

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
  select: "Select (dropdown)",
};

export function CustomFieldsSettings({
  customFields,
}: {
  customFields: CustomField[];
}) {
  const [fields, setFields] = useState(customFields);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [pending, startTransition] = useTransition();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  function openAdd() {
    setEditing(null);
    setFieldType("text");
    setIsRequired(false);
    setOptions([]);
    setOptionInput("");
    setOpen(true);
  }

  function openEdit(f: CustomField) {
    setEditing(f);
    setFieldType(f.field_type);
    setIsRequired(f.is_required);
    setOptions(Array.isArray(f.options) ? (f.options as string[]) : []);
    setOptionInput("");
    setOpen(true);
  }

  function addOption() {
    const val = optionInput.trim();
    if (!val || options.includes(val)) return;
    setOptions((prev) => [...prev, val]);
    setOptionInput("");
  }

  function removeOption(opt: string) {
    setOptions((prev) => prev.filter((o) => o !== opt));
  }

  function handleOptionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption();
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("field_type", fieldType);
    formData.set("is_required", String(isRequired));
    if (fieldType === "select") {
      formData.set("options", JSON.stringify(options));
    }

    startTransition(async () => {
      const result = await upsertCustomFieldAction(formData);
      if (result.success) {
        toast.success(editing ? "Field updated" : "Field added");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(f: CustomField) {
    startTransition(async () => {
      const result = await toggleCustomFieldAction(f.id, !f.is_active);
      if (result.success) {
        setFields((prev) =>
          prev.map((x) =>
            x.id === f.id ? { ...x, is_active: !f.is_active } : x
          )
        );
        toast.success(f.is_active ? "Field deactivated" : "Field activated");
      } else {
        toast.error(result.error);
      }
    });
  }

  // Drag and drop reordering
  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
    if (dragItem.current === null || dragItem.current === index) return;
    const updated = [...fields];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(index, 0, dragged);
    dragItem.current = index;
    setFields(updated);
  }

  function handleDragEnd() {
    dragItem.current = null;
    dragOverItem.current = null;
    startTransition(async () => {
      await updateCustomFieldsOrderAction(fields.map((f) => f.id));
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {fields.length === 0
            ? "No custom fields. Add fields clients must fill in when booking."
            : `${fields.length} field${fields.length !== 1 ? "s" : ""} — drag to reorder`}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit field" : "Add custom field"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="flex flex-col gap-4 mt-2">
              {editing && <input type="hidden" name="id" value={editing.id} />}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cf-label">Label</Label>
                <Input
                  id="cf-label"
                  name="label"
                  defaultValue={editing?.label ?? ""}
                  placeholder="e.g. Insurance ID, Date of birth"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Field type</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fieldType === "select" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={handleOptionKeyDown}
                      placeholder="Type option, press Enter"
                    />
                    <Button type="button" variant="outline" onClick={addOption}>
                      Add
                    </Button>
                  </div>
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {options.map((opt) => (
                        <span
                          key={opt}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-sm"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => removeOption(opt)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Required</p>
                  <p className="text-xs text-muted-foreground">
                    Clients must fill this in to complete a booking
                  </p>
                </div>
                <Switch checked={isRequired} onCheckedChange={setIsRequired} />
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
                  {pending ? "Saving…" : editing ? "Save changes" : "Add field"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-col gap-2">
          {fields.map((f, index) => (
            <Card
              key={f.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="cursor-grab active:cursor-grabbing"
            >
              <CardContent className="flex items-center gap-3 py-4">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{f.label}</p>
                    <Badge variant="outline" className="text-xs">
                      {FIELD_TYPE_LABELS[f.field_type]}
                    </Badge>
                    {f.is_required && (
                      <Badge variant="default" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {!f.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {f.field_type === "select" && Array.isArray(f.options) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Options: {(f.options as string[]).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(f)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(f)}
                    disabled={pending}
                  >
                    <Badge
                      variant={f.is_active ? "secondary" : "default"}
                      className="text-xs cursor-pointer"
                    >
                      {f.is_active ? "Deactivate" : "Activate"}
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
