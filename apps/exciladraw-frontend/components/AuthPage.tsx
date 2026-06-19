"use client";
import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export function AuthPage({isSignin}:{
    isSignin: boolean
} ){
    const router = useRouter();
    const usernameRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)
    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-6 m-2 bg-white rounded">
            <div className="p-2">
                <input ref={usernameRef} type="text" placeholder="Email"></input>
            </div>
            <div className="p-2">
                <input ref={passwordRef} placeholder="Password" type="password"></input>
            </div>
            {!isSignin && (
                <div className="p-2">
                    <input ref={nameRef} type="text" placeholder="Name"></input>
                </div>
            )}
            <div className="pt-2">
                <button onClick={async () =>{
                    if(isSignin){
                        const res = await axios.post(`${HTTP_BACKEND}/signin`,{
                            username:usernameRef.current?.value,
                            password:passwordRef.current?.value
                        })
                        localStorage.setItem("token", res.data.token)
                        router.push("/room")
                    }
                    else{
                        await axios.post(`${HTTP_BACKEND}/signup`,{
                            username:usernameRef.current?.value,
                            password:passwordRef.current?.value,
                            name:nameRef.current?.value
                        })
                        router.push("/signin")
                    }
                }}>{isSignin ? "Sign in" : "Sign up"}</button>
            </div>
        </div>
    </div>
}
