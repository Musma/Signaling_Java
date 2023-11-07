Singling_Java
===============
***
이 프로젝트는 안전관리플랫폼 WebRTC 시그널링 서버 입니다. <br>
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
docker run -d --rm -p 9700:9700 signaling-java
```
4. 완료
***



RTCPeerConnection ( 일반 Peer 테스트 ) 간단 사용 방법 
---
***
해당 코드는 /resources/static/RTCPeerConnection 에 있는 프론트 코드를 기준으로 설명드립니다. <br>
`index.html`, `peerConfig.js`

1. http://localhost:9700/RTCPeerConnection/index.html 들어간다.
2. 임의의 룸번호를 입력 후, `enter Room` 버튼을 클릭하여 룸을 만들어준다.
3. 다른 웹 브라우저를 오픈하여, http://localhost:9700/RTCPeerConnection/index.html 로 들어간다
4. 위에서 입력한 룸번호를 입력 후, `enter Room` 버튼을 클릭하여 룸에 들어가준다.
5. `start Streams` 버튼을 클릭하여, 상대쪽에 웹캠 정보를 WebRTC로 보내준다. ( 어느 브라우저를 선택해도 가능 )
7. 아래에서, 서로의 웹캠이 보인다면 완료!
***

외부에서 웹캠 연결 방법
---
만약, 로컬 환경이 아닌, 외부에서 IP를 입력하여 들어와서 웹캠을 테스트 하고 싶다면 해당 방법을 사용하여, 설정 해줘야 한다.
1. 크롬 에서 chrome://flags 페이지에 접속
2. Insecure origins treated as secure 옵션에서 http://{내 아이피}:9700 ip 추가
3. http://localhost:9700/RTCPeerConnection/index.html 에서 룸 번호 입력 후 웹캠이 열리면 완료
***
