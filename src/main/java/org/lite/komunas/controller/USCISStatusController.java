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
import org.lite.komunas.dto.USCISStatusResponse;
import org.lite.komunas.service.USCISStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only status API for monitored USCIS forms.
 * Intended to be called via the Linq Protocol by Tools registered in Linqra.
 *
 * Example Linq request:
 * {
 *   "link": { "target": "komunas-app", "action": "fetch" },
 *   "query": { "intent": "/api/uscis/status/check/I-485" }
 * }
 */
@RestController
@RequestMapping("/api/uscis/status")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "USCIS Status", description = "Read-only status APIs for monitored USCIS forms")
public class USCISStatusController {

    private final USCISStatusService statusService;

    @GetMapping("/check/{formId}")
    @Operation(
            summary = "Get USCIS form status",
            description = "Returns the current sync state and full version history for a monitored USCIS form. " +
                          "Intended to be invoked via the Linqra Tools / Linq Protocol."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Form status successfully retrieved. Returns a single object for specific formId, or a list of objects if formId is 'all'.",
                    content = @Content(schema = @Schema(implementation = USCISStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No monitoring record found for the given form ID"
            )
    })
    public ResponseEntity<?> checkStatus(
            @Parameter(description = "The USCIS Form ID (e.g., I-485, I-130) or 'all' to fetch everything", example = "I-485")
            @PathVariable String formId,
            @RequestParam(required = false) String userId) {

        log.info("USCIS Status API: Fetching status for form: {} for user: {}", formId, userId);

        if ("all".equalsIgnoreCase(formId)) {
            return ResponseEntity.ok(statusService.getAllFormStatuses(userId));
        }

        return statusService.getFormStatus(formId, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("USCIS Status API: Form not found: {}", formId);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/newsroom/{resourceId}")
    @Operation(
            summary = "Get USCIS newsroom status",
            description = "Returns the current sync state and structured alerts for a monitored USCIS Newsroom/Alerts resource."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Newsroom status successfully retrieved.",
                    content = @Content(schema = @Schema(implementation = USCISStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No monitoring record found for the given newsroom ID"
            )
    })
    public ResponseEntity<?> checkNewsroomStatus(
            @Parameter(description = "The Newsroom Resource ID (e.g., newsroom-alerts, news-releases)", example = "newsroom-alerts")
            @PathVariable String resourceId,
            @RequestParam(required = false) String userId) {

        log.info("USCIS Status API: Fetching status for newsroom: {} for user: {}", resourceId, userId);

        return statusService.getNewsroomStatus(resourceId, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("USCIS Status API: Newsroom resource not found: {}", resourceId);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/policy-manual/{resourceId}")
    @Operation(
            summary = "Get USCIS policy manual status",
            description = "Returns the current sync state and structured legal updates for a monitored USCIS Policy Manual resource."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Policy manual status successfully retrieved.",
                    content = @Content(schema = @Schema(implementation = USCISStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No monitoring record found for the given policy manual ID"
            )
    })
    public ResponseEntity<?> checkPolicyManualStatus(
            @Parameter(description = "The Policy Manual Resource ID (e.g., policy-updates)", example = "policy-updates")
            @PathVariable String resourceId,
            @RequestParam(required = false) String userId) {

        log.info("USCIS Status API: Fetching status for policy manual: {} for user: {}", resourceId, userId);

        return statusService.getPolicyManualStatus(resourceId, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("USCIS Status API: Policy manual resource not found: {}", resourceId);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/visa-bulletin/{resourceId}")
    @Operation(
            summary = "Get USCIS visa bulletin status",
            description = "Returns the current sync state and structured monthly determinations for a monitored USCIS Visa Bulletin resource."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Visa Bulletin status successfully retrieved.",
                    content = @Content(schema = @Schema(implementation = USCISStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No monitoring record found for the given visa bulletin ID"
            )
    })
    public ResponseEntity<?> checkVisaBulletinStatus(
            @Parameter(description = "The Visa Bulletin Resource ID (e.g., visa-bulletin)", example = "visa-bulletin")
            @PathVariable String resourceId,
            @RequestParam(required = false) String userId) {

        log.info("USCIS Status API: Fetching status for visa bulletin: {} for user: {}", resourceId, userId);

        return statusService.getVisaBulletinStatus(resourceId, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("USCIS Status API: Visa Bulletin resource not found: {}", resourceId);
                    return ResponseEntity.notFound().build();
                });
    }
}
