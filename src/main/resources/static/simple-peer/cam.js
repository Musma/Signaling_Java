let roomId;
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

        stompClient.subscribe(`/topic/simple-peer/answer/${camKey}/${roomId}`, function (answer) {
            key = JSON.parse(answer.body).key
            callPeer.set(key, createPeer(JSON.parse(answer.body).peer, key));
        });

        stompClient.subscribe(`/topic/simple-peer/stream/getCamId/${roomId}`, (body) =>{
            stompClient.send(`/app/simple-peer/cam/getCamId/${roomId}`, {}, camKey);
        })

        stompClient.send(`/app/simple-peer/cam/getCamId/${roomId}`, {}, camKey);
    });


}

const createPeer = (offer, key) => {
    const newCallerPeer = new SimplePeer({
        initiator : false,
        trickle : false
    });

    newCallerPeer.on('signal', (data) =>{
       stompClient.send(`/app/simple-peer/iceCandidate/${roomId}`, {} ,  JSON.stringify({'key' : key ,'peer' : JSON.stringify(data)}));
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






document.querySelector('#roomBtn').addEventListener('click', async () =>{
    roomId = document.querySelector('#roomNum').value;

    document.querySelector('#videoDiv').style.display = 'block';
    document.querySelector('#roomBtn').disabled = true;
    document.querySelector('#roomNum').disabled = true;

    await connectSocket();
});


