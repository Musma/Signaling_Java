let roomId;
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

        stompClient.subscribe(`/topic/simple-peer/iceCandidate/${roomId}`, function (candidate) {
            if(callerPeerMap.has(JSON.parse(candidate.body).key)){
                callerPeerMap.get(JSON.parse(candidate.body).key).signal(JSON.parse(candidate.body).peer);
            }
        });

        stompClient.subscribe(`/topic/simple-peer/cam/getCamId/${roomId}`, (camId) =>{
            const returnCamKey = camId.body;
            if(camKeyArr.find(camKey => camKey === returnCamKey) === undefined){
                camKeyArr.push(returnCamKey);
            }

        });

        stompClient.send(`/app/simple-peer/stream/getCamId/1`, {}, {});
    });



}

const createMainPeer = (stream, key, camKey) => {
    const newPeer = new SimplePeer({
        initiator : true,
        stream : stream
    });

    newPeer.on('signal', callerSignal =>{
        stompClient.send(`/app/simple-peer/offer/${camKey}/${roomId}`, {},  JSON.stringify({'key' : key , 'peer' : JSON.stringify(callerSignal)}));
    });


    return newPeer;

}


document.querySelector('#camStartBtn').addEventListener('click', async () =>{
    await getLocalStream();
});

document.querySelector('#streamStartBtn').addEventListener('click', async () =>{
    camKeyArr.map((camKey) =>{
        const key = Math.random().toString(36).substring(2, 11);
        callerPeerMap.set(key , createMainPeer(localSteam,key, camKey));
    });
});

document.querySelector('#roomBtn').addEventListener('click', async () =>{
    roomId = document.querySelector('#roomNum').value;

    document.querySelector('#roomVideoDvi').style.display = 'block';
    document.querySelector('#roomBtn').disabled = true;
    document.querySelector('#roomNum').disabled = true;

    await connectSocket();
});





