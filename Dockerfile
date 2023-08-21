FROM amazoncorretto:17.0.8
ARG JAR_FILE_PATH=*.jar
COPY ${JAR_FILE_PATH} app.jar