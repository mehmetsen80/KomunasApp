// Comprehensive MongoDB Index Creation Scripts for All Entities
// Run these commands in MongoDB shell: mongosh KomunasApp < mongodb_indexes.js
// Or: mongosh KomunasApp and then copy/paste these commands
//
// NOTE: This script is idempotent - it's safe to run multiple times.
// If an index with the same name and key pattern already exists, createIndex() will do nothing.
// If an index with a different key pattern exists, you may need to drop it first.

// ============================================================================
// RESOURCE_SYNC_STATE COLLECTION
// ============================================================================

// 1. Resource Category and ID Unique Index
db.resource_sync_state.createIndex(
    { "resourceCategory": 1, "resourceId": 1 },
    {
        "name": "resource_sync_idx",
        "unique": true,
        "background": true
    }
);

// 2. Document ID Index (for checking orphaned states)
db.resource_sync_state.createIndex(
    { "documentId": 1 },
    {
        "name": "document_id_idx",
        "background": true
    }
);

// 2a. Instructions Document ID Index
db.resource_sync_state.createIndex(
    { "instructionsDocumentId": 1 },
    {
        "name": "instructions_document_id_idx",
        "background": true
    }
);

// 3. Enabled Status Index (for finding active/inactive states)
db.resource_sync_state.createIndex(
    { "enabled": 1 },
    {
        "name": "enabled_idx",
        "background": true
    }
);

// ============================================================================
// RESOURCE_VERSION_HISTORY COLLECTION
// ============================================================================

// 1. History Category, ID, and Time Index (for querying recent history)
db.resource_version_history.createIndex(
    { "resourceCategory": 1, "resourceId": 1, "detectedAt": -1 },
    {
        "name": "history_category_id_time_idx",
        "background": true
    }
);

// 2. Sync State ID Index (for linking to parent state)
db.resource_version_history.createIndex(
    { "syncStateId": 1 },
    {
        "name": "sync_state_id_idx",
        "background": true
    }
);

// ============================================================================
// USERS COLLECTION
// ============================================================================

// 1. Username Unique Index
db.users.createIndex(
    { "username": 1 },
    {
        "name": "username_unique_idx",
        "unique": true,
        "background": true
    }
);

// 2. Email Unique Index
db.users.createIndex(
    { "email": 1 },
    {
        "name": "email_unique_idx",
        "unique": true,
        "background": true
    }
);

// ============================================================================
// WHATSAPP_CONTACTS COLLECTION
// ============================================================================

// 1. WA ID Unique Index
db.whatsapp_contacts.createIndex(
    { "wa_id": 1 },
    {
        "name": "wa_id_unique_idx",
        "unique": true,
        "background": true
    }
);

// ============================================================================
// WHATSAPP_MESSAGES COLLECTION
// ============================================================================

// 1. WhatsApp ID Index
db.whatsapp_messages.createIndex(
    { "whatsapp_id": 1 },
    {
        "name": "whatsapp_id_idx",
        "background": true
    }
);

// 2. From Number Index
db.whatsapp_messages.createIndex(
    { "from_number": 1 },
    {
        "name": "from_number_idx",
        "background": true
    }
);

// ============================================================================
// VERIFY ALL INDEXES
// ============================================================================

print("\n=== RESOURCE_SYNC_STATE Indexes ===");
db.resource_sync_state.getIndexes().forEach(function (index) {
    print("Index: " + index.name);
    printjson(index.key);
});

print("\n=== RESOURCE_VERSION_HISTORY Indexes ===");
db.resource_version_history.getIndexes().forEach(function (index) {
    print("Index: " + index.name);
    printjson(index.key);
});

print("\n=== USERS Indexes ===");
db.users.getIndexes().forEach(function (index) {
    print("Index: " + index.name);
    printjson(index.key);
});

print("\n=== WHATSAPP_CONTACTS Indexes ===");
db.whatsapp_contacts.getIndexes().forEach(function (index) {
    print("Index: " + index.name);
    printjson(index.key);
});

print("\n=== WHATSAPP_MESSAGES Indexes ===");
db.whatsapp_messages.getIndexes().forEach(function (index) {
    print("Index: " + index.name);
    printjson(index.key);
});

print("\n✅ Index creation completed for all collections!");
