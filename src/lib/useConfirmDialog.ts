import { useCallback, useState } from "react";

interface ConfirmState {
  title: string;
  command: string;
  description: string;
  warning?: string;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const requestConfirm = useCallback(
    (
      title: string,
      command: string,
      description: string,
      warning: string | undefined,
      action: () => void
    ) => {
      setConfirm({ title, command, description, warning, onConfirm: action });
    },
    []
  );

  const dismissConfirm = useCallback(() => {
    setConfirm(null);
  }, []);

  const executeConfirm = useCallback(() => {
    confirm?.onConfirm();
    setConfirm(null);
  }, [confirm]);

  return { confirm, requestConfirm, dismissConfirm, executeConfirm };
}
