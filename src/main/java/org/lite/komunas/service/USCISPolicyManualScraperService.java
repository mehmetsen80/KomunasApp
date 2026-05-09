package org.lite.komunas.service;

import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;

import java.util.List;

public interface USCISPolicyManualScraperService {
    ResourceCheckResult checkForUpdates(String domain, String resourceId);
    ResourceCommitResponse commitUpdate(ResourceCommitRequest request);
    List<ResourceCheckResult> checkAllUpdates(String domain);
    void handleResourceUpdate(ResourceUpdateNotification notification);
}
