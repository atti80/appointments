"use client";

import { useTransition } from "react";
import { updateOfficeAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { Office } from "@/lib/types/database.types";

export function OfficeSettings({ office }: { office: Office }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateOfficeAction(formData);
      if (result.success) {
        toast.success("Office settings saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>
            Basic information about your practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Practice name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={office.name}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {process.env.NEXT_PUBLIC_APP_URL}/
                </span>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={office.slug}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the URL your clients will use to book appointments.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="welcome_message">Welcome message</Label>
              <Textarea
                id="welcome_message"
                name="welcome_message"
                defaultValue={office.welcome_message ?? ""}
                placeholder="Welcome! Book your appointment below."
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brand_color">Brand color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="brand_color"
                  name="brand_color"
                  defaultValue={office.brand_color ?? "#6470f3"}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  Used on the public booking page and sidebar
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="self-start mt-2"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking configuration</CardTitle>
          <CardDescription>
            Control timing and timeout behaviour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="default_slot_minutes">
                  Default slot length (min)
                </Label>
                <Input
                  id="default_slot_minutes"
                  name="default_slot_minutes"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={office.default_slot_minutes}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking_timeout_minutes">
                  Booking timeout (min)
                </Label>
                <Input
                  id="booking_timeout_minutes"
                  name="booking_timeout_minutes"
                  type="number"
                  min={5}
                  defaultValue={office.booking_timeout_minutes}
                />
                <p className="text-xs text-muted-foreground">
                  How long a client has to complete their booking
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cancellation_cutoff_minutes">
                  Cancellation cutoff (min)
                </Label>
                <Input
                  id="cancellation_cutoff_minutes"
                  name="cancellation_cutoff_minutes"
                  type="number"
                  min={0}
                  defaultValue={office.cancellation_cutoff_minutes}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. 1440 = clients cannot cancel within 24h
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reminder_minutes_before">
                  Reminder timing (min before)
                </Label>
                <Input
                  id="reminder_minutes_before"
                  name="reminder_minutes_before"
                  type="number"
                  min={0}
                  defaultValue={office.reminder_minutes_before}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. 1440 = send reminder 24h before
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="self-start mt-2"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
