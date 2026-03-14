package org.lite.komunas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.service.USCISScraperService;
import org.springframework.web.bind.annotation.*;

/**
 * SOVEREIGN SYNC CONTROLLER - This is the primary interface for USCIS
 * synchronization.
 * It handles both the version check and the final commit.
 */
@RestController
@RequestMapping("/api/uscis/sync")
@Slf4j
@RequiredArgsConstructor
public class USCISSyncController {

    private final USCISScraperService scraperService;

    @GetMapping("/check/{formId}")
    public ResourceCheckResult check(@PathVariable String formId) {
        log.info("USCIS Sovereign API: Checking for updates - Form: {}", formId);
        // "uscis-sentinel" is the implicitly known category for this domain
        return scraperService.checkForUpdates("uscis-sentinel", formId);
    }

    @PostMapping("/commit")
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Sovereign API: Committing update for form: {}", request.getResourceId());
        return scraperService.commitUpdate(request);
    }
}
