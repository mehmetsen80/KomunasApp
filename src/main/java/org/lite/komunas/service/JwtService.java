package org.lite.komunas.service;

import java.util.Set;

public interface JwtService {
    String generateToken(String username, Set<String> roles, String teamId);
    String generateRefreshToken(String username);
    String getUsernameFromToken(String token);
    boolean validateToken(String token);
}
