
let stompClient;
let callPeer = new Map();
let key;
let camKey;

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    camKey = Math.random().toString(36).substring(2, 11);

    stompClient = Stomp.over(socket);
    stompClient.debug = null;


    stompClient.connect({}, function () {

        console.log('Connected to WebRTC server');

        stompClient.subscribe(`/topic/simple-peer/answer/${camKey}/1`, function (answer) {
            key = JSON.parse(answer.body).key
            callPeer.set(key, createPeer(JSON.parse(answer.body).peer, key));
        });

        stompClient.send(`/app/simple-peer/getCamId/1`, {}, camKey);
    });

    stompClient.disconnect(() =>{
        console.log('test');
    });

    socket.onclose(() =>{
        console.log('aa');
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
        const video =  document.createElement('video');

        video.autoplay = true;
        video.controls = true;

        video.srcObject = stream;
        document.getElementById('videoDiv').appendChild(video);

        video.play();
    });

    newCallerPeer.signal(offer);
    
    return newCallerPeer;
}




if(callPeer.size === 0){
    connectSocket();
}


