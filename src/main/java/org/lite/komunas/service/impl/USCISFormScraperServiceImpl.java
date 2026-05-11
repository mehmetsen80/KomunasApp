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
import org.lite.komunas.enums.ResourceChangeType;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISFormScraperService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * FORM SCRAPER SERVICE - Specialized in USCIS PDF-based form tracking.
 * This class owns the scraping, hashing, and sync state for USCIS Forms.
 */
@Service("uscisFormScraper")
@Slf4j
@RequiredArgsConstructor
public class USCISFormScraperServiceImpl implements USCISFormScraperService {

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

        // USCIS Form Scraper specifically handles the "forms" category
        String domain = category; // legacy 'category' param is now the domain (e.g. uscis-sentinel)
        String formsCategory = "forms";

        return syncStateRepository.findByDomainAndCategoryAndResourceId(domain, formsCategory, resourceId)
                .map(existingState -> {
                    boolean versionChanged = !metadata.getVersion().equals(existingState.getLastKnownVersion());
                    boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());
                    boolean instrHashChanged = metadata.getInstructionsUrl() != null &&
                            !instructionsHash.equals(existingState.getLastKnownInstructionsHash());

                    // Process Supplemental Resources
                    Map<String, SupplementalResource> existingSupplements = existingState.getSupplementalResources();
                    if (existingSupplements == null)
                        existingSupplements = new HashMap<>();

                    Map<String, SupplementalResource> processedSupplements = new HashMap<>();
                    boolean supplementalChanged = false;

                    for (Map.Entry<String, SupplementalResource> entry : metadata.getSupplementalResources()
                            .entrySet()) {
                        String key = entry.getKey();
                        SupplementalResource metaSupp = entry.getValue();

                        String hash = downloadAndHash(metaSupp.getUrl());
                        SupplementalResource existingSupp = existingSupplements.get(key);

                        String oldDocId = (existingSupp != null) ? existingSupp.getDocumentId() : null;

                        SupplementalResource processedSupp = SupplementalResource.builder()
                                .name(metaSupp.getName())
                                .url(metaSupp.getUrl())
                                .hash(hash)
                                .oldDocumentId(oldDocId)
                                .build();

                        processedSupplements.put(key, processedSupp);

                        if (!hash.equals("ERROR_DOWNLOADING") && !hash.equals("NO_URL")) {
                            if (existingSupp == null || !hash.equals(existingSupp.getHash())) {
                                supplementalChanged = true;
                            }
                        }
                    }

                    boolean contentChanged = versionChanged || hashChanged || instrHashChanged || supplementalChanged;

                    // Missing Docs Check
                    boolean missingDocs = (metadata.getResourceUrl() != null
                            && !StringUtils.hasText(existingState.getDocumentId())) ||
                            (metadata.getInstructionsUrl() != null
                                    && !StringUtils.hasText(existingState.getInstructionsDocumentId()));

                    if (!missingDocs) {
                        for (SupplementalResource supp : processedSupplements.values()) {
                            if (supp.getUrl() != null && !StringUtils.hasText(supp.getOldDocumentId())) {
                                missingDocs = true;
                                break;
                            }
                        }
                    }

                    boolean shouldSync = contentChanged || missingDocs || !existingState.isEnabled();

                    String resultSummary = contentChanged ? "Detected update for Form " + resourceId + " (" + metadata.getVersion() + ")" : "No changes detected for Form " + resourceId;

                    return ResourceCheckResult.builder()
                            .resourceId(resourceId)
                            .domain(domain)
                            .category(formsCategory)
                            .changed(contentChanged)
                            .oldVersion(existingState.getLastKnownVersion())
                            .newVersion(metadata.getVersion())
                            .summary(resultSummary)
                            .effectiveDate(metadata.getEffectiveDate())
                            .oldHash(existingState.getLastKnownHash())
                            .newHash(currentHash)
                            .instructionsUrl(metadata.getInstructionsUrl())
                            .instructionsHash(instructionsHash)
                            .supplementalResources(processedSupplements)
                            .resourceUrl(metadata.getResourceUrl())
                            .oldDocumentId(existingState.getDocumentId())
                            .oldInstructionsDocumentId(existingState.getInstructionsDocumentId())
                            .shouldSync(shouldSync)
                            .build();
                })
                .orElseGet(() -> {
                    Map<String, SupplementalResource> initialSupplements = new HashMap<>();
                    for (Map.Entry<String, SupplementalResource> entry : metadata.getSupplementalResources()
                            .entrySet()) {
                        String key = entry.getKey();
                        SupplementalResource metaSupp = entry.getValue();
                        String hash = downloadAndHash(metaSupp.getUrl());
                        initialSupplements.put(key, SupplementalResource.builder()
                                .name(metaSupp.getName())
                                .url(metaSupp.getUrl())
                                .hash(hash)
                                .build());
                    }

                    String resultSummary = "Initial discovery of Form " + resourceId + " (" + metadata.getVersion() + ")";

                    return ResourceCheckResult.builder()
                            .resourceId(resourceId)
                            .domain(domain)
                            .category(formsCategory)
                            .changed(true)
                            .oldVersion("INITIAL")
                            .newVersion(metadata.getVersion())
                            .summary(resultSummary)
                            .effectiveDate(metadata.getEffectiveDate())
                            .oldHash("INITIAL")
                            .newHash(currentHash)
                            .instructionsUrl(metadata.getInstructionsUrl())
                            .instructionsHash(instructionsHash)
                            .supplementalResources(initialSupplements)
                            .resourceUrl(metadata.getResourceUrl())
                            .shouldSync(true)
                            .build();
                });
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Worker committing update for {}/{} ({}): version={}, hash={}",
                request.getDomain(), request.getCategory(), request.getResourceId(), request.getVersion(),
                request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByDomainAndCategoryAndResourceId(request.getDomain(), request.getCategory(),
                        request.getResourceId())
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
                    existingState.setChangeType(ResourceChangeType.FORM_UPDATE.getValue());
                    existingState.setChangeDetected(request.isChangeDetected());
                    existingState.setSummary(request.getSummary());
                    existingState.setResourceUrl(request.getResourceUrl());
                    existingState.setInstructionsUrl(request.getInstructionsUrl());
                    existingState.setLastAnalysis(request.getAnalysis());
                    existingState.setLastCheckedAt(LocalDateTime.now());
                    existingState.setLastUpdatedAt(LocalDateTime.now());
                    existingState.setEnabled(true);

                    // Update Supplemental Resources
                    existingState.setSupplementalResources(request.getSupplementalResources());

                    return existingState;
                })
                .orElseGet(() -> ResourceSyncState.builder()
                        .domain(request.getDomain())
                        .category(request.getCategory())
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
                        .supplementalResources(request.getSupplementalResources())
                        .lastKnownVersion(request.getVersion())
                        .effectiveDate(request.getEffectiveDate())
                        .lastKnownHash(request.getHash())
                        .lastKnownInstructionsHash(request.getInstructionsHash())
                        .lastAnalysis(request.getAnalysis())
                        .lastCheckedAt(LocalDateTime.now())
                        .lastUpdatedAt(LocalDateTime.now())
                        .enabled(true)
                        .build());

        ResourceSyncState savedState = syncStateRepository.save(state);

        // Create Version History
        ResourceVersionHistory history = ResourceVersionHistory.builder()
                .domain(request.getDomain())
                .category(request.getCategory())
                .resourceId(request.getResourceId())
                .syncStateId(savedState.getId())
                .agentTaskId(request.getAgentTaskId())
                .version(request.getVersion())
                .effectiveDate(request.getEffectiveDate())
                .resourceUrl(request.getResourceUrl())
                .instructionsUrl(request.getInstructionsUrl())
                .supplementalResources(request.getSupplementalResources())
                .hash(request.getHash())
                .instructionsHash(request.getInstructionsHash())
                .documentId(request.getDocumentId())
                .instructionsDocumentId(request.getInstructionsDocumentId())
                .oldDocumentId(request.getOldDocumentId())
                .oldInstructionsDocumentId(request.getOldInstructionsDocumentId())
                .changeType(ResourceChangeType.FORM_UPDATE.getValue())
                .summary(request.getSummary())
                .changeDetected(request.isChangeDetected())
                .analysis(request.getAnalysis())
                .detectedAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);

        return ResourceCommitResponse.builder()
                .resourceId(savedState.getResourceId())
                .domain(savedState.getDomain())
                .category(savedState.getCategory())
                .version(savedState.getLastKnownVersion())
                .summary(savedState.getSummary())
                .status("COMMITTED")
                .changeDetected(savedState.isChangeDetected())
                .build();
    }

    @Override
    public void handleDocumentDeletion(String documentId) {
        log.info("\uD83D\uDD14 Processing deletion signal for document: {}", documentId);

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
        log.info("\uD83D\uDD14 Processing update signal for {}: {}", notification.getResourceId(),
                notification.getType());
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

                    if (text.toLowerCase().contains("mandatory") || text.toLowerCase().contains("after")) {
                        Matcher mandatoryMatcher = VERSION_PATTERN.matcher(text);
                        if (mandatoryMatcher.find()) {
                            if (mandatoryMatcher.find()) {
                                effectiveDate = mandatoryMatcher.group(1);
                            }
                        }
                    }
                }
            }

            if ("UNKNOWN".equals(version)) {
                Matcher matcher = VERSION_PATTERN.matcher(doc.text());
                if (matcher.find()) {
                    version = matcher.group(1);
                }
            }

            if ("UNKNOWN".equals(effectiveDate) && !"UNKNOWN".equals(version)) {
                effectiveDate = version;
            }

            // Extract PDF Links
            String pdfUrl = null;
            String instructionsUrl = null;
            Map<String, SupplementalResource> supplementalResources = new HashMap<>();

            String shortFormId = normalizedFormId.replace("-", "");
            String exactFormSuffix = "/" + normalizedFormId + ".pdf";
            String exactInstrSuffix = "/" + normalizedFormId + "instr.pdf";
            String shortFormSuffix = "/" + shortFormId + ".pdf";
            String shortInstrSuffix = "/" + shortFormId + "instr.pdf";

            Elements allLinks = doc.select("a[href]");

            for (Element link : allLinks) {
                String absoluteUrl = getAbsoluteUrl(link.attr("href"));
                if (absoluteUrl == null)
                    continue;

                String filename = absoluteUrl.toLowerCase();
                if (!filename.contains(".pdf"))
                    continue;

                if (filename.endsWith(exactFormSuffix) || filename.endsWith(shortFormSuffix)) {
                    pdfUrl = absoluteUrl;
                } else if (filename.endsWith(exactInstrSuffix) || filename.endsWith(shortInstrSuffix)) {
                    instructionsUrl = absoluteUrl;
                }

                // Supplemental Documents
                if ("n-400".equals(normalizedFormId) && filename.contains("g-1151.pdf")) {
                    supplementalResources.put("g1151",
                            SupplementalResource.builder().name("G-1151 Notification").url(absoluteUrl).build());
                } else if ("i-130".equals(normalizedFormId) && filename.contains("i-130a.pdf")) {
                    supplementalResources.put("i130a",
                            SupplementalResource.builder().name("I-130A Supplemental").url(absoluteUrl).build());
                } else if ("i-360".equals(normalizedFormId) && filename.contains("m-737.pdf")) {
                    supplementalResources.put("m737",
                            SupplementalResource.builder().name("M-737 Checklist").url(absoluteUrl).build());
                } else if ("i-600".equals(normalizedFormId)) {
                    if (filename.contains("sup1") || filename.contains("sm1")) {
                        supplementalResources.put("supp1",
                                SupplementalResource.builder().name("Supplement 1").url(absoluteUrl).build());
                    } else if (filename.contains("sup2") || filename.contains("sm2")) {
                        supplementalResources.put("supp2",
                                SupplementalResource.builder().name("Supplement 2").url(absoluteUrl).build());
                    } else if (filename.contains("sup3") || filename.contains("sm3")) {
                        supplementalResources.put("supp3",
                                SupplementalResource.builder().name("Supplement 3").url(absoluteUrl).build());
                    }
                } else if ("i-765".equals(normalizedFormId) && filename.contains("i-765ws.pdf")) {
                    supplementalResources.put("i765ws",
                            SupplementalResource.builder().name("I-765 Worksheet").url(absoluteUrl).build());
                } else if ("i-129".equals(normalizedFormId)) {
                    if (filename.contains("i-129h2a.pdf")) {
                        supplementalResources.put("i129h2a",
                                SupplementalResource.builder().name("Form I-129H2A").url(absoluteUrl).build());
                    } else if (filename.contains("i-129h2ainstr.pdf")) {
                        supplementalResources.put("i129h2ainstr",
                                SupplementalResource.builder().name("Instructions I-129H2A").url(absoluteUrl).build());
                    } else if (filename.contains("m-735.pdf")) {
                        supplementalResources.put("m735",
                                SupplementalResource.builder().name("H-1B Checklist").url(absoluteUrl).build());
                    } else if (filename.contains("m-1097.pdf")) {
                        supplementalResources.put("m1097",
                                SupplementalResource.builder().name("H-2A Checklist").url(absoluteUrl).build());
                    } else if (filename.contains("m-1087.pdf")) {
                        supplementalResources.put("m1087",
                                SupplementalResource.builder().name("H-2B Checklist").url(absoluteUrl).build());
                    } else if (filename.contains("m-736.pdf")) {
                        supplementalResources.put("m736",
                                SupplementalResource.builder().name("R-1 Checklist").url(absoluteUrl).build());
                    } else if (filename.contains("m-746.pdf")) {
                        supplementalResources.put("m746",
                                SupplementalResource.builder().name("DOT Codes Dictionary").url(absoluteUrl).build());
                    }
                } else if ("i-539".equals(normalizedFormId)) {
                    if (filename.contains("i-539a.pdf")) {
                        supplementalResources.put("i539a",
                                SupplementalResource.builder().name("Form I-539A Supplemental").url(absoluteUrl)
                                        .build());
                    } else if (filename.contains("m-752.pdf")) {
                        supplementalResources.put("m752",
                                SupplementalResource.builder().name("Filing Tips (M-752)").url(absoluteUrl).build());
                    }
                }
            }

            if (pdfUrl == null || instructionsUrl == null) {
                for (Element link : allLinks) {
                    String absoluteUrl = getAbsoluteUrl(link.attr("href"));
                    if (absoluteUrl == null)
                        continue;
                    String filename = absoluteUrl.toLowerCase();
                    if (!filename.contains(".pdf"))
                        continue;

                    if (pdfUrl == null && !filename.contains("instr") &&
                            (filename.contains(normalizedFormId) || filename.contains(shortFormId))) {
                        pdfUrl = absoluteUrl;
                    }
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
                    .supplementalResources(supplementalResources)
                    .build();
        } catch (Exception e) {
            log.error("Failed to scrape USCIS form {}: {}", normalizedFormId, e.getMessage());
            throw new RuntimeException("Scraping failed for form " + normalizedFormId + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<ResourceCheckResult> checkAllUpdates(String category) {
        log.info("Worker checking ALL updates for domain: {}", category);

        String domain = category;
        String formsCategory = "forms";

        return syncStateRepository.findByDomainAndCategory(domain, formsCategory).stream()
                .map(state -> {
                    try {
                        return checkForUpdates(category, state.getResourceId());
                    } catch (Exception e) {
                        log.error("Failed to check updates for resource {}: {}", state.getResourceId(), e.getMessage());
                        return ResourceCheckResult.builder()
                                .resourceId(state.getResourceId())
                                .domain(domain)
                                .category(formsCategory)
                                .changed(false)
                                .shouldSync(false)
                                .oldVersion(state.getLastKnownVersion())
                                .newVersion("ERROR: " + e.getMessage())
                                .build();
                    }
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
