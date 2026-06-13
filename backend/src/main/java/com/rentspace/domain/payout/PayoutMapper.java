package com.rentspace.domain.payout;

import com.rentspace.domain.payout.dto.PayoutAccountResponse;
import com.rentspace.domain.payout.dto.PayoutResponse;
import com.rentspace.infrastructure.security.AesEncryptionUtil;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class PayoutMapper {

    @Autowired
    protected AesEncryptionUtil aesEncryptionUtil;

    @Mapping(target = "accountNumber", source = "accountNumber", qualifiedByName = "decryptAndMask")
    public abstract PayoutAccountResponse toResponse(LandlordPayoutAccount account);

    @Mapping(target = "landlordId", source = "landlord.id")
    @Mapping(target = "landlordName", source = "landlord.fullName")
    @Mapping(target = "bankName", source = "payoutAccount.bankName")
    @Mapping(target = "bankCode", source = "payoutAccount.bankCode")
    @Mapping(target = "accountNumber", source = "payoutAccount.accountNumber", qualifiedByName = "decryptAndMask")
    @Mapping(target = "accountName", source = "payoutAccount.accountName")
    @Mapping(target = "depositId", source = "deposit.id")
    @Mapping(target = "listingTitle", source = "deposit.listing.title")
    public abstract PayoutResponse toResponse(Payout payout);

    @Named("decryptAndMask")
    protected String decryptAndMask(String encryptedAccountNumber) {
        if (encryptedAccountNumber == null) {
            return null;
        }
        try {
            String decrypted = aesEncryptionUtil.decrypt(encryptedAccountNumber);
            if (decrypted == null || decrypted.length() < 4) {
                return "****";
            }
            String last4 = decrypted.substring(decrypted.length() - 4);
            return "******" + last4;
        } catch (Exception e) {
            return "******ERROR";
        }
    }
}
