package org.lite.komunas.service;

import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;

import java.util.List;

public interface USCISProcessingTimesScraperService {
    ResourceCheckResult checkForUpdates(String domain, String formId, String formCategory, String officeCode);
    ResourceCommitResponse commitUpdate(ResourceCommitRequest request);
    List<ResourceCheckResult> checkAllUpdates(String domain);
    ResourceCheckResult checkAllUpdatesForForm(String domain, String formId);
    void handleResourceUpdate(ResourceUpdateNotification notification);
}
