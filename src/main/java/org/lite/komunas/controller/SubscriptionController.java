package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "User resource subscription APIs")
public class SubscriptionController {

    private final LinqraClient linqraClient;

    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe the authenticated user to a resource")
    public ResponseEntity<Map<String, Object>> subscribe(@RequestBody Map<String, Object> request) {
        log.info("Processing subscription request for user: {}", request.get("userId"));
        Map<String, Object> response = linqraClient.subscribe(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{subscriptionId}")
    @Operation(summary = "Unsubscribe from a specific resource")
    public ResponseEntity<Void> unsubscribe(@PathVariable String subscriptionId) {
        log.info("Processing unsubscribe request for: {}", subscriptionId);
        boolean success = linqraClient.unsubscribe(subscriptionId);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.internalServerError().build();
    }
}
