"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { usePathname } from "next/navigation";

export function Appbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const navItems = [
    {
      name: "Projects",
      link: "#projects",
    },
    {
      name: "Experience",
      link: "#experience",
    },

    {
      name: "Contact",
      link: "#contact",
    },
    {
      name: "Blogs",
      link: "/blogs",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.getBoundingClientRect().top + window.scrollY - 80, // Adjust for header height
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="sticky top-0 z-50  w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody className="hidden lg:visible">
          <NavbarLogo />
          {isHomePage && (
            <NavItems
              items={navItems.map((item) => ({
                ...item,
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) =>
                  handleScroll(e, item.link),
              }))}
            />
          )}
          <div className="flex items-center gap-4">
            {/* <NavbarButton variant="primary">Contact</NavbarButton> */}
            <ModeToggle />
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {isHomePage &&
              navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={(e) => {
                    if (item.link.startsWith("#")) {
                      handleScroll(e, item.link);
                      setIsMobileMenuOpen(false);
                    } else {
                      setIsMobileMenuOpen(false);
                      // Do NOT call e.preventDefault() for normal links
                    }
                  }}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <span className="block">{item.name}</span>
                </a>
              ))}
            <div className="flex w-full flex-col gap-4">
              <ModeToggle />
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
