"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`${
        isVisible ? "opacity-100" : "opacity-0"
      } fixed bottom-6 right-6 z-50 p-3 bg-primary text-white dark:text-black rounded-full shadow-lg transition-opacity duration-300 focus:outline-none hover:bg-primary/80`}
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}