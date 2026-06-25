package com.rentspace.domain.contract;

import com.rentspace.domain.contract.dto.ContractResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContractService {

    /** Tạo hợp đồng từ deposit — gọi khi deposit chuyển sang PAID */
    ContractResponse generateContract(Long depositId);

    /** Ký hợp đồng — xác định vai trò từ userEmail */
    ContractResponse signContract(Long contractId, String userEmail);

    /** Lấy chi tiết hợp đồng */
    ContractResponse getContract(Long contractId, String userEmail);

    /** Tải xuống PDF — trả về byte[] */
    byte[] downloadPdf(Long contractId, String userEmail);

    /** Danh sách hợp đồng của user */
    Page<ContractResponse> getMyContracts(String userEmail, ContractStatus status, Pageable pageable);

    /** Admin hủy hợp đồng */
    void cancelContract(Long contractId, String reason);
}
