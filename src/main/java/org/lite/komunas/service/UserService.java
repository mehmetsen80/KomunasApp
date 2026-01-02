package org.lite.komunas.service;

import org.lite.komunas.dto.AuthResponse;
import org.lite.komunas.dto.LoginRequest;
import org.lite.komunas.dto.RegisterRequest;

public interface UserService {

    /**
     * Register a new user
     * 
     * @param request The registration request
     * @return AuthResponse with registration result
     */
    AuthResponse registerUser(RegisterRequest request);

    /**
     * Authenticate user login
     * 
     * @param request The login request
     * @return AuthResponse with authentication result
     */
    AuthResponse loginUser(LoginRequest request);
}