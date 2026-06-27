"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface NavigationConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDirty?: boolean;
}

export function NavigationConfirmModal({
  isOpen,
  title = "Xác nhận rời khỏi trang",
  message = "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này? Mọi dữ liệu đã nhập sẽ bị mất.",
  confirmLabel = "Rời trang",
  cancelLabel = "Ở lại",
  onConfirm,
  onCancel,
  isDirty = false,
}: NavigationConfirmModalProps) {
  // Chặn reload tab / tắt browser
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 text-amber-600 mb-4 bg-amber-50 p-3 rounded-2xl border border-amber-100">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h3 className="text-base font-extrabold text-amber-800">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 transition active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 text-sm font-semibold rounded-2xl transition active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
