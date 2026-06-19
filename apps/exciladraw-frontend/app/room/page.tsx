"use client";
import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef } from "react";


export default function room(){
    const router = useRouter();
    const roomRef = useRef<HTMLInputElement>(null);
    return(
        <div>
            <div className="p-2">
                    <input ref={roomRef} type="text" placeholder="Room name"></input>
            </div>
            <button onClick={async()=>{
                const token = localStorage.getItem("token");
                const res = await axios.post(`${HTTP_BACKEND}/room`,
                    {name:roomRef.current?.value},
                    {headers:{Authorization:token}
                })
                router.push(`/canvas/${res.data.roomId}`)
            }}>
                Create room
            </button>
        </div>
    )
}
