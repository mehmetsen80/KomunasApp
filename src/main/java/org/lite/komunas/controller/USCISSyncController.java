package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "USCIS Sync", description = "Sovereign synchronization APIs for USCIS forms and documents")
public class USCISSyncController {

    private final USCISScraperService scraperService;

    @GetMapping("/check/{formId}")
    @Operation(summary = "Check for USCIS updates", description = "Analyzes the USCIS website for a specific form ID to detect new versions or hash changes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed update check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Form not found on USCIS website")
    })
    public ResourceCheckResult check(
            @Parameter(description = "The USCIS Form ID (e.g., I-485, I-130)", example = "I-485") @PathVariable String formId) {
        log.info("USCIS Sovereign API: Checking for updates - Form: {}", formId);
        // "uscis-sentinel" is the implicitly known category for this domain
        return scraperService.checkForUpdates("uscis-sentinel", formId);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit resource update", description = "Finalizes the synchronization process by creating a new version history record and updating the sync state.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Update successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Sovereign API: Committing update for form: {}", request.getResourceId());
        return scraperService.commitUpdate(request);
    }
}
