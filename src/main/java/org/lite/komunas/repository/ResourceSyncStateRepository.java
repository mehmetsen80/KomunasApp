package org.lite.komunas.repository;

import org.lite.komunas.entity.ResourceSyncState;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceSyncStateRepository extends MongoRepository<ResourceSyncState, String> {
    Optional<ResourceSyncState> findByResourceCategoryAndResourceId(String resourceCategory, String resourceId);

    List<ResourceSyncState> findByResourceCategory(String resourceCategory);

    Optional<ResourceSyncState> findByDocumentId(String documentId);

    Optional<ResourceSyncState> findByInstructionsDocumentId(String instructionsDocumentId);

    List<ResourceSyncState> findByEnabledTrue();

    void deleteByDocumentId(String documentId);
}
