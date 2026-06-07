package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.config.DemoRequestConfig;
import org.lite.komunas.dto.EmailRequestDTO;
import org.lite.komunas.entity.DemoRequest;
import org.lite.komunas.repository.DemoRequestRepository;
import org.lite.komunas.service.DemoRequestService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemoRequestServiceImpl implements DemoRequestService {

    private final DemoRequestRepository demoRequestRepository;
    private final LinqraClient linqraClient;
    private final DemoRequestConfig demoRequestConfig;

    @Override
    public DemoRequest createDemoRequest(DemoRequest request) {
        log.info("Creating a new demo request for: {}, company: {}", request.getEmail(), request.getCompany());

        if (request.getCreatedAt() == null) {
            request.setCreatedAt(LocalDateTime.now());
        }

        DemoRequest saved = demoRequestRepository.save(request);

        // Dispatch email notification and persist actual result
        boolean emailSent = sendEmailNotification(saved);
        saved.setEmailSent(emailSent);
        demoRequestRepository.save(saved);

        return saved;
    }

    private boolean sendEmailNotification(DemoRequest request) {
        try {
            String subject = "New Komunas Demo Request: " + request.getCompany();
            String template = "";

            try (var is = new ClassPathResource("templates/demo-request-email.html").getInputStream()) {
                template = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }

            String notesVal = request.getNotes() != null && !request.getNotes().trim().isEmpty()
                    ? request.getNotes()
                    : "N/A";

            String body = template
                    .replace("[NAME]", request.getName())
                    .replace("[EMAIL]", request.getEmail())
                    .replace("[COMPANY]", request.getCompany())
                    .replace("[NOTES]", notesVal)
                    .replace("[SUBMITTED_AT]", request.getCreatedAt().toString());

            EmailRequestDTO emailRequest = EmailRequestDTO.builder()
                    .to(demoRequestConfig.getRecipient())
                    .from("Komunas Demo Manager <" + demoRequestConfig.getFrom() + ">")
                    .subject(subject)
                    .body(body)
                    .html(true)
                    .build();

            log.info("Dispatching demo request notification to {}", demoRequestConfig.getRecipient());
            boolean success = linqraClient.sendEmail(emailRequest);
            if (success) {
                log.info("Demo request email sent successfully to {}", demoRequestConfig.getRecipient());
            } else {
                log.warn("Demo request email failed to dispatch via Linqra Client");
            }
            return success;
        } catch (Exception e) {
            log.error("Failed to send demo request email notification: {}", e.getMessage());
            return false;
        }
    }
}
