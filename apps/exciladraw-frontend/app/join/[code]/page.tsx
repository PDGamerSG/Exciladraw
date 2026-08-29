import type { Metadata } from "next";
import { JoinRoom } from "@/components/JoinRoom";

export const metadata: Metadata = { title: "Joining a board" };

export default async function JoinPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;
    return <JoinRoom code={code} />;
}
