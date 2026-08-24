interface RadiantButtonProps{
    text: string;
}

export function RadiantButton({text}: RadiantButtonProps) {
  return (
    <button className="group relative inline-block cursor-pointer rounded-full bg-slate-800 p-px text-xs font-semibold leading-6 text-foreground no-underline shadow-2xl">
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,hsl(var(--primary)/0.6)_0%,hsl(var(--primary)/0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      <div className="relative z-10 flex items-center space-x-2 rounded-full bg-surface-container-lowest px-4 py-0.5 ring-1 ring-foreground/10">
        <span>{text}</span>
        <svg
          fill="none"
          height="16"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.75 8.75L14.25 12L10.75 15.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-transparent via-primary/90 to-transparent transition-opacity duration-500 group-hover:opacity-40" />
    </button>
  );
}
