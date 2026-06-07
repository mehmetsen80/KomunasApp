package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.TeamDTO;
import org.lite.komunas.dto.UserDTO;
import org.lite.komunas.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "Administrative APIs for user and team management")
public class UsersController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieves a list of all registered users (Admin or Team Member)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'gateway_admin', 'USER')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Fetching all users for administration");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Updates a user's roles and team assignment (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> updateUser(
            @PathVariable String id,
            @RequestParam Set<String> roles,
            @RequestParam(required = false) String teamId) {
        log.info("Updating user {} with roles {} and teamId {}", id, roles, teamId);
        userService.updateUser(id, roles, teamId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Deletes a user account (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        log.info("Deleting user {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/teams")
    @Operation(summary = "Get all teams", description = "Retrieves a list of all institutional teams (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<TeamDTO>> getAllTeams() {
        log.info("Fetching all institutional teams for administration");
        return ResponseEntity.ok(userService.getAllTeams());
    }
}
