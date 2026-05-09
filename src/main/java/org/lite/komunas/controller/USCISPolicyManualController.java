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
import org.lite.komunas.service.USCISPolicyManualScraperService;
import org.springframework.web.bind.annotation.*;

/**
 * POLICY MANUAL SYNC CONTROLLER - Sovereign interface for USCIS Policy Manual Updates.
 * Specialized in tracking legal and procedural shifts in adjudication rules.
 */
@RestController
@RequestMapping("/api/uscis/policy-manual")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Policy Manual", description = "Sovereign synchronization APIs for USCIS Policy Updates")
public class USCISPolicyManualController {

    private final USCISPolicyManualScraperService policyManualScraper;

    @GetMapping("/check/{resourceId}")
    @Operation(summary = "Check for Policy Manual updates", description = "Analyzes the USCIS Policy Manual for legal shifts using content-based tracking.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed policy manual check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Policy resource not found")
    })
    public Object check(
            @Parameter(description = "The policy resource ID (e.g., policy-updates).", schema = @Schema(type = "string", allowableValues = {
                    "policy-updates",
                    "all" }, defaultValue = "policy-updates")) @PathVariable String resourceId) {

        if ("all".equalsIgnoreCase(resourceId)) {
            return policyManualScraper.checkAllUpdates("uscis-sentinel");
        }

        return policyManualScraper.checkForUpdates("uscis-sentinel", resourceId);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit Policy Manual update", description = "Finalizes the policy manual synchronization process.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Policy update successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Policy Manual API: Committing update for: {}", request.getResourceId());
        return policyManualScraper.commitUpdate(request);
    }
}
