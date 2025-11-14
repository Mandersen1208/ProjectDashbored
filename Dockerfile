# Multi-stage build for Spring Boot application

# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-23 AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml first (for layer caching)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:23-jre-alpine
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
