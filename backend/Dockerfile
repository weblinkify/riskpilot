# syntax=docker/dockerfile:1.7
# ---- build ----
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q -B dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q -B -DskipTests package \
 && mkdir -p /out && cp target/riskpilot-backend-*.jar /out/app.jar

# ---- runtime ----
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /out/app.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8080/api/health | grep -q '"status":"UP"' || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
