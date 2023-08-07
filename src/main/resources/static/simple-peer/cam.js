
let stompClient;
let callPeer = undefined;
let key;

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        console.log('Connected to WebRTC server');

        stompClient.subscribe(`/topic/simple-peer/answer/1`, function (answer) {
            if(callPeer === undefined) {
                key = JSON.parse(answer.body).key
                callPeer = createPeer(JSON.parse(answer.body).peer, key);
            }
        });
    });

}

const createPeer = (offer, key) => {
    const newCallerPeer = new SimplePeer({
        initiator : false,
        trickle : false
    });

    newCallerPeer.on('signal', (data) =>{
       stompClient.send(`/app/simple-peer/iceCandidate/1`, {} ,  JSON.stringify({'key' : key ,'peer' : JSON.stringify(data)}));
    });

    newCallerPeer.on('stream', function (stream) {
        const video =  document.querySelector('#streamVideo');
        video.srcObject = stream;

        video.play();
    });

    newCallerPeer.signal(offer);
    
    return newCallerPeer;
}




if(callPeer === undefined){
    console.log(callPeer);
    connectSocket();
}


