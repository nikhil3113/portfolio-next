"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

export function Appbar() {
  const [scrolled, setScrolled] = useState(false);

  // Navigation items
  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Projects", href: "/projects" },
    { name: "Contact", href: "/contact" },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 px-10",
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Logo/Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">YourName</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
          <Button variant="outline" size="sm" asChild>
            <a href="/contact">Get in touch</a>
          </Button>
          <ModeToggle/>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-6 px-2 py-6">
              {navItems.map((item) => (
                <SheetClose key={item.name} asChild>
                  <Link
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Button className="mt-2">Get in touch</Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}