package org.lite.komunas.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.User;
import org.lite.komunas.entity.WhatsAppContact;
import org.lite.komunas.entity.WhatsAppMessage;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void init() {
        log.info("Initializing MongoDB collections...");
        createCollectionIfNotExists(User.class);
        createCollectionIfNotExists(WhatsAppContact.class);
        createCollectionIfNotExists(WhatsAppMessage.class);
        log.info("MongoDB collections initialization completed.");
    }

    private void createCollectionIfNotExists(Class<?> entityClass) {
        if (!mongoTemplate.collectionExists(entityClass)) {
            mongoTemplate.createCollection(entityClass);
            log.info("Created collection for entity: {}", entityClass.getSimpleName());
        } else {
            log.debug("Collection already exists for entity: {}", entityClass.getSimpleName());
        }
    }
}
