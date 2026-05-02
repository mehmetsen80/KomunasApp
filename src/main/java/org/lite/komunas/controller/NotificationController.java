package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.dto.NotificationResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification APIs")
public class NotificationController {

    private final LinqraClient linqraClient;

    @GetMapping("/all")
    @Operation(summary = "Get all notifications for the authenticated user")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(@RequestParam String userId) {
        log.info("Fetching notifications for user: {}", userId);
        return ResponseEntity.ok(linqraClient.getNotifications(userId));
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Void> markAsRead(@PathVariable String notificationId) {
        log.info("Marking notification {} as read", notificationId);
        boolean success = linqraClient.markNotificationAsRead(notificationId);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.internalServerError().build();
    }
}
