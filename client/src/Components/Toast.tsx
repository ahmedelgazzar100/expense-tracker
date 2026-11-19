import { useEffect } from "react";
import "../styling/toast.css";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer); // cleanup function work  if component hide or if depen change
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="toast-container">
      <span className="toast-icon">✓</span>
      <span className="toast-text">{message}</span>
    </div>
  );
}
