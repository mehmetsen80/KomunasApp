package org.lite.inventory.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class JwtRoleValidationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull  HttpServletResponse response,
                                    @NonNull  FilterChain filterChain) throws ServletException, IOException {

        // Retrieve the JWT token from the security context
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            // Log the JWT token for debugging purposes
            log.info("JWT Token: {}", jwt.getTokenValue());
            log.info("Realm Roles: {}", jwt.getClaimAsStringList("realm_access.roles"));
            Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
            log.info("Client Roles: {}", resourceAccess);

            if (hasRequiredRole(jwt)) {
                log.info("Required roles found, proceeding with request to: {}", request.getRequestURI());
                try {
                    filterChain.doFilter(request, response);
                } catch (Exception e) {
                    log.info("Error during filter chain execution: {}", e.getMessage());
                    log.info("Full error: ", e);
                    throw e;
                }
            } else {
                log.warn("Required roles not found in token");
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            }
        } else {
            log.warn("No JWT token found in request");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }
    }

    //We force both realm and resource roles to exist in the token
    private boolean hasRequiredRole(Jwt jwt) {
        // Check realm roles
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        boolean hasRealmRole = false;
        if (realmAccess != null) {
            List<String> realmRoles = (List<String>) realmAccess.get("roles");
            if (realmRoles != null && realmRoles.contains("gateway_admin_realm")) {
                hasRealmRole = true;
            }
        }

        // Check client roles for linqra-gateway-client
        boolean hasClientRole = false;
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess != null && resourceAccess.containsKey("linqra-gateway-client")) {
            Map<String, List<String>> clientRoles = (Map<String, List<String>>) resourceAccess.get("linqra-gateway-client");
            if (clientRoles.get("roles").contains("gateway_admin")) {
                hasClientRole = true;
            }
        }

        // Both roles must be present
        return hasRealmRole && hasClientRole;
    }
}

