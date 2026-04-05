package org.lite.komunas.service;

import org.lite.komunas.dto.USCISFormStatusResponse;

import java.util.List;
import java.util.Optional;

public interface USCISStatusService {
    Optional<USCISFormStatusResponse> getFormStatus(String formId);
    List<USCISFormStatusResponse> getAllFormStatuses();
}
