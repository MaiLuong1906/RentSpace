package com.rentspace.domain.seo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SeoPageRepository extends JpaRepository<SeoPage, Long> {

    Optional<SeoPage> findByPath(String path);
}
