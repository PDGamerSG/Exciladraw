/** A composed whiteboard example using the product's own drawing vocabulary. */
export function AuthSketchbook() {
    return (
        <svg viewBox="0 0 640 340" className="w-full max-w-[680px]" role="img"
            aria-label="A shared whiteboard sketch: an idea becomes a wireframe, with a note to try it together.">
            <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M32 72q70-5 145 0l-1 81q-75 4-142-1Z" stroke="var(--pen-blue)" fill="var(--pen-blue)" fillOpacity="0.07" />
                <path d="M192 112c26-21 56-22 77-5m-14-15 16 17-22 4" stroke="var(--chalk-300)" />
                <path d="M297 39q119-3 235 1l-2 176q-116 5-234-1Z" stroke="var(--pen-graphite)" fill="var(--ink-950)" />
                <path d="M298 65h232" stroke="var(--ink-600)" />
                <circle cx="311" cy="53" r="2" stroke="var(--pen-red)" />
                <circle cx="322" cy="53" r="2" stroke="var(--pen-amber)" />
                <circle cx="333" cy="53" r="2" stroke="var(--pen-green)" />
                <path d="M316 82h80v72h-79Z" stroke="var(--pen-violet)" fill="var(--pen-violet)" fillOpacity="0.1" />
                <path d="m329 139 19-26 16 17 15-21" stroke="var(--pen-violet)" />
                <circle cx="337" cy="101" r="6" stroke="var(--pen-violet)" />
                <path d="M417 89h92m-92 16h68m-68 19h84m-84 16h50" stroke="var(--chalk-500)" />
                <rect x="316" y="174" width="85" height="22" rx="5" stroke="var(--pen-green)" fill="var(--pen-green)" fillOpacity="0.14" />
                <path d="M445 243q-72 61-154 32m13-8-16 7 11 14" stroke="var(--pen-amber)" />
                <path d="M536 95q36-13 62 8m-48 7q26-7 43 3" stroke="var(--pen-red)" />
                <path d="m572 64 6 8 16-20" stroke="var(--pen-green)" strokeWidth="3" />
            </g>
            <g fill="var(--chalk-100)" fontFamily="var(--font-inter), sans-serif">
                <text x="66" y="106" fontSize="17">What if...</text>
                <text x="54" y="132" fontSize="12" fill="var(--pen-blue)">start with an idea</text>
                <text x="425" y="194" fontSize="12" fill="var(--chalk-500)">make it real</text>
            </g>
            <g transform="translate(75 215) rotate(-6)">
                <path d="M0 0h179v88H0Z" fill="var(--pen-amber)" fillOpacity="0.13" stroke="var(--pen-amber)" strokeWidth="1.5" />
                <text x="17" y="32" fill="var(--chalk-100)" fontSize="16">Try it together.</text>
                <path d="M17 43q67-5 134 0" stroke="var(--pen-amber)" strokeWidth="2" fill="none" />
                <text x="17" y="67" fill="var(--chalk-300)" fontSize="12">leave room for the messy bit</text>
            </g>
            <g transform="translate(515 220)">
                <path d="m0 0 4 23 7-8 12-3Z" fill="var(--pen-blue)" stroke="var(--ink-950)" strokeWidth="2" />
                <rect x="14" y="19" width="45" height="23" rx="5" fill="var(--pen-blue)" />
                <text x="24" y="35" fontSize="12" fill="var(--ink-950)">You</text>
            </g>
        </svg>
    );
}
