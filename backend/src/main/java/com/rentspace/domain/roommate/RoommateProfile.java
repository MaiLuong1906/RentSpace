package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.enums.ProfileType;
import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "roommate_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** SEEKING_ROOM: đang tìm phòng + bạn ở ghép. HAS_ROOM: đã có phòng, cần người ở chung */
    @Enumerated(EnumType.STRING)
    @Column(name = "profile_type", length = 20, nullable = false)
    @Builder.Default
    private ProfileType profileType = ProfileType.SEEKING_ROOM;

    /** Listing gắn kèm — chỉ dùng khi profileType = HAS_ROOM */
    @Column(name = "listing_id")
    private Long listingId;

    /** Số người tối đa có thể ở trong phòng — chỉ dùng khi profileType = HAS_ROOM */
    @Column(name = "max_occupants")
    private Integer maxOccupants;

    /** Số người đang ở hiện tại — chỉ dùng khi profileType = HAS_ROOM */
    @Column(name = "current_occupants")
    private Integer currentOccupants;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String occupation;

    @Column(name = "budget_min")
    private Long budgetMin;

    @Column(name = "budget_max")
    private Long budgetMax;

    /** Với SEEKING_ROOM: khu vực mong muốn. Với HAS_ROOM: khu vực của phòng */
    @Column(name = "preferred_area")
    private String preferredArea;

    /** Với SEEKING_ROOM: ngày muốn chuyển vào. Với HAS_ROOM: ngày phòng trống */
    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @ElementCollection
    @CollectionTable(name = "roommate_lifestyle_tags", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "tag")
    private List<String> lifestyleTags;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
