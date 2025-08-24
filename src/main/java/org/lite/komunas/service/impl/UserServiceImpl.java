package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.AuthResponse;
import org.lite.komunas.dto.LoginRequest;
import org.lite.komunas.dto.RegisterRequest;
import org.lite.komunas.entity.User;
import org.lite.komunas.repository.UserRepository;
import org.lite.komunas.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse registerUser(RegisterRequest request) {
        log.info("Registration attempt for username: {}", request.getUsername());

        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Username already exists: {}", request.getUsername());
            return new AuthResponse("Username already exists", request.getUsername(), false);
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists: {}", request.getEmail());
            return new AuthResponse("Email already exists", request.getUsername(), false);
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(Set.of("USER")) // Default role
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        return new AuthResponse("User registered successfully", request.getUsername(), true);
    }

    @Override
    public AuthResponse loginUser(LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());

        // Find user by username
        return userRepository.findByUsername(request.getUsername())
                .map(user -> {
                    // Check if password matches
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        log.info("User logged in successfully: {}", request.getUsername());
                        return new AuthResponse("Login successful", request.getUsername(), true);
                    } else {
                        log.warn("Invalid password for user: {}", request.getUsername());
                        return new AuthResponse("Invalid credentials", request.getUsername(), false);
                    }
                })
                .orElse(new AuthResponse("User not found", request.getUsername(), false));
    }
} 