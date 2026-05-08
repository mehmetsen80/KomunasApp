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
import org.lite.komunas.service.USCISNewsroomScraperService;
import org.springframework.web.bind.annotation.*;

/**
 * NEWSROOM SYNC CONTROLLER - Sovereign interface for USCIS Announcements.
 * Specialized in tracking newsroom alerts and releases via high-fidelity
 * snapshots.
 */
@RestController
@RequestMapping("/api/uscis/newsroom")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Newsroom", description = "Sovereign synchronization APIs for USCIS News and Alerts")
public class USCISNewsroomController {

    private final USCISNewsroomScraperService uscisNewsroomScraper;

    @GetMapping("/check/{resourceId}")
    @Operation(summary = "Check for Newsroom updates", description = "Analyzes the USCIS Newsroom/Alerts for sudden shifts using slug-based tracking.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully performed newsroom check", content = @Content(schema = @Schema(implementation = ResourceCheckResult.class))),
            @ApiResponse(responseCode = "404", description = "Newsroom resource not found")
    })
    public Object check(
            @Parameter(description = "The newsroom resource ID (e.g., newsroom-alerts, news-releases).", schema = @Schema(type = "string", allowableValues = {
                    "newsroom-alerts", "news-releases",
                    "all" }, defaultValue = "newsroom-alerts")) @PathVariable String resourceId) {

        if ("all".equalsIgnoreCase(resourceId)) {
            return uscisNewsroomScraper.checkAllUpdates("uscis-sentinel");
        }

        return uscisNewsroomScraper.checkForUpdates("uscis-sentinel", resourceId);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit Newsroom update", description = "Finalizes the announcement synchronization process.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Announcement successfully committed", content = @Content(schema = @Schema(implementation = ResourceCommitResponse.class)))
    })
    public ResourceCommitResponse commit(@RequestBody ResourceCommitRequest request) {
        log.info("USCIS Newsroom API: Committing update for: {}", request.getResourceId());
        return uscisNewsroomScraper.commitUpdate(request);
    }
}
