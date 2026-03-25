package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.lite.komunas.dto.*;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISScraperService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UNIFIED SCRAPER SERVICE - Domain sovereign logic.
 * This class owns the scraping, hashing, and sync state for USCIS resources.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class USCISScraperServiceImpl implements USCISScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;
    private final RestClient restClient = RestClient.create();

    private static final String USCIS_BASE_URL = "https://www.uscis.gov/";
    private static final String PDF_URL_PREFIX = "https://www.uscis.gov";
    private static final Pattern VERSION_PATTERN = Pattern.compile("(\\d{2}/\\d{2}/\\d{2})");

    @Override
    public ResourceCheckResult checkForUpdates(String category, String resourceId) {
        log.info("Worker checking for updates - Category: {}, ID: {}", category, resourceId);

        SentinelMetadata metadata = scrapeUSCIS(resourceId);
        return processMetadata(category, resourceId, metadata);
    }

    private ResourceCheckResult processMetadata(String category, String resourceId, SentinelMetadata metadata) {
        String currentHash = downloadAndHash(metadata.getResourceUrl());
        String instructionsHash = downloadAndHash(metadata.getInstructionsUrl());
        String g1151Hash = downloadAndHash(metadata.getG1151Url());

        return syncStateRepository.findByResourceCategoryAndResourceId(category, resourceId)
                .map(existingState -> {
                    String lastKnownG1151Hash = existingState.getMetadata() != null
                            ? (String) existingState.getMetadata().get("lastKnownG1151Hash")
                            : null;
                    String g1151DocumentId = existingState.getMetadata() != null
                            ? (String) existingState.getMetadata().get("g1151DocumentId")
                            : null;

                    boolean versionChanged = !metadata.getVersion().equals(existingState.getLastKnownVersion());
                    boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());
                    boolean instrHashChanged = metadata.getInstructionsUrl() != null &&
                            !instructionsHash.equals(existingState.getLastKnownInstructionsHash());
                    boolean g1151HashChanged = metadata.getG1151Url() != null &&
                            !currentHash.equals("ERROR_DOWNLOADING") && // Don't trigger on error
                            !g1151Hash.equals(lastKnownG1151Hash);

                    boolean contentChanged = versionChanged || hashChanged || instrHashChanged || g1151HashChanged;

                    boolean missingDocs = (metadata.getResourceUrl() != null
                            && !StringUtils.hasText(existingState.getDocumentId())) ||
                            (metadata.getInstructionsUrl() != null
                                    && !StringUtils.hasText(existingState.getInstructionsDocumentId()))
                            ||
                            (metadata.getG1151Url() != null
                                    && !StringUtils.hasText(g1151DocumentId));

                    boolean disabled = !existingState.isEnabled();

                    boolean shouldSync = contentChanged || missingDocs || disabled;

                    return ResourceCheckResult.builder()
                            .resourceId(resourceId)
                            .changed(contentChanged)
                            .oldVersion(existingState.getLastKnownVersion())
                            .newVersion(metadata.getVersion())
                            .effectiveDate(metadata.getEffectiveDate())
                            .oldHash(existingState.getLastKnownHash())
                            .currentHash(currentHash)
                            .instructionsUrl(metadata.getInstructionsUrl())
                            .instructionsHash(instructionsHash)
                            .g1151Url(metadata.getG1151Url())
                            .g1151Hash(g1151Hash)
                            .resourceUrl(metadata.getResourceUrl())
                            .oldDocumentId(existingState.getDocumentId())
                            .oldInstructionsDocumentId(existingState.getInstructionsDocumentId())
                            .oldG1151DocumentId(g1151DocumentId)
                            .shouldSync(shouldSync)
                            .build();
                })
                .orElseGet(() -> ResourceCheckResult.builder()
                        .resourceId(resourceId)
                        .changed(true)
                        .oldVersion("INITIAL")
                        .newVersion(metadata.getVersion())
                        .effectiveDate(metadata.getEffectiveDate())
                        .oldHash("INITIAL")
                        .currentHash(currentHash)
                        .instructionsUrl(metadata.getInstructionsUrl())
                        .instructionsHash(instructionsHash)
                        .g1151Url(metadata.getG1151Url())
                        .g1151Hash(g1151Hash)
                        .resourceUrl(metadata.getResourceUrl())
                        .oldDocumentId(null)
                        .oldInstructionsDocumentId(null)
                        .oldG1151DocumentId(null)
                        .shouldSync(true)
                        .build());
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Worker committing update for {} ({}): version={}, hash={}",
                request.getResourceCategory(), request.getResourceId(), request.getVersion(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByResourceCategoryAndResourceId(request.getResourceCategory(), request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownVersion(request.getVersion());
                    existingState.setEffectiveDate(request.getEffectiveDate());
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setLastKnownInstructionsHash(request.getInstructionsHash());
                    existingState.setDocumentId(request.getDocumentId());
                    existingState.setInstructionsDocumentId(request.getInstructionsDocumentId());
                    existingState.setOldDocumentId(request.getOldDocumentId());
                    existingState.setOldInstructionsDocumentId(request.getOldInstructionsDocumentId());
                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(request.getChangeType());
                    existingState.setChangeDetected(request.isChangeDetected());
                    existingState.setSummary(request.getSummary());
                    existingState.setResourceUrl(request.getResourceUrl());
                    existingState.setInstructionsUrl(request.getInstructionsUrl());
                    existingState.setLastAnalysis(request.getAnalysis());
                    existingState.setLastCheckedAt(LocalDateTime.now());
                    existingState.setLastUpdatedAt(LocalDateTime.now());
                    existingState.setEnabled(true);

                    // Handle G-1151 Metadata
                    if (request.getG1151Url() != null) {
                        java.util.Map<String, Object> metadata = existingState.getMetadata();
                        if (metadata == null) {
                            metadata = new java.util.HashMap<>();
                        }
                        metadata.put("lastKnownG1151Hash", request.getG1151Hash());
                        metadata.put("g1151DocumentId", request.getG1151DocumentId());
                        metadata.put("g1151Url", request.getG1151Url());
                        existingState.setMetadata(metadata);
                    }

                    return existingState;
                })
                .orElseGet(() -> {
                    ResourceSyncState newState = ResourceSyncState.builder()
                            .resourceCategory(request.getResourceCategory())
                            .resourceId(request.getResourceId())
                            .documentId(request.getDocumentId())
                            .instructionsDocumentId(request.getInstructionsDocumentId())
                            .oldDocumentId(request.getOldDocumentId())
                            .oldInstructionsDocumentId(request.getOldInstructionsDocumentId())
                            .agentTaskId(request.getAgentTaskId())
                            .changeType(request.getChangeType())
                            .changeDetected(request.isChangeDetected())
                            .summary(request.getSummary())
                            .resourceUrl(request.getResourceUrl())
                            .instructionsUrl(request.getInstructionsUrl())
                            .lastKnownVersion(request.getVersion())
                            .effectiveDate(request.getEffectiveDate())
                            .lastKnownHash(request.getHash())
                            .lastKnownInstructionsHash(request.getInstructionsHash())
                            .lastAnalysis(request.getAnalysis())
                            .lastCheckedAt(LocalDateTime.now())
                            .lastUpdatedAt(LocalDateTime.now())
                            .enabled(true)
                            .build();

                    // Handle G-1151 Metadata
                    if (request.getG1151Url() != null) {
                        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
                        metadata.put("lastKnownG1151Hash", request.getG1151Hash());
                        metadata.put("g1151DocumentId", request.getG1151DocumentId());
                        metadata.put("g1151Url", request.getG1151Url());
                        newState.setMetadata(metadata);
                    }

                    return newState;
                });

        syncStateRepository.save(state);

        ResourceVersionHistory history = ResourceVersionHistory.builder()
                .resourceCategory(request.getResourceCategory())
                .resourceId(request.getResourceId())
                .syncStateId(state.getId())
                .version(request.getVersion())
                .effectiveDate(request.getEffectiveDate())
                .hash(request.getHash())
                .instructionsHash(request.getInstructionsHash())
                .resourceUrl(request.getResourceUrl())
                .instructionsUrl(request.getInstructionsUrl())
                .documentId(request.getDocumentId())
                .instructionsDocumentId(request.getInstructionsDocumentId())
                .oldDocumentId(request.getOldDocumentId())
                .oldInstructionsDocumentId(request.getOldInstructionsDocumentId())
                .agentTaskId(request.getAgentTaskId())
                .changeType(request.getChangeType())
                .changeDetected(request.isChangeDetected())
                .summary(request.getSummary())
                .analysis(request.getAnalysis())
                .enabled(true)
                .detectedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        return ResourceCommitResponse.builder()
                .resourceId(state.getResourceId())
                .resourceCategory(state.getResourceCategory())
                .version(state.getLastKnownVersion())
                .summary(state.getSummary())
                .status("COMMITTED")
                .build();
    }

    @Override
    public void handleDocumentDeletion(String documentId) {
        log.info("🔔 Processing deletion signal for document: {}", documentId);

        // Check if it's a primary document
        syncStateRepository.findByDocumentId(documentId)
                .ifPresent(state -> {
                    log.info("Found sync state for PRIMARY document {}. Nulling ID and disabling.", documentId);
                    state.setDocumentId(null);
                    state.setEnabled(false);
                    syncStateRepository.save(state);
                });

        // Check if it's an instructions document
        syncStateRepository.findByInstructionsDocumentId(documentId)
                .ifPresent(state -> {
                    log.info("Found sync state for INSTRUCTIONS document {}. Nulling ID and disabling.", documentId);
                    state.setInstructionsDocumentId(null);
                    state.setEnabled(false);
                    syncStateRepository.save(state);
                });
    }

    @Override
    public void handleResourceUpdate(ResourceUpdateNotification notification) {
        log.info("🔔 Processing update signal for {}: {}", notification.getResourceId(), notification.getType());
        // TODO: Custom Logic
    }

    private String downloadAndHash(String url) {
        if (url == null || url.isBlank())
            return "NO_URL";

        try {
            byte[] bytes = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(byte[].class);

            if (bytes == null)
                return "EMPTY_CONTENT";

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Failed to download or hash resource from {}: {}", url, e.getMessage());
            return "ERROR_DOWNLOADING";
        }
    }

    private String getAbsoluteUrl(String href) {
        if (href == null)
            return null;
        return href.startsWith("http") ? href : PDF_URL_PREFIX + href;
    }

    private SentinelMetadata scrapeUSCIS(String formId) {
        String normalizedFormId = formId.toLowerCase().trim();
        if (normalizedFormId.matches("[a-z]\\d+")) {
            normalizedFormId = normalizedFormId.charAt(0) + "-" + normalizedFormId.substring(1);
        }

        String url = USCIS_BASE_URL + normalizedFormId;
        log.info("Scraping USCIS for form {}: {}", normalizedFormId, url);

        try {
            Document doc = Jsoup.connect(url).get();

            // Extract version (Edition Date) and Effective Date (Mandatory Date)
            String version = "UNKNOWN";
            String effectiveDate = "UNKNOWN";

            Element editionHeader = doc.selectFirst("h4:contains(Edition Date)");
            if (editionHeader != null) {
                Element panel = editionHeader.nextElementSibling();
                if (panel != null) {
                    String text = panel.text();
                    Matcher matcher = VERSION_PATTERN.matcher(text);
                    if (matcher.find()) {
                        version = matcher.group(1);
                    }

                    // Try to find a mandatory date (usually follows "filing on or after" or
                    // "starting")
                    // Example: "Mandatory for filing on or after 02/10/25"
                    if (text.toLowerCase().contains("mandatory") || text.toLowerCase().contains("after")) {
                        // Pattern for date again but search after the word mandatory
                        Matcher mandatoryMatcher = VERSION_PATTERN.matcher(text);
                        // If there are two dates, the second one is often the effective date
                        if (mandatoryMatcher.find()) {
                            // Find the NEXT one if it exists
                            if (mandatoryMatcher.find()) {
                                effectiveDate = mandatoryMatcher.group(1);
                            }
                        }
                    }
                }
            }

            // Fallback for version (whole page search)
            if ("UNKNOWN".equals(version)) {
                Matcher matcher = VERSION_PATTERN.matcher(doc.text());
                if (matcher.find()) {
                    version = matcher.group(1);
                }
            }

            // Final Fallback: If no explicit mandatory date was found, the edition date
            // (version)
            // is the effective date. This MUST happen after all version fallbacks.
            if ("UNKNOWN".equals(effectiveDate) && !"UNKNOWN".equals(version)) {
                effectiveDate = version;
            }

            // Extract PDF Links
            String pdfUrl = null;
            String instructionsUrl = null;
            String g1151Url = null;

            // Pattern-based detection (Standard USCIS weights)
            String shortFormId = normalizedFormId.replace("-", "");
            String exactFormSuffix = "/" + normalizedFormId + ".pdf";
            String exactInstrSuffix = "/" + normalizedFormId + "instr.pdf";
            String shortFormSuffix = "/" + shortFormId + ".pdf";
            String shortInstrSuffix = "/" + shortFormId + "instr.pdf";

            log.info("Scraping for PDFs using patterns: {}, {}", exactFormSuffix, exactInstrSuffix);

            Elements allPdfLinks = doc.select("a[href$='.pdf']");

            // Phase 1: Look for EXACT pattern matches (the most reliable source)
            for (Element link : allPdfLinks) {
                String absoluteUrl = getAbsoluteUrl(link.attr("href"));
                String filename = absoluteUrl.toLowerCase();

                if (filename.endsWith(exactFormSuffix) || filename.endsWith(shortFormSuffix)) {
                    pdfUrl = absoluteUrl;
                } else if (filename.endsWith(exactInstrSuffix) || filename.endsWith(shortInstrSuffix)) {
                    instructionsUrl = absoluteUrl;
                }

                // Special Case: N-400 G-1151
                if ("n-400".equals(normalizedFormId) && filename.contains("g-1151.pdf")) {
                    g1151Url = absoluteUrl;
                }
            }

            // Phase 2: Fuzzy fallback only if primary links aren't found via exact patterns
            if (pdfUrl == null || instructionsUrl == null) {
                for (Element link : allPdfLinks) {
                    String absoluteUrl = getAbsoluteUrl(link.attr("href"));
                    String filename = absoluteUrl.toLowerCase();

                    // Look for anything containing the ID but NOT instructions
                    if (pdfUrl == null && !filename.contains("instr") &&
                            (filename.contains(normalizedFormId) || filename.contains(shortFormId))) {
                        pdfUrl = absoluteUrl;
                    }
                    // Look for instructions
                    if (instructionsUrl == null && filename.contains("instr") &&
                            (filename.contains(normalizedFormId) || filename.contains(shortFormId))) {
                        instructionsUrl = absoluteUrl;
                    }
                }
            }

            if (pdfUrl == null) {
                throw new RuntimeException("Could not find primary PDF link for form " + normalizedFormId);
            }

            return SentinelMetadata.builder()
                    .version(version)
                    .effectiveDate(effectiveDate)
                    .resourceUrl(pdfUrl)
                    .instructionsUrl(instructionsUrl)
                    .g1151Url(g1151Url)
                    .build();
        } catch (Exception e) {
            log.error("Failed to scrape USCIS form {}: {}", normalizedFormId, e.getMessage());
            throw new RuntimeException("Scraping failed for form " + normalizedFormId + ": " + e.getMessage(), e);
        }
    }
}
