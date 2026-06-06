import { MousePointer2, Pencil, Shapes, Eraser, Type, Image, Users, Zap } from 'lucide-react';

const TOOLBAR_ICONS = [MousePointer2, Pencil, Shapes, Eraser, Type, Image];
const SWATCHES = ['#111827', '#e94560', '#f59e0b', '#22c55e', '#3b82f6'];

export default function SketchCanvas() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          {TOOLBAR_ICONS.map((Icon, i) => (
            <span
              key={i}
              className={`p-1.5 rounded-md ${i === 1 ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
            >
              <Icon size={14} />
            </span>
          ))}
          <div className="ml-auto flex gap-1">
            {SWATCHES.map((c) => (
              <span
                key={c}
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative h-72 grid-bg overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 600 288"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Rectangle */}
            <rect
              x="60" y="54" width="150" height="90" rx="4"
              stroke="#111827" strokeWidth="2" strokeLinecap="round"
              fill="rgba(59,130,246,0.07)"
              className="sketch-line"
            />
            <text x="135" y="104" textAnchor="middle" fontFamily="var(--font-caveat), cursive"
              fontSize="15" fill="#111827" opacity="0"
              style={{ animation: 'fadeIn 0.4s 1.6s both' }}>Component</text>

            {/* Arrow */}
            <path d="M210 99 C265 99 265 136 308 136"
              stroke="#e94560" strokeWidth="1.8" strokeLinecap="round"
              fill="none" className="sketch-line sketch-line-d1" />
            <polygon points="304,131 316,136 304,141" fill="#e94560"
              opacity="0" style={{ animation: 'fadeIn 0.3s 1.4s both' }} />

            {/* Circle */}
            <circle cx="368" cy="136" r="50"
              stroke="#e94560" strokeWidth="2" strokeLinecap="round"
              fill="rgba(233,69,96,0.05)"
              className="sketch-line sketch-line-d2" />
            <text x="368" y="141" textAnchor="middle" fontFamily="var(--font-caveat), cursive"
              fontSize="15" fill="#111827" opacity="0"
              style={{ animation: 'fadeIn 0.4s 1.8s both' }}>State</text>

            {/* Diamond */}
            <path d="M470 56 L514 100 L470 144 L426 100 Z"
              stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
              fill="rgba(245,158,11,0.07)"
              className="sketch-line sketch-line-d3" />
            <text x="470" y="104" textAnchor="middle" fontFamily="var(--font-caveat), cursive"
              fontSize="14" fill="#111827" opacity="0"
              style={{ animation: 'fadeIn 0.4s 2s both' }}>Logic</text>

            {/* Sticky note */}
            <rect x="300" y="200" width="110" height="62" rx="3"
              fill="#fef9c3" stroke="#fde047" strokeWidth="1.2"
              opacity="0" style={{ animation: 'fadeIn 0.4s 2.2s both' }} />
            <text x="355" y="220" textAnchor="middle" fontFamily="var(--font-caveat), cursive"
              fontSize="12" fill="#713f12" opacity="0"
              style={{ animation: 'fadeIn 0.4s 2.3s both' }}>Ideas flow</text>
            <text x="355" y="238" textAnchor="middle" fontFamily="var(--font-caveat), cursive"
              fontSize="12" fill="#713f12" opacity="0"
              style={{ animation: 'fadeIn 0.4s 2.4s both' }}>freely here</text>

            {/* Freehand */}
            <path d="M75 210 Q94 193 113 210 Q132 228 151 205 Q170 183 189 210"
              stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round"
              fill="none" className="sketch-line sketch-line-d4" />

            {/* Cursor */}
            <g style={{ animation: 'float 3s ease-in-out infinite' }}>
              <path d="M480 210 L480 230 L485 225 L489 234 L491 233 L487 224 L494 224 Z"
                fill="#111827" opacity="0.65" />
            </g>

            {/* Collaborator cursor */}
            <g style={{ animation: 'float 3s 1.4s ease-in-out infinite' }}>
              <path d="M148 160 L148 175 L152 171 L154 178 L156 177 L153 170 L158 170 Z"
                fill="#e94560" opacity="0.8" />
              <rect x="160" y="158" width="38" height="14" rx="7" fill="#e94560" />
              <text x="179" y="169" textAnchor="middle" fontFamily="var(--font-inter), sans-serif"
                fontSize="8" fill="white">Alice</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-3 bg-white rounded-lg shadow-md border border-gray-100 px-3 py-2 anim-float"
        style={{ animationDelay: '1s' }}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Users size={12} className="text-blue-500" />
          3 collaborators
        </div>
      </div>
      <div className="absolute -bottom-3 -left-3 bg-white rounded-lg shadow-md border border-gray-100 px-3 py-2 anim-float"
        style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Zap size={12} className="text-amber-500" />
          Auto-saved
        </div>
      </div>
    </div>
  );
}
