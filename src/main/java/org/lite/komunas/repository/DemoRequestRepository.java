package org.lite.komunas.repository;

import org.lite.komunas.entity.DemoRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemoRequestRepository extends MongoRepository<DemoRequest, String> {
}
