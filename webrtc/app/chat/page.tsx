"use client";
import React, {useEffect, useRef, useState} from 'react';
import uuid from "react-uuid";
import {CompatClient} from "@stomp/stompjs";
import {Stomp} from "@stomp/stompjs";
import SockJS from "sockjs-client";

const Page = () => {
    const user = uuid().substring(0, 8);
    const roomId = "roomA";
    const [message, setMessage]=useState("");
    const client = useRef<CompatClient>();
    const [chat, setChat]=useState<{ id:string, message:string}[]>([]);

    const handleSendMessage = () => {
        client.current?.publish({
            destination: `/pub/chat/${roomId}`,
            body: JSON.stringify({
                type: "TALK",
                roomId: roomId,
                sender: user,
                message: message
            })
        })
    }

    const handleExit = () => {
        client.current?.publish({
            destination: `/pub/chat/${roomId}`,
            body: JSON.stringify({
                type: "LEAVE",
                roomId: roomId,
                sender: user,
            })
        })
    }

    useEffect(() => {
        // 서버와 소켓 연결
        client.current = Stomp.over(() => {
            const sock = new SockJS("http://172.30.1.12:8080/signal");
            return sock;
        });

        client.current.connect({}, () => {
            client.current!.publish({
                destination: `/pub/chat/${roomId}`,
                body: JSON.stringify({
                    type: "ENTER",
                    roomId: roomId,
                    sender: user,
                }),
            });
            client.current!.subscribe(`/sub/chat/${roomId}`, ({body}) => {
                const content = JSON.parse(body);
                console.log("content", content);
                console.log("TYPE: " + content.type);
                switch (content.type) {
                    case "ENTER":
                        if(content.sender === user) break;
                        console.log("방 접속: " + content.sender);
                        setChat(prevState =>
                            [...prevState, {id:content.sender, message:"협곡에 오신것을 환영합니다."}]
                        )
                        break;
                    case "TALK":
                        console.log("메시지 받음: " + content.sender +"  : "+content.message);
                        setChat(prevState =>
                            [...prevState, {id:content.sender, message:content.message}]
                        )
                        break;
                    case "LEAVE":
                        setChat(prevState =>
                            [...prevState, {id:content.sender, message:"탈주하셨습니다."}]
                        )
                        break;
                }
            });
        });
    }, []);
    console.log("--------------------------------");
    console.log(chat);
    console.log("--------------------------------");
    return (
        <div>
            <div>Chat</div>
            <input value={message} onChange={(e)=>setMessage(e.target.value)}/>
            <button onClick={handleSendMessage}>submit</button>
            <button onClick={handleExit}>EXIT</button>
            {chat.map((message,i)=>{

                return <div key={i}>{`${message.id}:${message.message}`}</div>
            })}
        </div>
    );
};

export default Page;