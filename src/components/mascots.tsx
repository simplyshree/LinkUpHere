/* Animated SVG characters — cute campus mascots */

export function MascotPeach({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {/* body */}
      <ellipse cx="60" cy="68" rx="42" ry="40" fill="oklch(0.82 0.16 30)" />
      <ellipse cx="60" cy="66" rx="38" ry="36" fill="oklch(0.88 0.12 40)" />
      {/* cheeks */}
      <circle cx="38" cy="72" r="6" fill="oklch(0.72 0.22 15)" opacity="0.6" />
      <circle cx="82" cy="72" r="6" fill="oklch(0.72 0.22 15)" opacity="0.6" />
      {/* eyes */}
      <g className="animate-blink">
        <ellipse cx="48" cy="60" rx="3.5" ry="5" fill="oklch(0.22 0.07 280)" />
        <ellipse cx="72" cy="60" rx="3.5" ry="5" fill="oklch(0.22 0.07 280)" />
        <circle cx="49" cy="58" r="1.2" fill="white" />
        <circle cx="73" cy="58" r="1.2" fill="white" />
      </g>
      {/* smile */}
      <path d="M 50 78 Q 60 86 70 78" stroke="oklch(0.22 0.07 280)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* leaf */}
      <path d="M 60 28 Q 72 18 78 28 Q 70 34 60 32 Z" fill="oklch(0.55 0.18 145)" />
      <line x1="60" y1="28" x2="60" y2="34" stroke="oklch(0.4 0.15 145)" strokeWidth="1.5" />
    </svg>
  );
}

export function MascotStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <path
        d="M60 12 L72 46 L108 46 L78 68 L90 102 L60 80 L30 102 L42 68 L12 46 L48 46 Z"
        fill="oklch(0.85 0.18 85)"
        stroke="oklch(0.55 0.18 60)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g className="animate-blink">
        <circle cx="50" cy="58" r="3" fill="oklch(0.22 0.07 280)" />
        <circle cx="70" cy="58" r="3" fill="oklch(0.22 0.07 280)" />
      </g>
      <path d="M 52 70 Q 60 76 68 70" stroke="oklch(0.22 0.07 280)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="68" r="3.5" fill="oklch(0.72 0.22 15)" opacity="0.6" />
      <circle cx="78" cy="68" r="3.5" fill="oklch(0.72 0.22 15)" opacity="0.6" />
    </svg>
  );
}

export function MascotCloud({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={className} aria-hidden>
      <path
        d="M30 70 Q15 70 15 55 Q15 40 32 40 Q35 22 55 22 Q72 22 78 38 Q92 32 102 44 Q120 44 120 60 Q120 78 100 78 L35 78 Q30 78 30 70 Z"
        fill="white"
        stroke="oklch(0.22 0.07 280)"
        strokeWidth="2.5"
      />
      <g className="animate-blink">
        <circle cx="56" cy="52" r="2.5" fill="oklch(0.22 0.07 280)" />
        <circle cx="78" cy="52" r="2.5" fill="oklch(0.22 0.07 280)" />
      </g>
      <path d="M 60 60 Q 67 66 74 60" stroke="oklch(0.22 0.07 280)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="60" r="3" fill="oklch(0.72 0.22 15)" opacity="0.5" />
      <circle cx="86" cy="60" r="3" fill="oklch(0.72 0.22 15)" opacity="0.5" />
      {/* waving hand */}
      <g className="animate-wave" style={{ transformOrigin: "115px 55px" }}>
        <circle cx="118" cy="50" r="6" fill="white" stroke="oklch(0.22 0.07 280)" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function MascotHeart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <path
        d="M60 100 C 25 80 10 55 22 35 C 32 18 52 22 60 38 C 68 22 88 18 98 35 C 110 55 95 80 60 100 Z"
        fill="oklch(0.66 0.24 0)"
      />
      <g className="animate-blink">
        <circle cx="48" cy="50" r="3" fill="white" />
        <circle cx="72" cy="50" r="3" fill="white" />
      </g>
      <path d="M 50 62 Q 60 68 70 62" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill="currentColor" />
    </svg>
  );
}
