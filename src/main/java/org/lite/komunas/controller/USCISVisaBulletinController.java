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
import org.lite.komunas.service.USCISVisaBulletinScraperService;
import org.springframework.web.bind.annotation.*;

/**
 * VISA BULLETIN SYNC CONTROLLER - Sovereign interface for USCIS Visa Bulletin charts.
 * Specialized in tracking monthly determination shifts (Dates for Filing vs Final Action).
 */
@RestController
@RequestMapping("/api/uscis/visa-bulletin")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Visa Bulletin", description = "Sovereign synchronization APIs for USCIS Visa Bulletin determinations")
public class USCISVisaBulletinController {

    private final USCISVisaBulletinScraperService visaBulletinScraper;

    @GetMapping("/check/{resourceId}")
    @Operation(summary = "Check for Visa Bulletin updates", description = "Analyzes the USCIS Visa Bulletin charts for monthly determination shifts.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed visa bulletin check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Visa Bulletin resource not found")
    })
    public Object check(
            @Parameter(description = "The visa bulletin resource ID (e.g., visa-bulletin).", schema = @Schema(type = "string", allowableValues = {
                    "visa-bulletin",
                    "all" }, defaultValue = "visa-bulletin")) @PathVariable String resourceId) {

        if ("all".equalsIgnoreCase(resourceId)) {
            return visaBulletinScraper.checkAllUpdates("uscis-sentinel");
        }

        return visaBulletinScraper.checkForUpdates("uscis-sentinel", resourceId);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit Visa Bulletin update", description = "Finalizes the visa bulletin synchronization process.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Visa Bulletin update successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Visa Bulletin API: Committing update for: {}", request.getResourceId());
        return visaBulletinScraper.commitUpdate(request);
    }
}
