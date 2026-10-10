FROM eclipse-temurin:21-jre-alpine

ENV H2_VERSION=2.3.232
ENV H2_DIR=/opt/h2
ENV H2_DATA=/opt/h2-data

RUN apk add --no-cache curl netcat-openbsd && \
    mkdir -p ${H2_DIR} ${H2_DATA} && \
    curl -L https://repo1.maven.org/maven2/com/h2database/h2/${H2_VERSION}/h2-${H2_VERSION}.jar -o ${H2_DIR}/h2.jar

WORKDIR ${H2_DATA}
VOLUME ${H2_DATA}

# Expor portas:
# 8082: H2 Web Console
# 9092: H2 TCP Server
# 5435: H2 PostgreSQL Protocol Server
EXPOSE 8082 9092 5435

HEALTHCHECK --interval=5s --timeout=3s --retries=5 --start-period=5s \
  CMD nc -z 127.0.0.1 5435 || exit 1

ENTRYPOINT ["java", "-cp", "/opt/h2/h2.jar", "org.h2.tools.Server", \
            "-web", "-webAllowOthers", "-webPort", "8082", \
            "-tcp", "-tcpAllowOthers", "-tcpPort", "9092", \
            "-pg", "-pgAllowOthers", "-pgPort", "5435", \
            "-baseDir", "/opt/h2-data", \
            "-ifNotExists"]
