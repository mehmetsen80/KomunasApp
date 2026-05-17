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
import org.lite.komunas.service.USCISProcessingTimesScraperService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/uscis/processing-times")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Processing Times", description = "Sovereign synchronization APIs for USCIS Processing Times")
public class USCISProcessingTimesController {

    private final USCISProcessingTimesScraperService processingTimesScraper;

    @GetMapping("/check/all")
    @Operation(summary = "Check all default Processing Times", description = "Analyzes high priority processing time shifts.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed processing times check")
    })
    public Object checkAll() {
        return processingTimesScraper.checkAllUpdates("uscis-sentinel");
    }

    @GetMapping("/check/form/{formId}")
    @Operation(summary = "Check for Processing Times updates by Form ID", description = "Analyzes all tracked categories and offices for a specific USCIS Form.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed processing times batch check")
    })
    public Object checkForm(@Parameter(description = "The form ID (e.g., I-130).") @PathVariable String formId) {
        return processingTimesScraper.checkAllUpdatesForForm("uscis-sentinel", formId);
    }

    @GetMapping("/check/{formId}/{officeCode}")
    @Operation(summary = "Check for Processing Times updates", description = "Analyzes the USCIS Processing Times for specific form and office.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed processing times check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public Object check(
            @Parameter(description = "The form ID (e.g., I-130).") @PathVariable String formId,
            @Parameter(description = "The office code (e.g., NBC).") @PathVariable String officeCode,
            @Parameter(description = "Optional form category code (e.g., 134A-IR).") @RequestParam(required = false) String formCategory) {
        
        return processingTimesScraper.checkForUpdates("uscis-sentinel", formId, formCategory, officeCode);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit Processing Times update", description = "Finalizes the processing times synchronization process.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Processing Times update successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Processing Times API: Committing update for: {}", request.getResourceId());
        return processingTimesScraper.commitUpdate(request);
    }
}
