package org.lite.komunas.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proxy endpoint that downloads a document from the Linqra API-gateway via {@link LinqraClient}.
 *
 * <p>The browser's own JWT (sent as {@code Authorization: Bearer <token>}) is forwarded directly
 * as {@code X-User-Token} so Linqra can resolve the correct team context and decryption key.
 * Using the KomunasApp-issued HMAC token (from the Spring Security context) would fail because
 * Linqra cannot validate it with its own JWT secret.</p>
 */
@RestController
@RequestMapping("/api/linqra/documents")
@RequiredArgsConstructor
@Slf4j
public class LinqraDocumentDownloadController {

    private final LinqraClient linqraClient;

    @GetMapping("/{documentId}/download")
    public ResponseEntity<byte[]> download(
            @PathVariable String documentId,
            HttpServletRequest request) {

        // Extract the raw Bearer token from the incoming browser request.
        // This token was issued by Linqra auth (Keycloak or Linqra user JWT) and can be
        // validated by the Linqra gateway's TeamContextService.
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String bearerToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            bearerToken = authHeader.substring(7);
        }

        if (bearerToken == null) {
            log.warn("No Bearer token found in request for document {}", documentId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("Downloading document {} via LinqraClient (forwarding browser token)", documentId);
        ResponseEntity<byte[]> gatewayResponse = linqraClient.downloadDocument(documentId, bearerToken);
 
        if (!gatewayResponse.getStatusCode().is2xxSuccessful() || gatewayResponse.getBody() == null) {
            log.warn("Document {} could not be fetched or is empty", documentId);
            return ResponseEntity.status(gatewayResponse.getStatusCode()).build();
        }
 
        HttpHeaders headers = new HttpHeaders();
        // Forward content disposition (with filename) and content type from gateway if present
        if (gatewayResponse.getHeaders().getContentDisposition().getFilename() != null) {
            headers.setContentDisposition(gatewayResponse.getHeaders().getContentDisposition());
        } else {
            headers.setContentDisposition(ContentDisposition.builder("attachment")
                    .filename(documentId + ".pdf").build());
        }
 
        headers.setContentType(gatewayResponse.getHeaders().getContentType() != null
                ? gatewayResponse.getHeaders().getContentType()
                : MediaType.APPLICATION_OCTET_STREAM);
 
        return new ResponseEntity<>(gatewayResponse.getBody(), headers, HttpStatus.OK);
    }
}
