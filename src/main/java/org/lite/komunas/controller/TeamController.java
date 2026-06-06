package org.lite.komunas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.dto.TeamDTO;
import org.lite.komunas.entity.User;
import org.lite.komunas.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Slf4j
public class TeamController {

    private final LinqraClient linqraClient;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserTeams(@RequestParam String userId) {
        log.info("Request to fetch teams for user: {}", userId);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            String currentPrincipalName = authentication.getName();
            String email = null;
            String username = null;

            if (authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getClaimAsString("email");
                username = jwt.getClaimAsString("preferred_username");
            }

            boolean isSelf = (userId != null) && (userId.equalsIgnoreCase(currentPrincipalName) ||
                    (email != null && email.equalsIgnoreCase(userId)) ||
                    (username != null && username.equalsIgnoreCase(userId)));

            boolean isAuthorized = isSelf || authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(role -> role.equals("ROLE_SUPER_ADMIN") || role.equals("ROLE_ADMIN")
                            || role.equals("ROLE_gateway_admin"));

            if (!isAuthorized) {
                log.warn("Access denied for user {} requesting teams of {}", currentPrincipalName, userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied. You can only view your own assigned teams.");
            }
        }

        List<TeamDTO> teams;
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(userId, userId);
        if (userOpt.isPresent() && userOpt.get().getTeamId() != null && !userOpt.get().getTeamId().isBlank()) {
            String teamId = userOpt.get().getTeamId();
            List<TeamDTO> allTeams = linqraClient.fetchTeams();
            teams = allTeams.stream()
                    .filter(t -> teamId.equals(t.getId()))
                    .toList();
        } else {
            teams = linqraClient.getTeamsByUserId(userId);
        }
        return ResponseEntity.ok(teams);
    }
}
