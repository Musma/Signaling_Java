
let stompClient;
let callerPeer;

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        console.log('Connected to WebRTC server');

        stompClient.subscribe(`/topic/simple-peer/answer/1`, function (answer) {
            createPeer(JSON.parse(answer.body));
            console.log(JSON.parse(answer.body));
        });
    });

}

const createPeer = offer => {
    callerPeer = new SimplePeer({
        initiator : false,
        trickle : false
    });

    callerPeer.on('signal', (data) =>{
       stompClient.send(`/app/simple-peer/iceCandidate/1`, {} ,  JSON.stringify(data));
    });

    callerPeer.on('stream', function (stream) {
        const video =  document.querySelector('#streamVideo');
        video.srcObject = stream;

        video.play();
    });

    callerPeer.signal(offer);
}



connectSocket();

