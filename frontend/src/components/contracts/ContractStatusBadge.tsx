import { ContractStatus } from "@/lib/api/contract.api";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  DRAFT:               { label: "Bản nháp",      className: "bg-gray-100 text-gray-600" },
  PENDING_SIGNATURES:  { label: "Chờ ký",         className: "bg-amber-100 text-amber-700" },
  FULLY_SIGNED:        { label: "Đã ký đầy đủ",   className: "bg-green-100 text-green-700" },
  CANCELLED:           { label: "Đã hủy",          className: "bg-red-100 text-red-600" },
  EXPIRED:             { label: "Hết hạn",         className: "bg-gray-100 text-gray-500" },
};

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
