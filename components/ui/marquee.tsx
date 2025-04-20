import * as React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  pauseOnHover?: boolean
  direction?: "left" | "right"
  speed?: number
}

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  className,
  ...props
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [, setContentWidth] = React.useState(0);
  
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Calculate the actual width of a single set of children
    const calculateWidth = () => {
      if (!containerRef.current) return;
      setContentWidth(containerRef.current.scrollWidth / 4);
    };
    
    // Calculate on mount and whenever window resizes
    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => window.removeEventListener('resize', calculateWidth);
  }, [children]);

  return (
    <div 
      className={cn(
        "w-full overflow-hidden", 
        className
      )} 
      {...props}
    >
      {/* Apply a class to this wrapper div when pauseOnHover is true */}
      <div className={cn("relative flex overflow-hidden", pauseOnHover && "marquee-container")}>
        <div 
          ref={containerRef}
          className="flex whitespace-nowrap marquee-content"
          style={{ 
            animation: `${direction === "left" ? "marquee" : "marquee-reverse"} ${speed}s linear infinite`,
            willChange: "transform"
          }}
        >
          {children}
          {children}
          {children}
          {children}
        </div>
      </div>
    </div>
  )
}