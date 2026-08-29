import type { Metadata } from "next";
import { RoomList } from "@/components/RoomList";

export const metadata: Metadata = { title: "Your boards" };

export default function RoomPage() {
    return <RoomList />;
}
