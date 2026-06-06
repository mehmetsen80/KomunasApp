package org.lite.komunas.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "demo-request")
public class DemoRequestConfig {
    /**
     * The recipient address for landing page demo requests.
     */
    private String recipient = "msen@linqra.com";

    /**
     * The 'From' address for demo request notification emails.
     */
    private String from = "noreply@linqra.com";
}
