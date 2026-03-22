package org.lite.komunas.service;

import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;

public interface USCISScraperService {
    ResourceCheckResult checkForUpdates(String category, String resourceId);

    ResourceCommitResponse commitUpdate(ResourceCommitRequest request);

    void handleDocumentDeletion(String documentId);

    void handleResourceUpdate(ResourceUpdateNotification notification);
}
