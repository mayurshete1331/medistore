# Stage 1: Build the Spring Boot Application
FROM gradle:8.10-jdk21-alpine AS builder
WORKDIR /app

# Copy configuration and source code
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src

# Build production jar using container's pre-installed Gradle
RUN gradle bootJar --no-daemon -x test

# Stage 2: Minimal Java 21 Runtime (Eclipse Temurin JRE)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

# Tuned memory limits for free cloud containers (512MB RAM ceiling)
ENV JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -jar app.jar"]
