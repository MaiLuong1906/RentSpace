"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, LogIn, Home } from "lucide-react";
import { useRouteGuardStore } from "@/store/routeGuardStore";

export function RouteGuardModal() {
  const { isOpen, config, hideModal } = useRouteGuardStore();
  const router = useRouter();

  if (!isOpen) return null;

  const handlePrimary = () => {
    hideModal();
    router.push(config.primaryHref);
  };

  const handleSecondary = () => {
    hideModal();
    if (config.secondaryHref) {
      router.push(config.secondaryHref);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 bg-blue-50 p-3 rounded-2xl border border-blue-100">
          <ShieldAlert className="h-6 w-6 text-blue-600 shrink-0" />
          <h3 className="text-base font-extrabold text-blue-800">{config.title}</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
          {config.message}
        </p>
        <div className="flex gap-3">
          {config.secondaryLabel && (
            <button
              type="button"
              onClick={handleSecondary}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              {config.secondaryHref === "/" && <Home className="h-4 w-4" />}
              {config.secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimary}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-sm font-semibold rounded-2xl transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            {config.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
