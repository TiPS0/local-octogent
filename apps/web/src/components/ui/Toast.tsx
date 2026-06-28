import { useEffect } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export type ToastMessage = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

type ToastProps = {
  toast: ToastMessage;
  onClose: (id: string) => void;
};

export const Toast = ({ toast, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor =
    toast.type === "error"
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : toast.type === "success"
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-blue-500/10 border-blue-500/20 text-blue-400";

  const Icon = toast.type === "error" ? AlertCircle : CheckCircle;

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${bgColor}`}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 rounded p-1 opacity-70 hover:bg-white/10 hover:opacity-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
