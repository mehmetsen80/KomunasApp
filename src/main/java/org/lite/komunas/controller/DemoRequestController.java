package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.DemoRequest;
import org.lite.komunas.service.DemoRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo-requests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Demo Requests", description = "APIs for landing page demo request submissions")
public class DemoRequestController {

    private final DemoRequestService demoRequestService;

    @PostMapping
    @Operation(summary = "Submit a demo request", description = "Saves the demo request and triggers an email notification to admin")
    public ResponseEntity<DemoRequest> submitDemoRequest(@RequestBody DemoRequest request) {
        log.info("Received request to submit demo for email: {}", request.getEmail());
        DemoRequest saved = demoRequestService.createDemoRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
