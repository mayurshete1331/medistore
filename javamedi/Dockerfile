# Stage 1: Build the Spring Boot Application
FROM gradle:8.10-jdk21-alpine AS builder
WORKDIR /app

# Copy gradle files first for dependency caching
COPY gradlew build.gradle settings.gradle ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and build production jar
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Minimal Java 21 Runtime (Eclipse Temurin JRE)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

# Tuned memory limits for free cloud containers (512MB RAM ceiling)
ENV JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -jar app.jar"]
