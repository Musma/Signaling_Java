Singling_Java
===============
***
이 프로젝트는 WebRTC 시그널링 서버를 테스트하기 위해 만들어진 프로젝트입니다.<br>
***
<br>

프로젝트 정보
--------
백엔드
----
***
spring boot 3.1.2 <br>
자바 버전 : openjdk 17 ( Corretto ) <br>
gradle 
```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket' // 시그널링 서버 구축을 위한 websocket
    compileOnly 'org.projectlombok:lombok'
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```
웹소켓 : STOMP

***
프론트
---
***
html + javascript

자바스크립트 사용 라이브러리<br>
simple-peer :  9.8.0 [깃허브 링크](https://github.com/feross/simple-peer)<br>
sockjs : 1.5.1 [깃허브 링크](https://github.com/sockjs/sockjs-client)<br>
stompjs : 2.3.3 [깃허브 링크](https://github.com/stomp-js/stompjs)
***

docker로 실행
---
***
1. gradle build 실행
```
gradle build
```
2. dockerfile이 있는 곳에서 docker build 실행
```
docker build -t signaling-java .
```
3. docker run 으로 실행
```
docker run -d --rm -p 8080:8080 signaling-java
```
4. 완료
***


간단 사용 방법
---
***
1. http://localhost:8080/simple-peer/index.html 로 들어간다.
2. 임의의 룸번호를 입력해준다.
3. http://localhost:8080/simple-peer/cam.html 로 들어간다
4. 위에서 입력한 룸번호를 입력해준다.
5. index 페이지에서 cam open 버튼을 클릭하여 웹캠을 활성화 해준다.
6. index 페이지에서 start Stream 버튼을 클릭해준다.
7. cam.html 에서 index.html 웹캠이 재대로 나온다면 완료!
***
