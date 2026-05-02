package org.lite.komunas.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "registration")
public class RegistrationConfig {
    /**
     * Map of email domains to their allowed Team IDs.
     */
    private Map<String, String> domainMapping;

    /**
     * Default roles assigned to newly registered members.
     */
    private List<String> defaultRoles;

    /**
     * The 'From' address for welcome emails.
     */
    private String welcomeFrom = "noreply@linqra.com";

    /**
     * List of addresses to BCC for each new registration.
     */
    private List<String> welcomeBcc;
}
