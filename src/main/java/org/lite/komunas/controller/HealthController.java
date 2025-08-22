package org.lite.inventory.controller;

import lombok.extern.slf4j.Slf4j;
import org.lite.inventory.model.HealthStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "Health", description = "Health check APIs")
@RestController
@Slf4j
public class HealthController {

    @Value("${spring.application.name}")
    private String serviceId;

    private final Instant startTime = Instant.now();

    @Operation(
        summary = "Get service health status",
        description = "Retrieves detailed health information including memory usage, CPU load, and uptime"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Service health information retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = HealthStatus.class),
                examples = @ExampleObject(value = """
                    {
                        "serviceId": "inventory-service",
                        "status": "UP",
                        "uptime": "1d 2h 3m 4s",
                        "timestamp": "2024-01-20T10:15:30.123Z",
                        "metrics": {
                            "cpu": 0.75,
                            "memory": 65.5,
                            "responseTime": 0.0
                        }
                    }
                    """)
            )
        ),
        @ApiResponse(
            responseCode = "503",
            description = "Service is unhealthy",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = HealthStatus.class)
            )
        )
    })
    @GetMapping(
        path = "/health",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<HealthStatus> getHealth() {
        HealthStatus status = new HealthStatus();
        status.setServiceId(serviceId);
        
        try {
            // Get system metrics
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

            // Calculate uptime
            Duration uptime = Duration.between(startTime, Instant.now());
            
            // Calculate memory usage
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
            double memoryUsage = ((double) usedMemory / maxMemory) * 100;

            // Set health status details
            boolean healthy = isHealthy();
            status.setStatus(healthy ? "UP" : "DOWN");
            status.setUptime(formatUptime(uptime));
            status.setTimestamp(Instant.now());
            
            // Add detailed metrics
            Map<String, Double> metrics = new HashMap<>();
            metrics.put("cpu", osBean.getSystemLoadAverage());
            metrics.put("memory", Math.round(memoryUsage * 100.0) / 100.0); // Round to 2 decimal places
            metrics.put("responseTime", measureResponseTime());
            status.setMetrics(metrics);

            return ResponseEntity
                .status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(status);

        } catch (Exception e) {
            log.error("Error getting health status: {}", e.getMessage());
            status.setStatus("DOWN");
            status.setTimestamp(Instant.now());
            status.setMetrics(Map.of(
                "error", 1.0,
                "message", 0.0
            ));
            return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(status);
        }
    }

    private boolean isHealthy() {
        try {
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            
            // Check memory usage
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
            double memoryUsage = ((double) usedMemory / maxMemory) * 100;
            
            // Check CPU usage
            double cpuLoad = osBean.getSystemLoadAverage();
            
            // Define thresholds (could be made configurable)
            return memoryUsage < 90.0 && cpuLoad >= 0;
        } catch (Exception e) {
            log.error("Error checking service health: {}", e.getMessage());
            return false;
        }
    }

    private String formatUptime(Duration uptime) {
        long days = uptime.toDays();
        long hours = uptime.toHoursPart();
        long minutes = uptime.toMinutesPart();
        long seconds = uptime.toSecondsPart();

        return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
    }

    private double measureResponseTime() {
        long start = System.nanoTime();
        // Perform a simple operation to measure baseline response time
        Runtime.getRuntime().freeMemory();
        long end = System.nanoTime();
        return (end - start) / 1_000_000.0; // Convert to milliseconds
    }
} 