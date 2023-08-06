const TURN_SERVER_URL = 'turn:172.30.1.23:9090';
const TURN_SERVER_USERNAME = 'musma';
const TURN_SERVER_CREDENTIAL = '0812';

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
            pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate.body)));
        });

        stompClient.subscribe(`/topic/peer/offer/1`, offer => {
            createPeerConnection();
            pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer.body)));
            sendAnswer();
        });

        stompClient.subscribe(`/topic/peer/answer/1`, answer =>{
            pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer.body)));
        });

    });
}

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log('ICE candidate');
        stompClient.send(`/app/peer/iceCandidate/1`,{}, JSON.stringify(event.candidate));
    }
};

const createPeerConnection = () =>{
    try {
        pc = new RTCPeerConnection();
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
};


let sendOffer = () => {
    console.log('Send offer');
    pc.createOffer().then(offer =>{
        stompClient.send('/app/peer/offer/1', {}, JSON.stringify(offer));
        return pc.setLocalDescription(offer);
    });
};

let sendAnswer = () => {
    console.log('Send answer');
    pc.createAnswer().then( answer => {
        stompClient.send('/app/peer/answer/1', {}, JSON.stringify(answer));
        return pc.setLocalDescription(answer)
    });
};
