package org.lite.komunas.service;

import org.lite.komunas.dto.AuthResponse;
import org.lite.komunas.dto.ForgotPasswordRequest;
import org.lite.komunas.dto.LoginRequest;
import org.lite.komunas.dto.RegisterRequest;
import org.lite.komunas.dto.ResetPasswordRequest;
import org.lite.komunas.dto.UserDTO;
import org.lite.komunas.dto.TeamDTO;
import java.util.List;
import java.util.Set;

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

    /**
     * Process forgot password request
     * 
     * @param request The forgot password request
     * @return AuthResponse with result message
     */
    AuthResponse processForgotPassword(ForgotPasswordRequest request);

    /**
     * Reset user password
     * 
     * @param request The reset password request
     * @return AuthResponse with result message
     */
    AuthResponse resetPassword(ResetPasswordRequest request);

    /**
     * Fetch all users
     * 
     * @return List of UserDTOs
     */
    List<UserDTO> getAllUsers();

    /**
     * Update user details (roles and teamId)
     */
    void updateUser(String userId, Set<String> roles, String teamId);

    /**
     * Delete a user
     */
    void deleteUser(String userId);

    /**
     * Fetch all available teams from the gateway
     */
    List<TeamDTO> getAllTeams();
}