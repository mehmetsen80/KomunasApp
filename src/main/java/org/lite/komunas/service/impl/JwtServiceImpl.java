package org.lite.komunas.service.impl;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class JwtServiceImpl implements JwtService {

    @Value("${jwt.secret:9a4f4e35455ad5b1ff013000f09b30b59a4f4e35455ad5b1ff013000f09b30b5}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    @Override
    public String generateToken(String username, Set<String> roles, String teamId) {
        Map<String, Object> claims = new HashMap<>();

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", roles.stream()
                .filter(r -> r.endsWith("_realm") || r.equals("SUPER_ADMIN"))
                .toList());
        claims.put("realm_access", realmAccess);

        Map<String, Object> resourceAccess = new HashMap<>();
        Map<String, Object> clientAccess = new HashMap<>();
        clientAccess.put("roles", roles.stream()
                .filter(r -> !r.endsWith("_realm"))
                .toList());
        resourceAccess.put("linqra-gateway-client", clientAccess);
        claims.put("resource_access", resourceAccess);

        if (teamId != null && !teamId.isBlank()) {
            claims.put("teamId", teamId);
        }

        return buildToken(claims, username, jwtExpiration);
    }

    @Override
    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("typ", "Refresh");
        return buildToken(claims, username, refreshExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String username, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    @Override
    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    @Override
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
