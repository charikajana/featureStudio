# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine

# Install git and other utilities
RUN apk add --no-cache git openssh-client

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create necessary directories and set permissions
RUN mkdir -p /data/workspaces && \
    chown -R appuser:appgroup /data/workspaces

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
