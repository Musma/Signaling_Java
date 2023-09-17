// let remoteStreamElement = document.querySelector('#remoteStream');
const server_url = 'http://172.30.0.24:9700'
let canvas = document.querySelector('#localCanvas');
let localStreamElement = document.querySelector('#localStream');
const myKey = Math.random().toString(36).substring(2, 11);
let pcListMap = new Map();
let roomId = 1;
let otherKeyList = [];
let localStream = undefined;
let stompClient;
let socket;


// startCam
// 웹캠을 연결하여 Stream 값을 localStream 변수에 넣는다.
const startCam = async () =>{
    // 웹소켓 + jsmpeg + canvas tag + video tag
    var client = new WebSocket('ws://localhost:9999');
    
    var player = new jsmpeg(client, {
        canvas: canvas
    });
    
    var stream = canvas.captureStream(30)
    localStream = stream
    localStreamElement.srcObject = localStream;
    canvas.setAttribute("width", window.innerWidth / 2);  
}

//웹소켓을 연결시킨다.
const connectSocket = async (camKey) =>{
    socket = new SockJS(`${server_url}/signaling`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    //웹소켓 접속시에 roomId , camKey를 headers 에 보낸다.
    stompClient.connect({
        'roomId' : roomId,
        'camKey' : myKey
    }, async function () {

        console.log('Connected to WebRTC server');

        // iceCandidate 를 구독 해준다.
        stompClient.subscribe(`/topic/peer/iceCandidate/${myKey}/${roomId}`, candidate => {
            const key = JSON.parse(candidate.body).key
            const message = JSON.parse(candidate.body).body;
            //해당 신호를 Peer에 추가해준다.
            pcListMap.get(key).addIceCandidate(new RTCIceCandidate({candidate:message.candidate,sdpMLineIndex:message.sdpMLineIndex,sdpMid:message.sdpMid}));

        });

        //offer 를 구독 해준다.
        stompClient.subscribe(`/topic/peer/offer/${myKey}/${roomId}`, offer => {
            const key = JSON.parse(offer.body).key;
            const message = JSON.parse(offer.body).body;

            //해당 키에 대한 새로운 peer를 생성하여 map 에 저장한다.
            pcListMap.set(key,createPeerConnection(key));
            //새로 만든 peer에 RTCSessionDescription를 추가해준다.
            pcListMap.get(key).setRemoteDescription(new RTCSessionDescription({type:message.type,sdp:message.sdp}));
            //받은 키에 대한 answer를 보낸다.
            sendAnswer(pcListMap.get(key), key);

        });

        //answer 를 구독 해준다.
        stompClient.subscribe(`/topic/peer/answer/${myKey}/${roomId}`, answer =>{
            const key = JSON.parse(answer.body).key;
            const message = JSON.parse(answer.body).body;

            //받은 키에 대한 peer에 description 해준다.
            pcListMap.get(key).setRemoteDescription(new RTCSessionDescription(message));


        });


        // 웹소켓이 연결돨떄 해당 camKey 에 대한 peer 를 생성하여 map 에 넣는다.
        pcListMap.set(camKey, createPeerConnection(camKey));
        //offer 신호를 보낸다.
        sendOffer(pcListMap.get(camKey),camKey);
    });
}


// peer에 stream 값이 들어오면 실행하는 event 함수
let onTrack = (event, otherKey) => {

    if(document.getElementById(`${otherKey}`) === null){
        const video =  document.createElement('video');

        video.autoplay = true;
        video.controls = true;
        video.id = otherKey;
        video.srcObject = event.streams[0];

        document.getElementById('remoteStreamDiv').appendChild(video);
    }

};




// peer 를 생성해주는 함수
const createPeerConnection = (otherKey) =>{
    const pc = new RTCPeerConnection();
    try {
        pc.addEventListener('icecandidate', (event) =>{
            onIceCandidate(event, otherKey);
        });
        pc.addEventListener('track', (event) =>{
            onTrack(event, otherKey);
        });
        if(localStream !== undefined){
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }


        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
    return pc;
}

//iceCandidate event 처리 함수
let onIceCandidate = (event, otherKey) => {
    if (event.candidate) {
        console.log('ICE candidate');
        stompClient.send(`/app/peer/iceCandidate/${otherKey}/${roomId}`,{}, JSON.stringify({
            key : myKey,
            body : event.candidate
        }));
    }
};

//offer 신호를 보내는 함수
let sendOffer = (pc ,otherKey) => {
    pc.createOffer().then(offer =>{
        setLocalAndSendMessage(pc, offer);
        stompClient.send(`/app/peer/offer/${otherKey}/${roomId}`, {}, JSON.stringify({
            key : myKey,
            body : offer
        }));
        console.log('Send offer');
    });
};

//anser 신호를 보내는 함수
let sendAnswer = (pc,otherKey) => {
    pc.createAnswer().then( answer => {
        setLocalAndSendMessage(pc ,answer);
        stompClient.send(`/app/peer/answer/${otherKey}/${roomId}`, {}, JSON.stringify({
            key : myKey,
            body : answer
        }));
        console.log('Send answer');
    });
};

//localDescription 해주는 함수
const setLocalAndSendMessage = (pc ,sessionDescription) =>{
    pc.setLocalDescription(sessionDescription);
}



// /poll/enter/room/{roomId} long polling api 호출 후, 받은 camKey , roomId를 이용 하여 해당 앱에게 cctv WebRTC 정보를 보냄
const startPoll = async () =>{
    await startCam();

    if(localStream !== undefined){
        document.querySelector('#localStream').style.display = 'block';
    }

    while(true){
        try{
            const body = await axios.get(`${server_url}/poll/enter/room/${roomId}`);

            const {camKey} = body.data.data;

            if(stompClient === undefined || !stompClient.connected){
                await connectSocket(camKey);
            }
            else{
                if(!pcListMap.has(camKey)){
                    pcListMap.set(camKey, createPeerConnection(camKey));
                    sendOffer(pcListMap.get(camKey),camKey);
                }

            }


        }catch (e){
            console.error(e);
            break;
        }

    }


}


// /poll/leave/room/{roomId} long polling api 를 호출 후 , 해당 room 의 퇴장를 체크하여,
// 받은 camKey로 pcListMap에 Peer를 제거하고,
// 인원수 roomCount 를 받아 만약 인원수가 1명이하라면 웹소켓에서 나간다.
const getRoomCountCheck = async () =>{
    try{
        while (true){
            const resp = await axios.get(`${server_url}/poll/leave/room/${roomId}`);

            const {roomCount, camKey} = resp.data.data;

            pcListMap.get(camKey).close();
            pcListMap.delete(camKey);


            if(Number(roomCount) <= 1){
                if(stompClient !== undefined){
                    socket.close();
                }
            }

        }
    }catch (e){
        console.error(e);
    }
}


startPoll();
getRoomCountCheck();