package org.lite.komunas.service;

import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;

import java.util.List;

public interface USCISNewsroomScraperService {
    ResourceCheckResult checkForUpdates(String domain, String resourceId);

    List<ResourceCheckResult> checkAllUpdates(String domain);

    ResourceCommitResponse commitUpdate(ResourceCommitRequest request);

    void handleResourceUpdate(ResourceUpdateNotification notification);
}
