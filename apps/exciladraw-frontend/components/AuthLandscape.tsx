import Image from "next/image";

/** Full-bleed photography with a small drawing gesture that belongs to the app. */
export function AuthLandscape() {
    return (
        <div className="auth-scenery pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <Image src="/images/open-country.webp" alt="" fill sizes="100vw" preload
                className="auth-scenery-photo object-cover object-[42%_center]" />
            <div className="auth-scenery-shade absolute inset-0" />
        </div>
    );
}
