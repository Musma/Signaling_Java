
let stompClient;
let callerPeer;

const getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            const localStreamElement = document.querySelector("#testVideo");
            console.log('Stream found');
            console.log(localStreamElement);
            // Disable the microphone by default
            stream.getAudioTracks()[0].enabled = false;
            localStreamElement.srcObject = stream;
            createPeer(stream);
            console.log(stream);

            // Connect after making sure that local stream is availble
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        console.log('Connected to WebRTC server');

        stompClient.subscribe(`/topic/simple-peer/iceCandidate/1`, function (candidate) {
            callerPeer.signal(JSON.parse(candidate.body));
            console.log(JSON.parse(candidate.body));
        });
    });


}

const createPeer = offer => {
    callerPeer = new SimplePeer({
        initiator : true,
        stream : offer
    });

    callerPeer.on('signal', callerSignal =>{
        stompClient.send(`/app/simple-peer/offer/1`, {},  JSON.stringify(callerSignal));
    });

    callerPeer.on('data', data =>{
        console.log(data);
    });

}


document.querySelector('#camStartBtn').addEventListener('click', async () =>{
    await getLocalStream();
    await connectSocket();

    return '';
});





