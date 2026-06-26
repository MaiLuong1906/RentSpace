"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Loader2,
} from "lucide-react";
import { contractApi, ContractDetail } from "@/lib/api/contract.api";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { SignConfirmModal } from "@/components/contracts/SignConfirmModal";
import { ContractAiPanel } from "@/components/ai/ContractAiPanel";

function SignatureRow({
  label,
  signedAt,
}: {
  label: string;
  signedAt?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      {signedAt ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Đã ký {new Date(signedAt).toLocaleDateString("vi-VN")}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-amber-600">
          <Clock className="h-4 w-4" />
          Chưa ký
        </span>
      )}
    </div>
  );
}

const AI_ELIGIBLE_STATUSES: ContractDetail["status"][] = [
  "PENDING_SIGNATURES",
  "FULLY_SIGNED",
];

export default function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [showSign, setShowSign] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["contract", Number(id)],
    queryFn: () => contractApi.getContract(Number(id)),
    enabled: !!session,
  });

  const contract: ContractDetail | undefined = data?.data;

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isLandlord = contract && userId === contract.landlordId;
  const isTenant = contract && userId === contract.tenantId;

  const hasUserSigned =
    (isLandlord && !!contract?.landlordSignedAt) ||
    (isTenant && !!contract?.tenantSignedAt);

  const canSign =
    contract?.status === "PENDING_SIGNATURES" && !hasUserSigned;

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAFA]">
        <p className="text-sm text-gray-400">Không tìm thấy hợp đồng.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Hợp đồng #{contract.id}
              </h1>
            </div>
            <ContractStatusBadge status={contract.status} />
          </div>

          <div className="flex items-center gap-2">
            {canSign && (
              <button
                onClick={() => setShowSign(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileCheck2 className="h-4 w-4" />
                Ký hợp đồng
              </button>
            )}
            <a
              href={contractApi.downloadPdfUrl(contract.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Tải PDF
            </a>
          </div>
        </div>

        {/* Trạng thái chữ ký */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Trạng thái chữ ký
          </h2>
          <SignatureRow
            label={`Bên A — Chủ trọ (${contract.landlordName})`}
            signedAt={contract.landlordSignedAt}
          />
          <SignatureRow
            label={`Bên B — Người thuê (${contract.tenantName})`}
            signedAt={contract.tenantSignedAt}
          />
          {contract.expiresAt && contract.status === "PENDING_SIGNATURES" && (
            <p className="mt-3 text-xs text-gray-400">
              Hạn ký:{" "}
              <span className="font-medium text-amber-600">
                {new Date(contract.expiresAt).toLocaleDateString("vi-VN")}
              </span>
            </p>
          )}
        </div>

        {/* Nội dung hợp đồng */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Nội dung hợp đồng
            </h2>
          </div>
          <div
            className="prose prose-sm max-w-none px-5 py-4 text-sm leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: contract.contentSnapshot }}
          />
        </div>

        {contract.cancellationReason && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <strong>Lý do hủy:</strong> {contract.cancellationReason}
          </div>
        )}
      </div>

      {showSign && (
        <SignConfirmModal
          open={showSign}
          onClose={() => setShowSign(false)}
          contractId={contract.id}
          contractTitle={`Hợp đồng thuê ${contract.tenantName} - ${contract.landlordName}`}
        />
      )}

      {/* Floating AI bubble — chỉ hiện cho hợp đồng đang ký hoặc đã ký */}
      {AI_ELIGIBLE_STATUSES.includes(contract.status) && (
        <ContractAiPanel contractId={contract.id} />
      )}
    </div>
  );
}
