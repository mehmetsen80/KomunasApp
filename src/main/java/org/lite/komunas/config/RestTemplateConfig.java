package org.lite.inventory.config;

import lombok.extern.slf4j.Slf4j;
import org.lite.inventory.interceptor.ServiceNameInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.client.RestTemplate;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.HttpMessageConverter;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Configuration
@Slf4j
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // Create connection manager with default SSL settings
        HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnPerRoute(20)
                .setMaxConnTotal(100)
                .build();

        // Create HTTP client with connection manager
        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .build();

        // Create request factory
        HttpComponentsClientHttpRequestFactory factory = 
                new HttpComponentsClientHttpRequestFactory(httpClient);
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);

        RestTemplate restTemplate = new RestTemplate(factory);

        // Configure message converters
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();

        // Add String message converter
        StringHttpMessageConverter stringConverter = new StringHttpMessageConverter(StandardCharsets.UTF_8);
        stringConverter.setSupportedMediaTypes(List.of(
                MediaType.TEXT_PLAIN,
                MediaType.APPLICATION_JSON,
                new MediaType("application", "*+json")
        ));
        messageConverters.add(stringConverter);

        // Add JSON message converter
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter();
        jsonConverter.setSupportedMediaTypes(List.of(
                MediaType.APPLICATION_JSON,
                MediaType.APPLICATION_OCTET_STREAM,
                new MediaType("application", "*+json")
        ));
        messageConverters.add(jsonConverter);

        restTemplate.setMessageConverters(messageConverters);

        // Configure interceptors
        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>();
        
        // Add ServiceNameInterceptor
        interceptors.add(new ServiceNameInterceptor());

        // Add JWT token interceptor
        interceptors.add((request, body, execution) -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getCredentials() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getCredentials();
                String token = jwt.getTokenValue();

                request.getHeaders().setBearerAuth(token);
                request.getHeaders().set("X-User-Token", token);
                request.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                request.getHeaders().setAccept(List.of(
                    MediaType.APPLICATION_JSON,
                    MediaType.TEXT_PLAIN,
                    new MediaType("application", "*+json")
                ));

                log.debug("Request headers: {}", request.getHeaders());
                log.info("Forwarding token to API Gateway. Token type: {}, Issuer: {}",
                        jwt.getHeaders().get("typ"),
                        jwt.getClaim("iss"));
            } else {
                log.warn("No JWT token found in SecurityContext");
            }

            try {
                return execution.execute(request, body);
            } catch (Exception e) {
                log.error("Error executing request: {}", e.getMessage());
                throw e;
            }
        });

        restTemplate.setInterceptors(interceptors);

        return restTemplate;
    }
}
