/** A small landscape made from the same lines and shapes as a drawing board. */
export function AuthLandscape() {
    return (
        <aside className="auth-landscape relative h-44 overflow-hidden rounded-2xl sm:h-56 lg:h-full lg:min-h-[660px]" aria-label="An illustrated river valley">
            <div className="relative z-10 hidden px-10 pt-11 lg:block">
                <p className="max-w-sm font-[Georgia,serif] text-[2.75rem] leading-[1.08] tracking-tight">
                    A little space.<br />A fresh perspective.
                </p>
                <p className="mt-4 max-w-[260px] text-sm leading-relaxed">For the ideas taking shape, and the ones still finding their way.</p>
            </div>
            <svg viewBox="0 0 640 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-x-0 bottom-0 h-full w-full lg:h-[70%]" aria-hidden="true">
                <circle cx="453" cy="114" r="56" fill="var(--scene-sun)" />
                <g fill="none" stroke="var(--scene-line)" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                    <path d="M91 100q15-12 28 0q12-13 25-3 M162 69q11-8 19 0q10-9 20-2" />
                    <path d="M327 47h38m9 0h11 M478 192h57m9 0h22" />
                </g>
                <path d="M-25 302 112 146 208 255 298 129 458 317 565 214 669 308V535H-25Z" fill="var(--scene-mountain)" />
                <path d="m72 193 40-47 49 56-31-12-14 15-17-21Z m179-3 47-61 58 70-35-17-20 19-19-24Z" fill="var(--scene-snow)" />
                <path d="M-30 305Q64 234 173 307T365 322Q498 236 670 296V530H-30Z" fill="var(--scene-far)" />
                <path d="M-30 350Q88 305 218 363T397 365Q525 296 670 348V530H-30Z" fill="var(--scene-meadow)" />
                <path d="M337 327c-95 29-156 40-126 70 26 24 176 10 189 40 12 25-147 41-172 83h182c85-41 112-68 46-94-54-21-175-24-178-43-2-17 29-35 59-56Z" fill="var(--scene-water)" />
                <g fill="none" stroke="var(--scene-ripple)" strokeWidth="2" strokeLinecap="round">
                    <path d="M263 366h30 M228 383h29m9 0h12 M318 413h40 M375 443h43m9 0h18 M304 493h45" />
                </g>
                <path d="M-20 414q69-26 172 25t104 81H-20Z M464 520q10-89 94-112t102 0v112Z" fill="var(--scene-near)" />
                <g fill="var(--scene-tree)" stroke="var(--scene-tree)" strokeLinejoin="round">
                    <path d="m84 308-22 43h12l-23 38h65l-23-38h13Z" />
                    <path d="M82 380v32" fill="none" strokeWidth="5" />
                    <path d="m139 346-15 31h8l-17 28h48l-17-28h9Z" />
                    <path d="M139 402v22" fill="none" strokeWidth="4" />
                    <path d="m533 301-22 43h12l-23 37h65l-23-37h13Z" />
                    <path d="M533 374v37" fill="none" strokeWidth="5" />
                    <path d="m584 351-15 31h8l-17 28h48l-17-28h9Z" />
                    <path d="M584 403v21" fill="none" strokeWidth="4" />
                </g>
                <g transform="translate(397 325) rotate(-5)">
                    <path d="M0 17 25 0 50 17v33H0Z" fill="var(--scene-house)" />
                    <path d="m-5 19 30-23 30 23" fill="none" stroke="var(--scene-tree)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 50V31h11v19" fill="var(--scene-tree)" />
                    <path d="M7 27h8v9H7Z" fill="var(--scene-snow)" />
                </g>
                <g fill="none" stroke="var(--scene-grass)" strokeWidth="2" strokeLinecap="round">
                    <path d="m38 461-3-10m4 11 6-8 M111 482l-3-11m4 12 7-7 M557 470l-4-12m5 11 8-8 M604 496l-2-10m3 10 5-6" />
                </g>
                <g transform="translate(335 251) rotate(-10)">
                    <path d="m0 0 5 26 8-9 12-3Z" fill="var(--scene-house)" stroke="var(--scene-tree)" strokeWidth="2" strokeLinejoin="round" />
                    <rect x="19" y="21" width="83" height="29" rx="7" fill="var(--scene-house)" />
                    <text x="31" y="40" fontSize="13" fontWeight="500" fill="#273c35">Your idea</text>
                </g>
            </svg>
            <p className="absolute bottom-5 left-8 hidden text-xs text-[var(--scene-caption)] lg:block">Good things start with a few lines.</p>
        </aside>
    );
}
