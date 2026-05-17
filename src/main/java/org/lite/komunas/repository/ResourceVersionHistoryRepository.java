package org.lite.komunas.repository;

import org.lite.komunas.entity.ResourceVersionHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceVersionHistoryRepository extends MongoRepository<ResourceVersionHistory, String> {
    List<ResourceVersionHistory> findByDomainAndCategoryAndResourceIdOrderByDetectedAtDesc(String domain,
            String category,
            String resourceId);

    List<ResourceVersionHistory> findBySyncStateIdOrderByDetectedAtDesc(String syncStateId);

    List<ResourceVersionHistory> findBySyncStateId(String syncStateId);

    Optional<ResourceVersionHistory> findFirstBySyncStateIdAndChangeDetectedIsTrueOrderByDetectedAtDesc(
            String syncStateId);

    Optional<ResourceVersionHistory> findFirstBySyncStateIdAndChangeDetectedIsTrueAndDetectedAtAfterOrderByDetectedAtDesc(
            String syncStateId, LocalDateTime detectedAt);

    void deleteByDomainAndCategoryAndResourceId(String domain, String category, String resourceId);
}
