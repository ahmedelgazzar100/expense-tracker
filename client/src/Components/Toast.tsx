import { useEffect } from "react";
import "../styling/toast.css";

interface ToastProps {
  message: string;
  isVisible: boolean;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({
  message,
  type,
  isVisible,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer); // cleanup function work  if component hide or if depen change
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const icon = type === "error" ? "✕" : "✓";

  return (
    <div className="toast-container">
      <span className={type === "error" ? "toast-error" : "toast-success"}>
        {icon}
      </span>
      <span className="toast-text">{message}</span>
    </div>
  );
}
