import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId:string){
    const token = localStorage.getItem("token");
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, {
        headers: { Authorization: token }
    });
    const messages: { message: string }[] = res.data.messages ?? [];

    return messages.flatMap((x) => {
        try {
            const shape = JSON.parse(x.message)?.shape;
            return shape ? [shape] : [];
        } catch {
            // one unparseable row shouldn't blank the whole board
            return [];
        }
    });
}
