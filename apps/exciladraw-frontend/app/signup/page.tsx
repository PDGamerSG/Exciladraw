import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Create your account" };

export default function Signup() {
    return (
        <Suspense>
            <AuthPage isSignin={false} />
        </Suspense>
    );
}
