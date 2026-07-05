import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export type LogType = "stdout" | "stderr" | "info";

export interface LogLine {
  id: number;
  text: string;
  type: LogType;
}

export interface ConsoleContextType {
  logs: LogLine[];
  write: (text: string, type?: LogType) => void;
  clear: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | null>(null);

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole must be used within ConsoleProvider");
  return ctx;
}

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const idRef = useRef(0);

  const write = (text: string, type: LogType = "stdout") => {
    setLogs((prev) => [...prev.slice(-200), { id: idRef.current++, text, type }]);
  };

  const clear = () => setLogs([]);

  return (
    <ConsoleContext.Provider value={{ logs, write, clear }}>
      {children}
    </ConsoleContext.Provider>
  );
}
