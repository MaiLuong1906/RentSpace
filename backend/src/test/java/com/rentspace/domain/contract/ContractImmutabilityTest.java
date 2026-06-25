package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm tra bất biến của Contract sau khi ký đầy đủ.
 * Không cần Spring context — pure unit test trên entity.
 */
class ContractImmutabilityTest {

    @Test
    void updateContent_whenDraft_successfullyUpdates() {
        Contract contract = Contract.builder()
                .contentSnapshot("nội dung cũ")
                .status(ContractStatus.DRAFT)
                .build();

        contract.updateContent("nội dung mới");

        assertThat(contract.getContentSnapshot()).isEqualTo("nội dung mới");
    }

    @Test
    void updateContent_whenPendingSignatures_successfullyUpdates() {
        Contract contract = Contract.builder()
                .contentSnapshot("nội dung cũ")
                .status(ContractStatus.PENDING_SIGNATURES)
                .build();

        contract.updateContent("nội dung sửa");

        assertThat(contract.getContentSnapshot()).isEqualTo("nội dung sửa");
    }

    @Test
    void updateContent_whenFullySigned_throwsBusinessException() {
        Contract contract = Contract.builder()
                .contentSnapshot("nội dung bất biến")
                .status(ContractStatus.FULLY_SIGNED)
                .build();

        assertThatThrownBy(() -> contract.updateContent("cố sửa"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không thể chỉnh sửa");
    }

    @Test
    void updateContent_whenCancelled_doesNotThrow() {
        Contract contract = Contract.builder()
                .contentSnapshot("cũ")
                .status(ContractStatus.CANCELLED)
                .build();

        // CANCELLED không bị guard — chỉ FULLY_SIGNED mới bất biến
        contract.updateContent("mới");
        assertThat(contract.getContentSnapshot()).isEqualTo("mới");
    }
}
