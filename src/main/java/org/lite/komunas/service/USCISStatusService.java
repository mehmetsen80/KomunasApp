package org.lite.komunas.service;

import org.lite.komunas.dto.USCISStatusResponse;

import java.util.List;
import java.util.Optional;

public interface USCISStatusService {
    Optional<USCISStatusResponse> getFormStatus(String formId);
    Optional<USCISStatusResponse> getFormStatus(String formId, String userId);
    List<USCISStatusResponse> getAllFormStatuses();
    List<USCISStatusResponse> getAllFormStatuses(String userId);

    Optional<USCISStatusResponse> getNewsroomStatus(String resourceId);
    Optional<USCISStatusResponse> getNewsroomStatus(String resourceId, String userId);
}
