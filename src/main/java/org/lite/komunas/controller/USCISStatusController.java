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
import org.lite.komunas.dto.USCISFormStatusResponse;
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
                    content = @Content(schema = @Schema(implementation = USCISFormStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No monitoring record found for the given form ID"
            )
    })
    public ResponseEntity<?> checkStatus(
            @Parameter(description = "The USCIS Form ID (e.g., I-485, I-130) or 'all' to fetch everything", example = "I-485")
            @PathVariable String formId) {

        log.info("USCIS Status API: Fetching status for form: {}", formId);

        if ("all".equalsIgnoreCase(formId)) {
            return ResponseEntity.ok(statusService.getAllFormStatuses());
        }

        return statusService.getFormStatus(formId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("USCIS Status API: Form not found: {}", formId);
                    return ResponseEntity.notFound().build();
                });
    }
}
