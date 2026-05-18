# Dockerfile for komunas-app

# Stage 1: Build the application using Maven
FROM maven:3.9.8-eclipse-temurin-21-jammy AS build

WORKDIR /app
COPY . .
RUN mvn clean install -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jdk-jammy

# Install necessary packages
RUN apt-get update && apt-get install -y net-tools iputils-ping openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the application JAR from the build image
COPY --from=build /app/target/KomunasApp.jar KomunasApp.jar

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

EXPOSE 8082

ENTRYPOINT ["java", \
    "-Dhttps.protocols=TLSv1.2,TLSv1.3", \
    "-jar", "KomunasApp.jar"]