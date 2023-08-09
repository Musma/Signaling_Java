Singling_Java_conny
===============
***
Simple-peer를 사용하지 않은 버전입니다.<br>
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
Nextjs + typescript (webrtc 폴더에 위치)

자바스크립트 사용 라이브러리<br>
sockjs : 1.5.1 [깃허브 링크](https://github.com/sockjs/sockjs-client)<br>
stompjs : 2.3.3 [깃허브 링크](https://github.com/stomp-js/stompjs)
***

간단 사용 방법
---
***
1. project/webrtc 경로에서 `npm run dev`
2. http://localhost/video 에 다중연결 webRTC 구현
3. userID는 uuid로 생성
4. roomId는 roomA로 고정되어 있음
***

## API 명세

- message data type
```json
{
    "type": "join",
    "roomId": "roomId",
    "from": "user",
    "candidate": "candidate",
    "sdp": "sdp",
    "allUsers": ["userA","userB"]
}
```
- type: "join","offer","answer","candidate"
- roomId: 접속한 룸
- from: 보낸 유저
- sdp: offer, answer
- candidate: ice candidate
- allUsers: 나를 제외한 현재 룸에 참가한 유저 리스트

## 시나리오
- userA, userB, roomA
- roomA에 userA와 userB가 접속
1. userA pub/room/roomA
```json
{
    "type": "join",
    "roomId": "roomA",
    "from": "userA"
}
```
1.1 현재 roomA에 아무도 없기에 방 생성
2. userB pub/room/roomA
```json
{
    "type": "join",
    "roomId": "roomA",
    "from": "userB"
}
```
2.1 roomA에 userA가 존재하기에 방 참가
2.2 sub/room/roomA
```json
{
    "type": "join",
    "roomId": "roomA",
    "from": "userB",
    "allUsers":["userA"]
}
```
3. userB offer 생성 및 전송
3.1 pub/room/roomA
```json
{
    "type": "offer",
    "roomId": "roomA",
    "from": "userB",
    "sdp": {}
}
```
3.2 userA sub/room/roomA offer 받음
```json
{
    "type": "offer",
    "roomId": "roomA",
    "from": "userB",
    "sdp": {}
}
```
4. userA pub/room/roomA answer 전송
```json
{
"type": "answer",
"roomId": "roomA",
"from": "userA",
"sdp": {}
}
```
4.1 userB sub/room/roomA answer 받음
```json
{
"type": "answer",
"roomId": "roomA",
"from": "userA",
"sdp": {}
}
```
5. ice candidate 교환
```json
{
"type": "candidate",
"roomId": "roomA",
"from": "userA",
"candidate": {}
}
```
```json
{
"type": "candidate",
"roomId": "roomA",
"from": "userB",
"candidate": {}
}
```