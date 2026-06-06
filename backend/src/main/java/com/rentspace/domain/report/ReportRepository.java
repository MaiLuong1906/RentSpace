package com.rentspace.domain.report;

import com.rentspace.domain.report.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @Override
    @EntityGraph(attributePaths = {"listing", "reporter"})
    Page<Report> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"listing", "reporter"})
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
}

