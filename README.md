Singling_Java_conny
===============
***
Simple-peer를 사용하지 않은 버전입니다.<br>
이 프로젝트는 WebRTC 시그널링 서버를 테스트하기 위해 만들어진 프로젝트입니다.<br>
기존 webRTC는 pure 패키지에 있습니다. <br/>
kurento 설정 및 핸들러는 kurento 패키지에 있습니다. <br/>
***
<br>

# 프로젝트 정보
- 스캔 범위를 바꿔 테스트하세요
- kurento 연결시 vm 옵션을 수정해야합니다.!!
```
@SpringBootApplication(scanBasePackages = "com.webrtc.signaling.kurento")

# vm 옵션
-Dkms.url=ws://<KMS IP>:<PORT>/kurento
```
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
    
    // kurento
    // https://mvnrepository.com/artifact/org.kurento/kurento-client
    implementation 'org.kurento:kurento-client:7.0.0'
    // https://mvnrepository.com/artifact/org.kurento/kurento-utils-js
    
    implementation 'org.kurento:kurento-utils-js:7.0.0'
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

# kurento 프론트
## /kurento 에 존재
- one to many 이기에 하나의 브라우저에서 present 버튼 누르고 다른 브라우저에서 viewer 버튼을 눌러야 합니다.
- Present click -> peerConnection 생성 및 offer 전송 -> answer 받아 등록 후 ice 전송 -> ice 받아 등록 -> stream을 미디어 서버로 전송
- Viewer click -> peerConnection 생성 및 offer 전송 -> answer 받아 등록 후 ice 전송 -> ice 받아 등록 -> 미디어 서버에서 peerConnection으로 들어오는 stream 등록
# kurento media server
```shell
## linux
docker run -d --name kurento --network host \
    kurento/kurento-media-server:7.0.0
    
## mac or windows
docker run --rm -d \
    -p 8888:8888/tcp \
    -p 5000-5050:5000-5050/udp \
    -e KMS_MIN_PORT=5000 \
    -e KMS_MAX_PORT=5050 \
    kurento/kurento-media-server:7.0.0
```

## spring vm options
```shell
-Dkms.url=ws://<KMS IP>:<PORT>/kurento
```

# coturn
## turn
- run 
```shell
## mac or windows
docker run -d -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp -e LISTENING_PORT=3478 -e REALM=kurento.org -e USER=user -e PASSWORD=s3cr3t --name kurento-coturn kurento/coturn-auth

## linux
docker run -ti --rm --net=host -e LISTENING_PORT=3478 -e REALM=kurento.org -e USER=user -e PASSWORD=s3cr3t --name kurento-coturn kurento/coturn-auth
```
- create user
```shell
docker exec -ti coturn turnadmin -a -b /var/local/turndb -u user -r kurento.org -p s3cr3t
```
- delete user
```shell
docker exec -ti coturn turnadmin -d -b /var/local/turndb -u user -r kurento.org
```