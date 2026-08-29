import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Sign in" };

export default function Signin() {
    // AuthPage reads ?next= to return you to an invite link after signing in,
    // and useSearchParams has to sit inside a suspense boundary to prerender
    return (
        <Suspense>
            <AuthPage isSignin />
        </Suspense>
    );
}
