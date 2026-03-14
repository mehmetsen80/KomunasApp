package org.lite.komunas.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.net.ssl.*;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;

@Configuration
@Profile("dev")
@Slf4j
public class DevSslBypassConfig {

    @PostConstruct
    public void turnOffSslChecking() throws NoSuchAlgorithmException, KeyManagementException {
        log.warn("!!! DEV MODE: DISABLING SSL CERTIFICATE VALIDATION GLOBALLY !!!");

        // Create a trust manager that does not validate certificate chains
        final TrustManager[] trustAllCerts = new TrustManager[] {
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {
                    }

                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {
                    }

                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                }
        };

        // Install the all-trusting trust manager
        final SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

        // Apply to HttpsURLConnection
        HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());

        // Also set the global default SSLContext for other clients (like Apache
        // HttpClient used by Eureka or RestClient)
        SSLContext.setDefault(sslContext);

        // Apply host name verifier to allow any hostname
        HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

        log.info("Global SSL Verification disabled for HttpsURLConnection and default SSLContext.");
    }
}
