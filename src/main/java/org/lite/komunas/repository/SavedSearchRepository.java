package org.lite.komunas.repository;

import org.lite.komunas.entity.SavedSearch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedSearchRepository extends MongoRepository<SavedSearch, String> {
    List<SavedSearch> findByUserId(String userId);
    void deleteByIdAndUserId(String id, String userId);
}
