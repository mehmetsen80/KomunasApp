# Dockerfile for komunas-app

# Stage 1: Build the application using Maven
FROM maven:3.9.8-eclipse-temurin-21-jammy AS build

WORKDIR /app
COPY . .
RUN mvn clean install -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jdk-jammy

# Install base network tools, SSL support, Xvfb, VNC, noVNC, fluxbox, and browser shared libraries for Firefox/Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    net-tools \
    iputils-ping \
    openssl \
    ca-certificates \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    fluxbox \
    libgtk-3-0 \
    libasound2 \
    libegl1 \
    libx11-xcb1 \
    libdbus-glib-1-2 \
    libxt6 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the application JAR from the build image
COPY --from=build /app/target/KomunasApp.jar KomunasApp.jar

# Copy the display entrypoint script
COPY .kube/eks/entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

# Copy the keystore and truststore files
COPY keys/komunas-app-keystore-container.jks client-keystore.jks
COPY keys/client-truststore.jks client-truststore.jks

# Set permissions for keystore and truststore files
RUN chmod 644 /app/client-truststore.jks /app/client-keystore.jks

# Set environment variables
ENV CLIENT_KEY_STORE=/app/client-keystore.jks
ENV CLIENT_KEY_STORE_PASSWORD=123456
ENV CLIENT_TRUST_STORE=/app/client-truststore.jks
ENV CLIENT_TRUST_STORE_PASSWORD=123456
ENV GATEWAY_SERVICE_URL=api-gateway-service
ENV CACERTS_PATH=${JAVA_HOME}/lib/security/cacerts

# Verify cacerts file exists and is writable
RUN if [ ! -f "${CACERTS_PATH}" ]; then \
    echo "cacerts file not found at ${CACERTS_PATH}"; \
    exit 1; \
    fi && \
    chown root:root "${CACERTS_PATH}" && \
    chmod 664 "${CACERTS_PATH}"

# Import all certificates from client-truststore.jks into cacerts
RUN keytool -importkeystore -srckeystore /app/client-truststore.jks \
    -destkeystore "${CACERTS_PATH}" \
    -srcstorepass "${CLIENT_TRUST_STORE_PASSWORD}" \
    -deststorepass "${CLIENT_TRUST_STORE_PASSWORD}" \
    -noprompt -srcstoretype JKS -deststoretype JKS || true

# Expose Spring Boot and noVNC visual port
EXPOSE 8082 8083

ENTRYPOINT ["./entrypoint.sh"]