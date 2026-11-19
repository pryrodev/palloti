"use client";

import { useState, type ReactNode } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDeleteActionProps = {
  children: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void | boolean | Promise<void | boolean>;
  confirmLabel?: string;
  triggerAriaLabel?: string;
  triggerSize?: "sm" | "icon-sm";
  triggerVariant?: "destructive" | "ghost";
  className?: string;
  disabled?: boolean;
};

export default function ConfirmDeleteAction({
  children,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  triggerAriaLabel,
  triggerSize = "sm",
  triggerVariant = "destructive",
  className,
  disabled = false,
}: ConfirmDeleteActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await onConfirm();
      if (result !== false) setOpen(false);
      else setError("The action could not be completed. Try again.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action could not be completed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return <AlertDialog.Root open={open} onOpenChange={(nextOpen) => {
    if (!pending) {
      setOpen(nextOpen);
      if (nextOpen) setError("");
    }
  }}>
    <AlertDialog.Trigger render={<Button
      type="button"
      size={triggerSize}
      variant={triggerVariant}
      disabled={disabled || pending}
      aria-label={triggerAriaLabel}
      className={className}
    />}>
      {children}
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[60] flex w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-border bg-background p-4 text-foreground shadow-lg">
        <div className="flex flex-col gap-1">
          <AlertDialog.Title className="text-base font-semibold tracking-tight">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground">{description}</AlertDialog.Description>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <AlertDialog.Close render={<Button type="button" size="sm" variant="outline" disabled={pending} />}>Cancel</AlertDialog.Close>
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => void confirm()}>
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
