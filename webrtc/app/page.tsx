"use client"
import * as StompJs from "@stomp/stompjs"
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function Home() {
    const router = useRouter()

    return (
        <>
            <div>MAIN</div>
            <button onClick={()=>{
                router.push("/video")
            }}>Connect</button>
        </>
    )
}
