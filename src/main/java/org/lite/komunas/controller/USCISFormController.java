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
import org.lite.komunas.service.USCISFormScraperService;
import org.springframework.web.bind.annotation.*;

/**
 * USCIS FORM CONTROLLER - Dedicated sovereign interface for USCIS Forms.
 * Handles state verification and commitment for PDF-based form resources.
 */
@RestController
@RequestMapping("/api/uscis/sync")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Forms", description = "Sovereign synchronization APIs for USCIS forms and documents")
public class USCISFormController {

    private final USCISFormScraperService uscisFormScraper;

    @GetMapping("/check/{formId}")
    @Operation(summary = "Check for USCIS updates", description = "Analyzes the USCIS website for a specific form ID to detect new versions or hash changes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed update check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Form not found on USCIS website")
    })
    public Object check(
            @Parameter(
                description = "The USCIS Form ID to track updates for. Use 'all' to sync all tracked forms.", 
                schema = @Schema(
                    type = "string",
                    allowableValues = {"I-485", "I-131", "I-765", "I-130", "I-129", "I-539", "I-140", "I-600", "I-751", "I-821", "I-90", "all"},
                    defaultValue = "I-485"
                ),
                example = "all"
            ) @PathVariable String formId) {
        log.info("USCIS Sovereign API: Checking for updates - Form: {}", formId);
        
        if ("all".equalsIgnoreCase(formId)) {
            return uscisFormScraper.checkAllUpdates("uscis-sentinel");
        }
        
        return uscisFormScraper.checkForUpdates("uscis-sentinel", formId);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit resource update", description = "Finalizes the synchronization process by updating the sovereign sync state.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Update successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Sovereign API: Committing update for form: {}", request.getResourceId());
        return uscisFormScraper.commitUpdate(request);
    }
}
