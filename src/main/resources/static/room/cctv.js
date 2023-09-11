// let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');
const myKey = Math.random().toString(36).substring(2, 11);
let pcListMap = new Map();
let roomId = 1;
let otherKeyList = [];
let localStream = undefined;
let stompClient;
let socket;



const startCam = async () =>{
    if(navigator.mediaDevices !== undefined){
        await navigator.mediaDevices.getUserMedia({ audio: true, video : true })
            .then(async (stream) => {
                console.log('Stream found');
                localStream = stream;
                // Disable the microphone by default
                stream.getAudioTracks()[0].enabled = true;
                localStreamElement.srcObject = localStream;
                // Connect after making sure that local stream is availble

            }).catch(error => {
                console.error("Error accessing media devices:", error);
            });
    }


}


const connectSocket = async (camKey) =>{
    socket = new SockJS('/signaling');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    //웹소켓 접속시에 roomId , camKey를 headers 에 보낸다.
    stompClient.connect({
        'roomId' : roomId,
        'camKey' : myKey
    }, async function () {

        console.log('Connected to WebRTC server');


        stompClient.subscribe(`/topic/peer/iceCandidate/${myKey}/${roomId}`, candidate => {
            const key = JSON.parse(candidate.body).key
            const message = JSON.parse(candidate.body).body;
            pcListMap.get(key).addIceCandidate(new RTCIceCandidate({candidate:message.candidate,sdpMLineIndex:message.sdpMLineIndex,sdpMid:message.sdpMid}));

        });

        stompClient.subscribe(`/topic/peer/offer/${myKey}/${roomId}`, offer => {
            const key = JSON.parse(offer.body).key;
            const message = JSON.parse(offer.body).body;

            pcListMap.set(key,createPeerConnection(key));
            pcListMap.get(key).setRemoteDescription(new RTCSessionDescription({type:message.type,sdp:message.sdp}));
            sendAnswer(pcListMap.get(key), key);

        });

        stompClient.subscribe(`/topic/peer/answer/${myKey}/${roomId}`, answer =>{
            const key = JSON.parse(answer.body).key;
            const message = JSON.parse(answer.body).body;

            pcListMap.get(key).setRemoteDescription(new RTCSessionDescription(message));


        });


        pcListMap.set(camKey, createPeerConnection(camKey));
        sendOffer(pcListMap.get(camKey),camKey);
    });
}


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

let onIceCandidate = (event, otherKey) => {
    if (event.candidate) {
        console.log('ICE candidate');
        stompClient.send(`/app/peer/iceCandidate/${otherKey}/${roomId}`,{}, JSON.stringify({
            key : myKey,
            body : event.candidate
        }));
    }
};

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
            const body = await axios.get(`/poll/enter/room/${roomId}`);

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
            const resp = await axios.get(`/poll/leave/room/${roomId}`);

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