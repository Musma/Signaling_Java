const TURN_SERVER_URL = 'turn:172.30.1.23:9090';
const TURN_SERVER_USERNAME = 'musma';
const TURN_SERVER_CREDENTIAL = '0812';
const myKey = Math.random().toString(36).substring(2, 11);

let pc;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');

const configuration = {
    iceServers: [
        {
            urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
            username: TURN_SERVER_USERNAME,
            credential: TURN_SERVER_CREDENTIAL
        }
    ]
}


navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then((stream) => {
        console.log('Stream found');
        localStream = stream;
        // Disable the microphone by default
        stream.getAudioTracks()[0].enabled = false;
        localStreamElement.srcObject = localStream;
        // Connect after making sure that local stream is availble
        connectSocket();
}).catch(error => {
    console.error("Error accessing media devices:", error);
})

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        createPeerConnection();
        sendOffer();

        console.log('Connected to WebRTC server');
        
        stompClient.subscribe(`/topic/peer/iceCandidate/1`, candidate => {
            const key = JSON.parse(candidate.body).key
            const message = JSON.parse(JSON.parse(candidate.body).body);

            if(myKey !== key){
                pc.addIceCandidate(new RTCIceCandidate({
                    sdpMLineIndex : message.sdpMLineIndex,
                    candidate : message.candidate
                }));
            }

        });

        stompClient.subscribe(`/topic/peer/offer/1`, offer => {
            const key = JSON.parse(offer.body).key;
            const message = JSON.parse(JSON.parse(offer.body).body);

            if(myKey !== key){
                createPeerConnection();
                pc.setRemoteDescription(new RTCSessionDescription(message));
                sendAnswer();
            }

        });

        stompClient.subscribe(`/topic/peer/answer/1`, answer =>{
            const key = JSON.parse(answer.body).key;
            const message = JSON.parse(JSON.parse(answer.body).body);

            if(myKey !== key){
                pc.setRemoteDescription(new RTCSessionDescription(message));
            }

        });

    });
}

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log('ICE candidate');
        stompClient.send(`/app/peer/iceCandidate/1`,{}, JSON.stringify({
            key : myKey,
            body : JSON.stringify(event.candidate)
        }));
    }
};

const createPeerConnection = () =>{
    try {
        pc = new RTCPeerConnection({
            'iceServers' : [{
                'urls' : 'stun:stun.1.google.com:19302'
            }]
        });
        pc.onicecandidate = onIceCandidate;
        pc.ontrack = onTrack;
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
}


let onTrack = (event) => {
    remoteStreamElement.srcObject = event.streams[0];
    remoteStreamElement.play();
};


let sendOffer = () => {
    pc.createOffer().then(offer =>{
        setLocalAndSendMessage(offer);
        stompClient.send('/app/peer/offer/1', {}, JSON.stringify({
            key : myKey,
            body : JSON.stringify(offer)
        }));
        console.log('Send offer');
    });
};

let sendAnswer = () => {
    pc.createAnswer().then( answer => {
        setLocalAndSendMessage(answer);
        stompClient.send('/app/peer/answer/1', {}, JSON.stringify({
            key : myKey,
            body : JSON.stringify(answer)
        }));
        console.log('Send answer');
    });
};


const setLocalAndSendMessage = (sessionDescription) =>{
    pc.setLocalDescription(sessionDescription);
}