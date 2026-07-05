import type { ReactNode } from "react";

interface ActionButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "filled" | "tonal" | "outlined";
  title?: string;
}

interface ButtonGridProps {
  buttons: ActionButton[];
}

export default function ButtonGrid({ buttons }: ButtonGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {buttons.map((btn, i) => {
        const isPrimary = btn.variant === "filled" || !btn.variant;
const base = `flex flex-col items-center justify-center gap-2 p-4 rounded text-sm font-bold transition-all border ${
          isPrimary
            ? "bg-primary border-primary text-on-primary hover:brightness-110"
            : "bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary"
        }`;
        const disabled = btn.disabled ? " opacity-30 cursor-not-allowed" : " active:scale-95 duration-100";

        return (
          <button
            key={i}
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            className={base + disabled}
          >
            {btn.icon && <span className="text-xl">{btn.icon}</span>}
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}
