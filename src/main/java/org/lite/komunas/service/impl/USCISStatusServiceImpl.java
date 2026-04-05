package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.USCISFormStatusResponse;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISStatusService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class USCISStatusServiceImpl implements USCISStatusService {

        private static final String USCIS_CATEGORY = "uscis-sentinel";

        private final ResourceSyncStateRepository syncStateRepository;
        private final ResourceVersionHistoryRepository versionHistoryRepository;

        @Override
        public Optional<USCISFormStatusResponse> getFormStatus(String formId) {
                log.info("Fetching USCIS status for form: {}", formId);

                return syncStateRepository.findByResourceCategoryAndResourceId(USCIS_CATEGORY, formId)
                                .map(this::mapToResponse);
        }

        @Override
        public List<USCISFormStatusResponse> getAllFormStatuses() {
                log.info("Fetching all USCIS form statuses");

                List<ResourceSyncState> states = syncStateRepository.findByResourceCategory(USCIS_CATEGORY);

                return states.stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        private USCISFormStatusResponse mapToResponse(ResourceSyncState state) {
                List<ResourceVersionHistory> history = versionHistoryRepository
                                .findByResourceCategoryAndResourceIdOrderByDetectedAtDesc(
                                                state.getResourceCategory(), state.getResourceId());

                List<USCISFormStatusResponse.VersionEntry> versionEntries = history.stream()
                                .map(USCISFormStatusResponse::from)
                                .toList();

                return USCISFormStatusResponse.builder()
                                .resourceId(state.getResourceId())
                                .resourceCategory(state.getResourceCategory())
                                .currentVersion(state.getLastKnownVersion())
                                .effectiveDate(state.getEffectiveDate())
                                .resourceUrl(state.getResourceUrl())
                                .instructionsUrl(state.getInstructionsUrl())
                                .supplementalResources(state.getSupplementalResources())
                                .changeDetected(state.isChangeDetected())
                                .changeType(state.getChangeType())
                                .summary(state.getSummary())
                                .lastCheckedAt(state.getLastCheckedAt())
                                .lastUpdatedAt(state.getLastUpdatedAt())
                                .enabled(state.isEnabled())
                                .versionHistory(versionEntries)
                                .build();
        }
}
