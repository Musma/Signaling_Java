FROM amazoncorretto:17.0.8

WORKDIR /app

COPY build/libs/Signaling-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]