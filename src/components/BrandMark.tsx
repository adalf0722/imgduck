interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
        <defs>
          <linearGradient id="duckShell" x1="14" y1="10" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF8E7" />
            <stop offset="1" stopColor="#FFE08A" />
          </linearGradient>
          <linearGradient id="duckWing" x1="26" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD46D" />
            <stop offset="1" stopColor="#F4B940" />
          </linearGradient>
        </defs>
        <path
          d="M15 33c0-11.4 9.6-20.7 21.4-20.7 8.7 0 16.2 5.1 19.4 12.5 4 .4 7.2 3.8 7.2 7.9 0 4.4-3.6 8-8 8h-1.8c-3.1 7-10.4 11.8-18.8 11.8C23.1 52.5 15 44 15 33Z"
          fill="url(#duckShell)"
        />
        <path
          d="M33 23.5c6.8 0 12.6 4.7 14.1 11.1-1.8 3.7-5.8 6.3-10.4 6.3-6.3 0-11.4-4.8-11.4-10.8 0-2.4.8-4.7 2.1-6.6h5.6Z"
          fill="url(#duckWing)"
          opacity="0.9"
        />
        <path d="M18 33.2c-3.9 0-7 3-7 6.6 0 3.7 3.1 6.7 7 6.7h3.6V33.2H18Z" fill="#FFD7B8" />
        <circle cx="41.5" cy="27.5" r="2.4" fill="#1E293B" />
        <path
          d="M48.2 31.1c0-1.9 1.6-3.5 3.6-3.5h5.6c1.5 0 2.7 1.2 2.7 2.7 0 1.1-.7 2.1-1.8 2.5l-6.5 2.2c-1.8.6-3.6-.7-3.6-2.5v-1.4Z"
          fill="#F38B35"
        />
        <path d="M47.8 22.7c1.8 1.6 3.9 2.6 6.4 3.2" stroke="#F8B84E" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}
