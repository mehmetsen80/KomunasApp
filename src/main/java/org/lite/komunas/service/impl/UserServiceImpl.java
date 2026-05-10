package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.config.RegistrationConfig;
import org.lite.komunas.dto.*;
import org.lite.komunas.entity.User;
import org.lite.komunas.repository.UserRepository;
import org.lite.komunas.service.JwtService;
import org.lite.komunas.service.UserService;
import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LinqraClient linqraClient;
    private final RegistrationConfig registrationConfig;

    @Override
    public AuthResponse registerUser(RegisterRequest request) {
        log.info("Registration attempt for username: {}", request.getUsername());

        // Robust email validation using Apache Commons Validator
        if (request.getEmail() == null || !EmailValidator.getInstance().isValid(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email format")
                    .username(request.getUsername())
                    .build();
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Username already exists")
                    .username(request.getUsername())
                    .build();
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already exists")
                    .username(request.getUsername())
                    .build();
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(Set.of("USER", "gateway_admin_realm", "gateway_admin"))
                .build();

        User savedUser = userRepository.save(user);

        // Dispatch for welcome email
        sendWelcomeEmail(savedUser);

        String token = jwtService.generateToken(user.getUsername(), user.getRoles(), null);
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully")
                .username(user.getUsername())
                .token(token)
                .refreshToken(refreshToken)
                .user(toUserMap(savedUser))
                .build();
    }

    private void sendWelcomeEmail(User user) {
        try {
            // Load template from classpath
            String template;
            try (var is = new ClassPathResource("templates/welcome-email.html").getInputStream()) {
                template = StreamUtils.copyToString(is, Objects.requireNonNull(StandardCharsets.UTF_8));
            }

            // Inject dynamic values
            String loginLink = "https://komunas.com/login";
            String fullName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            String body = template
                    .replace("[NAME]", fullName)
                    .replace("[LOGIN_LINK]", loginLink);

            EmailRequestDTO emailRequest = EmailRequestDTO.builder()
                    .to(user.getEmail())
                    .from("Komunas <" + registrationConfig.getWelcomeFrom() + ">")
                    .bcc(registrationConfig.getWelcomeBcc())
                    .subject("Welcome to Komunas")
                    .body(body)
                    .html(true)
                    .build();

            log.info("Dispatching welcome email to {}. Request Details: to={}, from={}, subject={}, bcc={}",
                    user.getEmail(), emailRequest.getTo(), emailRequest.getFrom(), emailRequest.getSubject(),
                    emailRequest.getBcc());
            linqraClient.sendEmail(emailRequest);
        } catch (Exception e) {
            log.error("Failed to load or send welcome email: {}", e.getMessage());
        }
    }

    @Override
    public AuthResponse loginUser(LoginRequest request) {
        log.info("Login attempt for identifier: {}", request.getUsername());

        // Support login by username OR email, case-insensitive
        String identifier = request.getUsername();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier).orElse(null);

        if (user == null) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User not found")
                    .username(request.getUsername())
                    .build();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .username(request.getUsername())
                    .build();
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRoles(), null);
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .username(user.getUsername())
                .token(token)
                .refreshToken(refreshToken)
                .user(toUserMap(user))
                .build();
    }

    @Override
    public AuthResponse processForgotPassword(ForgotPasswordRequest request) {
        log.info("Processing forgot password request for email: {}", request.getEmail());

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        // We always return a generic success message for security to prevent email
        // enumeration
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            sendResetPasswordEmail(user, token);
        }

        return AuthResponse.builder()
                .success(true)
                .message("If an account exists with that email, a password reset link has been sent.")
                .build();
    }

    private void sendResetPasswordEmail(User user, String token) {
        try {
            String template;
            try (var is = new ClassPathResource("templates/reset-password-email.html").getInputStream()) {
                template = StreamUtils.copyToString(is, Objects.requireNonNull(StandardCharsets.UTF_8));
            }

            // Inject dynamic values
            String fullName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            String resetLink = "https://komunas.com/reset-password?token=" + token;
            String body = template
                    .replace("[NAME]", fullName)
                    .replace("[RESET_LINK]", resetLink);

            EmailRequestDTO emailRequest = EmailRequestDTO.builder()
                    .to(user.getEmail())
                    .from("Komunas <" + registrationConfig.getWelcomeFrom() + ">")
                    .bcc(registrationConfig.getWelcomeBcc())
                    .subject("Password Reset Request")
                    .body(body)
                    .html(true)
                    .build();

            log.info("Dispatching reset email to {}. Request Details: to={}, from={}, subject={}, bcc={}",
                    user.getEmail(), emailRequest.getTo(), emailRequest.getFrom(), emailRequest.getSubject(),
                    emailRequest.getBcc());
            linqraClient.sendEmail(emailRequest);
        } catch (Exception e) {
            log.error("Failed to load or send reset password email: {}", e.getMessage());
        }
    }

    @Override
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        log.info("Processing reset password for token: {}", request.getToken());

        Optional<User> userOptional = userRepository.findByResetPasswordToken(request.getToken());

        if (userOptional.isEmpty()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid or expired token")
                    .build();
        }

        User user = userOptional.get();

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Reset link has expired")
                    .build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        return AuthResponse.builder()
                .success(true)
                .message("Password has been reset successfully. You can now login.")
                .build();
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("fullName", user.getFullName());
        map.put("roles", user.getRoles());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }
}