"use client"
import React, {useEffect, useRef} from 'react';
import {undefined} from "zod";

const Page = () => {
    const socket = useRef<WebSocket>();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection>();
    const viewer = async () => {
        pcRef.current = new RTCPeerConnection({
            iceServers: [
                {
                    username: 'user',
                    credential: 's3cr3t',
                    urls: 'turn:172.30.1.12:3478?transport=tcp'
                },
            ],
        });
        // offer 생성 및 전송
        try {
            // offer 생성
            await pcRef.current!
                .createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                })
                .then((sdp) => {
                    // 자신의 sdp로 LocalDescription 설정
                    return pcRef.current!.setLocalDescription(new RTCSessionDescription(sdp));
                })
                .then(() => {
                    // offer 전달
                    sendMessage({
                        id: "viewer",
                        sdpOffer: pcRef.current!.localDescription!.sdp,
                    });
                    console.log("sent the offer");
                });
            // 남의 stream 데이터 track 등록
            pcRef.current!.ontrack = (e) => {
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = e.streams[0];
                }
            };
        } catch (e) {
            console.error(e);
        }

    }
    const viewerResponse = (message:any)=>{
        console.log("viewerResponse")
        if (message.response != 'accepted') {
            var errorMsg = message.message ? message.message : 'Unknow error';
            console.info('Call not accepted for the following reason: ' + errorMsg);
        } else {
            pcRef.current!.setRemoteDescription({type:"answer", sdp:message.sdpAnswer}).then(()=>{
                // ice 생성 및 전송
                pcRef.current!.onicecandidate = (e) => {
                    console.log("ice", e.candidate);
                    if (e.candidate) {
                        if (!socket.current) {
                            return;
                        }
                        console.log("recv candidate");
                        sendMessage({
                            id: "onIceCandidate",
                            candidate: e.candidate,
                        });
                    }
                };
            });
        }
    }
    const present = async () => {
        pcRef.current = new RTCPeerConnection({
            iceServers: [
                {
                    username: 'user',
                    credential: 's3cr3t',
                    urls: 'turn:172.30.1.12:3478?transport=tcp'
                },
            ],
        });
        try {
            // 자신의 스트림 정보
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
            // 스트림을 peerConnection 등록
            stream.getTracks().forEach((track) => {
                if (!pcRef.current) {
                    return;
                }
                pcRef.current?.addTrack(track, stream);
            });

            // offer 생성 및 전송
            try {
                // offer 생성
                if(pcRef.current) {
                    await pcRef.current
                        .createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true,
                        })
                        .then((sdp) => {
                            // 자신의 sdp로 LocalDescription 설정
                            return pcRef.current!.setLocalDescription(new RTCSessionDescription(sdp));
                        })
                        .then(() => {
                            // offer 전달
                            sendMessage({
                                id: "presenter",
                                sdpOffer: pcRef.current!.localDescription!.sdp,
                            });
                            console.log("sent the offer");
                        });
                }
            } catch (e) {
                console.error(e);
            }


            // 남의 stream 데이터 track 등록
            // pcRef.current!.ontrack = (e) => {
            //     if (remoteVideoRef.current) {
            //         remoteVideoRef.current.srcObject = e.streams[0];
            //     }
            // };
        } catch (e) {
            console.log(e);
        }
    };

    const presenterResponse = (message: any) => {
        // answer 등록
        if (message.response != 'accepted') {
            var errorMsg = message.message ? message.message : 'Unknow error';
            console.info('Call not accepted for the following reason: ' + errorMsg);
        } else {
            console.log("presenterResponse", message)
            pcRef.current!.setRemoteDescription({type: "answer", sdp:message.sdpAnswer}).then(()=>{
                // ice 생성 및 전송
                if(pcRef.current) {
                    pcRef.current.onicecandidate = (e) => {
                        console.log("ice", e.candidate);
                        if (e.candidate) {
                            if (!socket.current) {
                                return;
                            }
                            console.log("recv candidate");
                            sendMessage({
                                id: "onIceCandidate",
                                candidate: e.candidate,
                            });
                        }
                    };
                }
            })

        }
    }
    const sendMessage = (message: Object) => {
        let jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + jsonMessage);
        socket.current!.send(jsonMessage);
    }


    useEffect(() => {

        socket.current = new WebSocket("ws://172.30.1.12:8080/kurento");
        socket.current.onopen = () => {
            console.log("Connected to the signaling server");
        };
        socket.current.onmessage = (message) => {
            var parsedMessage = JSON.parse(message.data);
            console.log("Get Message: " + parsedMessage)
            switch (parsedMessage.id) {
                case 'presenterResponse':
                    presenterResponse(parsedMessage);
                    break;
                case 'viewerResponse':
                    viewerResponse(parsedMessage);
                    break;
                case 'iceCandidate':
                    console.log("ICE 등록")
                    let candidate = new RTCIceCandidate(parsedMessage.candidate);
                    pcRef.current!.addIceCandidate(candidate);
                    break;
                case 'stopCommunication':
                    console.error('stopCommunication message', parsedMessage);
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }

        }
    }, [])
    return (
        <div>
            <div>Kurento</div>
            <div>
                <div>내비디오</div>
                <video
                    id="remotevideo"
                    style={{
                        width: 240,
                        height: 240,
                        backgroundColor: "black",
                    }}
                    ref={myVideoRef}
                    autoPlay
                    controls
                />
                <button onClick={present}>Present</button>
                <button onClick={viewer}>Viewer</button>
            </div>
        </div>
    );
};

export default Page;