package org.lite.komunas.repository;

import org.lite.komunas.entity.ResourceVersionHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceVersionHistoryRepository extends MongoRepository<ResourceVersionHistory, String> {
    List<ResourceVersionHistory> findByDomainAndCategoryAndResourceIdOrderByDetectedAtDesc(String domain, String category,
            String resourceId);

    List<ResourceVersionHistory> findBySyncStateId(String syncStateId);

    void deleteByDomainAndCategoryAndResourceId(String domain, String category, String resourceId);
}
