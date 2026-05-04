package org.lite.komunas.repository;

import org.lite.komunas.entity.ResourceSyncState;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceSyncStateRepository extends MongoRepository<ResourceSyncState, String> {
    @Query("{ '$or': [ { 'domain': ?0, 'category': ?1 }, { 'resourceCategory': ?0 } ] }")
    List<ResourceSyncState> findByDomainAndCategory(String domain, String category);

    @Query("{ '$or': [ { 'domain': ?0, 'category': ?1, 'resourceId': ?2 }, { 'resourceCategory': ?0, 'resourceId': ?2 } ] }")
    Optional<ResourceSyncState> findByDomainAndCategoryAndResourceId(String domain, String category, String resourceId);

    Optional<ResourceSyncState> findByDocumentId(String documentId);

    Optional<ResourceSyncState> findByInstructionsDocumentId(String instructionsDocumentId);

    List<ResourceSyncState> findByEnabledTrue();

    void deleteByDocumentId(String documentId);
}
