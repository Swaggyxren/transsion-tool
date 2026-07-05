import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  command: string;
  description: string;
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  command,
  description,
  warning,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-surface border border-outline rounded p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-2 text-on-surface">
          {title}
        </h2>
        <p className="text-sm mb-4 text-on-surface-variant">
          {description}
        </p>

        <div className="bg-surface border border-outline rounded p-3 mb-4 font-mono text-xs text-on-surface-variant/80 break-all">
          {command}
        </div>

        {warning && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded p-3 mb-4 text-sm">
            ⚠ {warning}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-outline bg-surface hover:bg-primary/20 text-on-surface text-sm font-bold active:scale-95 duration-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded border border-red-500 bg-red-500 text-white hover:brightness-110 text-sm font-bold active:scale-95 duration-100"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
