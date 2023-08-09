
let stompClient;
let callerPeerMap = new Map();
let localSteam;
let camKeyArr = [];



const getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            const localStreamElement = document.querySelector("#testVideo");
            stream.getAudioTracks()[0].enabled = false;
            localSteam = stream;
            localStreamElement.srcObject = localSteam;

        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });

}

const connectSocket = async () =>{
    const socket = new SockJS('/signaling');
    const key = Math.random().toString(36).substring(2, 11);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;


    stompClient.connect({}, function () {
        console.log('Connected to WebRTC server');
        // callerPeerMap.set(key,createMainPeer(localSteam,key));

        stompClient.subscribe(`/topic/simple-peer/iceCandidate/1`, function (candidate) {
            if(callerPeerMap.has(JSON.parse(candidate.body).key)){
                callerPeerMap.get(JSON.parse(candidate.body).key).signal(JSON.parse(candidate.body).peer);
            }
        });

        stompClient.subscribe(`/topic/simple-peer/getCamId/1`, (camId) =>{
            camKeyArr.push(camId.body);
        });
    });



}

const createMainPeer = (stream, key, camKey) => {
    const newPeer = new SimplePeer({
        initiator : true,
        stream : stream
    });

    newPeer.on('signal', callerSignal =>{
        stompClient.send(`/app/simple-peer/offer/${camKey}/1`, {},  JSON.stringify({'key' : key , 'peer' : JSON.stringify(callerSignal)}));
    });


    return newPeer;

}

connectSocket();
document.querySelector('#camStartBtn').addEventListener('click', async () =>{
    await getLocalStream();
});

document.querySelector('#streamStartBtn').addEventListener('click', async () =>{

    camKeyArr.map((camKey) =>{
        const key = Math.random().toString(36).substring(2, 11);
        callerPeerMap.set(key , createMainPeer(localSteam,key, camKey));
    })



});





