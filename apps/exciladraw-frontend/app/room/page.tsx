"use client";
  import { HTTP_BACKEND } from "@/config";
  import axios from "axios";
  import { useRouter } from "next/navigation";
  import { useEffect, useRef, useState } from "react";

  export default function room(){
      const router = useRouter();
      const roomRef = useRef<HTMLInputElement>(null);
      const [rooms, setRooms] = useState<any[]>([]);

      useEffect(() => {
          const token = localStorage.getItem("token");
          axios.get(`${HTTP_BACKEND}/room`,
            { headers: { Authorization: token } })
              .then(res => setRooms(res.data.rooms));
      }, []);

      return(
          <div>
              <div className="p-2">
                  <input ref={roomRef} type="text" placeholder="Room name"></input>
              </div>
              <button onClick={async()=>{
                  const token = localStorage.getItem("token");
                  const res = await axios.post(`${HTTP_BACKEND}/room`,
                      { name: roomRef.current?.value },
                      { headers: { Authorization: token } }
                  )
                  router.push(`/canvas/${res.data.roomId}`)
              }}>
                  Create room
              </button>

              {rooms.map(room => (
                  <div key={room.id}>Room ID: {room.id}
                    <button onClick={() => router.push(`/canvas/${room.id}`)}>
                        Open canvas
                    </button>
                  </div>
              ))}
          </div>
      )
  }
