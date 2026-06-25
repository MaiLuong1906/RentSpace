"use client";

import { Loader2, FileCheck2, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { contractApi } from "@/lib/api/contract.api";

interface SignConfirmModalProps {
  open: boolean;
  onClose: () => void;
  contractId: number;
  contractTitle: string;
}

export function SignConfirmModal({
  open,
  onClose,
  contractId,
  contractTitle,
}: SignConfirmModalProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => contractApi.sign(contractId),
    onSuccess: () => {
      toast.success("Ký hợp đồng thành công!");
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["my-contracts"] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message ?? "Ký hợp đồng thất bại. Vui lòng thử lại."
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Xác nhận ký hợp đồng</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">{contractTitle}</p>
              <p className="mt-1 text-xs text-blue-600">
                Bằng cách ký, bạn đồng ý với toàn bộ điều khoản trong hợp đồng này.
                Chữ ký điện tử có giá trị pháp lý theo quy định của pháp luật Việt Nam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
            Chữ ký được xác thực và lưu trữ an toàn bởi RentSpace.
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đọc lại
            </button>
            <button
              disabled={isPending}
              onClick={() => mutate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  Ký hợp đồng
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
