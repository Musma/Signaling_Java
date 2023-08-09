"use client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import uuid from "react-uuid";
import SockJS from "sockjs-client";
import Video from "./video";

let pcs: any;
let hasPcs: any;
let localStream: MediaStream;
let getUserMediaState: string = "pending";
let stop: boolean = false;

const Page = () => {
  const MEDIA_STATE = {
    FULFILLED: "fulfilled",
    PENDING: "pending",
    REJECTED: "rejected",
  };
  const user = uuid().substring(0, 8);
  const roomId = "roomA";
  const client = useRef<CompatClient>();
  const myVideoRef = useRef<HTMLVideoElement>(null);

  /**
   * 현재 방에 존재하는 user의 정보를 담은 state입니다.
   * user가 추가되거나 삭제될 때 마다 리렌더링을 해야하므로 useState를 사용했습니다.
   */
  const [users, setUsers] = useState<Array<any>>([]);

  const handleMuteMyVideo = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const stream: any | MediaStream = myVideoRef.current.srcObject;
    stream.getAudioTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
  };

  const handleCamera = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const stream: any | MediaStream = myVideoRef.current.srcObject;
    stream.getVideoTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
  };

  /**
   *
   * @param {string} userId PeerConnection을 만들 상대방의 socketID 입니다.
   * @param {WebSocket} socket local Websocket 입니다.
   * @param {MediaStream} peerConnectionLocalStream local MediaStream 객체입니다.
   * @returns {RTCPeerConnection} 생성된 RTCPeerConnection 객체입니다.
   */
  const createPeerConnection = (
    userId: string,
    socket: any,
    peerConnectionLocalStream: MediaStream
  ): RTCPeerConnection => {
    console.log("createPeerConnection: " + userId);
    // create peer
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    /**
     * icecandidate 이벤트가 발생했을 때의 이벤트 핸들러입니다.
     * @param {event} e icecandidate 이벤트가 발생했을 때의 이벤트 객체입니다.
     */
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.publish({
          destination: `/pub/room/${roomId}`,
          body: JSON.stringify({
            type: "CANDIDATE",
            roomId: roomId,
            from: user,
            candidate: e.candidate,
          }),
        });
      }
    };

    /**
     * iceconnectionstatechange 이벤트가 발생했을 때의 이벤트 핸들러입니다.
     * @param {event} e connection state가 변경됐을 때의 이벤트 객체입니다.
     */
    pc.oniceconnectionstatechange = (e) => {};

    /**
     * track이 등록됨을 알려주는 이벤트 track의 이벤트 핸들러입니다.
     * @param e track이 등록됨을 알려주는 이벤트 track이벤트 객체 입니다.
     */
    pc.ontrack = (e) => {
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== userId));
      setUsers((oldUsers) => [
        ...oldUsers,
        {
          id: userId,
          stream: e.streams[0],
          pc,
        },
      ]);
    };

    // 로컬의 미디어 스트림이 존재하면 PeerConnection에 추가해줍니다.
    if (peerConnectionLocalStream) {
      peerConnectionLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, peerConnectionLocalStream);
      });
    }

    pcs = { ...pcs, [userId]: pc };
    hasPcs[userId] = true;
    return pc;
  };
  function sleep(ms: any) {
    return new Promise((resolve) =>
      // eslint-disable-next-line
      setTimeout(resolve, ms)
    );
  }
  useEffect(() => {
    console.log("MY userID: " + user);
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        localStream = stream;
        getUserMediaState = MEDIA_STATE.FULFILLED;
      })
      .catch((error) => {
        getUserMediaState = MEDIA_STATE.REJECTED;
        console.log("getUserMedia error");
      });
  }, []);

  useEffect(() => {
    pcs = {};
    hasPcs = {};
    getUserMediaState = MEDIA_STATE.PENDING;
    // 시그널링 서버와 소켓 연결
    client.current = Stomp.over(() => {
      const sock = new SockJS("http://localhost:8080/signal");
      return sock;
    });

    // 소켓 연결시 실행
    client.current.connect({}, () => {
      client.current!.publish({
        destination: `/pub/room/${roomId}`,
        body: JSON.stringify({
          type: "JOIN",
          roomId: roomId,
          from: user,
        }),
      });
      client.current!.subscribe(`/sub/room/${roomId}`, async ({ body }) => {
        const content = JSON.parse(body);
        console.log("content", content);
        console.log("TYPE: " + content.type);
        switch (content.type) {
          case "ALL_USERS":
            const len = content.allUsers.length;
            const allUsers = content.allUsers;
            if (user !== content.from) {
              break;
            }
            if (len > 0) {
              console.log("방 참가: " + roomId);
              for (let i = 0; i < len; i++) {
                while (getUserMediaState === MEDIA_STATE.PENDING) {
                  if (stop) return;
                  await sleep(300);
                }
                console.log(i + "번째: " + allUsers[i]);
                hasPcs = { ...hasPcs, [allUsers[i]]: false };
                console.log("hasPcs", hasPcs);
                // i번째 유저와 나의 peer connection 생성
                createPeerConnection(allUsers[i], client.current, localStream);

                while (!hasPcs[allUsers[i]]) {
                  if (stop) return;
                  await sleep(100);
                }

                // allUsers에서 사용하는 peer connection, i번째 유저의 peer connection입니다.
                const allUsersPc: RTCPeerConnection = pcs[allUsers[i]];
                // allUserPc가 존재하면
                if (allUsersPc) {
                  console.log("allUserPc 존재");
                  // offer를 생성하고
                  allUsersPc
                    .createOffer({
                      offerToReceiveAudio: true,
                      offerToReceiveVideo: true,
                    })
                    .then((sdp) => {
                      // 상대방과의 peer connection에 내 sdp를 이용해 local description을 생성
                      allUsersPc.setLocalDescription(
                        new RTCSessionDescription(sdp)
                      );
                      // signaling server에 i번째 유저에게 offer를 요청합니다.
                      console.log("OFFER 전송");
                      client.current!.publish({
                        destination: `/pub/room/${roomId}`,
                        body: JSON.stringify({
                          type: "OFFER",
                          roomId: roomId,
                          from: user,
                          sdp: sdp,
                        }),
                      });
                    })
                    .catch((error) => {});
                }
              }
            }
            break;
          case "OFFER":
            if (user == content.from) {
              break;
            }
            console.log("GET OFFER: ", content.sdp);
            while (getUserMediaState === MEDIA_STATE.PENDING) {
              if (stop) return;
              await sleep(300);
            }
            // remote description 등록
            // answer 전송
            console.log("GET OFFER fromo: " + content.from);
            hasPcs = { ...hasPcs, [content.from]: false };
            console.log("GET OFFER hasPcs: " + hasPcs);
            // offer를 요청한 상대방과의 peer connection을 생성합니다.
            createPeerConnection(content.from, client.current, localStream);
            while (!hasPcs[content.from]) {
              if (stop) return;
              await sleep(100);
            }
            // offer에서 사용하는 peer connection, offer를 요청한 상대방과의 peer connection 입니다.
            const offerPc: RTCPeerConnection = pcs[content.from];
            if (offerPc) {
              // offer를 보낸 상대방의 sdp를 이용해 상대방의 remote discription을 생성합니다.
              offerPc
                .setRemoteDescription(new RTCSessionDescription(content.sdp))
                .then(() => {
                  offerPc // answer를 생성하고
                    .createAnswer({
                      offerToReceiveVideo: true,
                      offerToReceiveAudio: true,
                    })
                    .then((sdp) => {
                      // 나의 sdp를 이용해
                      // 내 local description을 설정하고
                      offerPc.setLocalDescription(
                        new RTCSessionDescription(sdp)
                      );
                      // offer를 보낸 상대방에게 answer를 보냅니다.
                      console.log("ANSWER 전송");
                      client.current!.publish({
                        destination: `/pub/room/${roomId}`,
                        body: JSON.stringify({
                          type: "ANSWER",
                          roomId: roomId,
                          from: user,
                          sdp: sdp,
                        }),
                      });
                    })
                    .catch((error) => {});
                });
            }

            break;
          case "ANSWER":
            if (user == content.from) {
              break;
            }
            console.log("GET ANSWER: ", content.sdp);
            // answer에서 사용하는 peer connection, answer를 보낸 상대방과의 peer connection 입니다.
            const answerPc: RTCPeerConnection = pcs[content.from];
            // answerPc가 존재하면
            if (answerPc) {
              // answerPc의 remote description을 상대방의 sdp를 이용해 설정합니다.
              console.log("ANSWER 등록");
              answerPc.setRemoteDescription(
                new RTCSessionDescription(content.sdp)
              );
            }
            break;
          case "CANDIDATE":
            console.log("GET ICE CANDIDATE: ", content.candidate);
            while (!hasPcs[content.from]) {
              if (stop) return;
              await sleep(100);
            }
            // candidate에서 사용하는 peer connection, candidate 요청을 보낸 상대방과의 peer connection 입니다.
            const candidatePc: RTCPeerConnection = pcs[content.from];
            // candidatePc가 존재하면
            if (candidatePc) {
              // cadidate 요청을 보낸 상대방의 candidate 정보로 candidate를 추가합니다.
              candidatePc
                .addIceCandidate(new RTCIceCandidate(content.candidate))
                .then(() => {});
            }

            break;
        }
      });
    });
    return () => {
      getUserMediaState = MEDIA_STATE.PENDING;
      if (!stop) stop = true;
      if (localStream) {
        const localMediaTrack = localStream.getTracks();
        // 컴포넌트가 unmount되면 local media track을 사용중지합니다.
        if (localMediaTrack) {
          for (let i = 0; i < localMediaTrack.length; i += 1)
            localMediaTrack[i].stop();
        }
      }
      // 컴포넌트가 unmount되면 webRTC의 연결을 종료합니다.
      if (pcs) {
        for (let i = 0; i < pcs.length; i += 1) {
          pcs[i].close();
        }
      }
      // 컴포넌트가 unmount되면 socket연결을 종료합니다.
      if (client.current) {
        client.current.disconnect();
      }
    };
  }, []);
  return (
    <>
      <div>Video6</div>
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
      <button onClick={handleMuteMyVideo}>Mute</button>
      <button onClick={handleCamera}>Camera</button>
      {users.map((user) => {
        return <Video key={user.id} stream={user.stream} socketID={user.id} />;
      })}
    </>
  );
};
export default Page;
