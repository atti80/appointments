"use client";

import { useState, useTransition } from "react";
import {
  updateTemplateAction,
  deleteTemplateAction,
  deleteTemplateSlotAction,
} from "@/lib/actions/templates";
import { TemplateSlotForm } from "./TemplateSlotForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type {
  Template,
  TemplateSlot,
  SlotType,
} from "@/lib/types/database.types";

const DAY_NAMES: Record<string, string> = {
  "0": "Sun",
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
};

interface TemplateEditorProps {
  template: Template & { template_slots: TemplateSlot[] };
  slotTypes: SlotType[];
  onDeleted: () => void;
  onRefresh: () => void; // add this
}

export function TemplateEditor({
  template,
  slotTypes,
  onDeleted,
  onRefresh,
}: TemplateEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(template.name);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TemplateSlot | null>(null);
  const [pending, startTransition] = useTransition();

  // Sort slots: by day_of_week then start_time
  const sortedSlots = [...template.template_slots].sort((a, b) => {
    const dayA = parseInt(a.day_of_week ?? "0");
    const dayB = parseInt(b.day_of_week ?? "0");
    if (dayA !== dayB) return dayA - dayB;
    return a.start_time.localeCompare(b.start_time);
  });

  function handleSaveName() {
    if (!name.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", template.id);
      formData.set("name", name);
      const result = await updateTemplateAction(formData);
      if (result.success) {
        toast.success("Template renamed");
        setEditingName(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteSlot(id: string) {
    startTransition(async () => {
      const result = await deleteTemplateSlotAction(id);
      if (result.success) {
        toast.success("Slot removed");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteTemplate() {
    startTransition(async () => {
      const result = await deleteTemplateAction(template.id);
      if (result.success) {
        toast.success("Template deleted");
        onDeleted();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} disabled={pending}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingName(false);
                  setName(template.name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium">{name}</span>
              <Badge
                variant={template.type === "weekly" ? "default" : "secondary"}
                className="text-xs"
              >
                {template.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {sortedSlots.length} slot{sortedSlots.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Actions */}
          {!editingName && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingName(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete template?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>{name}</strong> and
                      all its slots. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTemplate}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-3 pt-0">
          {/* Slot list */}
          {sortedSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No slots yet. Add one below.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {sortedSlots.map((slot) => (
                <div key={slot.id}>
                  {editingSlot?.id === slot.id ? (
                    <TemplateSlotForm
                      templateId={template.id}
                      templateType={template.type}
                      slotTypes={slotTypes}
                      editing={slot}
                      onDone={() => {
                        setEditingSlot(null);
                        onRefresh();
                      }}
                      onCancel={() => setEditingSlot(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      <div className="flex-1 flex items-center gap-3 min-w-0 text-sm">
                        {slot.day_of_week && (
                          <span className="text-xs font-medium text-muted-foreground w-8">
                            {DAY_NAMES[slot.day_of_week]}
                          </span>
                        )}
                        <span className="font-mono">
                          {slot.start_time.slice(0, 5)} –{" "}
                          {slot.end_time.slice(0, 5)}
                        </span>
                        {slot.slot_type_id && (
                          <span className="text-xs text-muted-foreground truncate">
                            {
                              slotTypes.find((s) => s.id === slot.slot_type_id)
                                ?.name
                            }
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingSlot(slot);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove slot?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove the {slot.start_time.slice(0, 5)}–
                                {slot.end_time.slice(0, 5)} slot from this
                                template?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add slot form */}
          {showAddForm ? (
            <TemplateSlotForm
              templateId={template.id}
              templateType={template.type}
              slotTypes={slotTypes}
              onDone={() => {
                setShowAddForm(false);
                onRefresh();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            !editingSlot && (
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add slot
              </Button>
            )
          )}
        </CardContent>
      )}
    </Card>
  );
}
