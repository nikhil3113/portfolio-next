"use client";

import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";
// import Image from "next/image";

// Define skills with their Simple Icons slugs
const skills = [
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "Next.js", slug: "nextdotjs" },
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "JavaScript", slug: "javascript" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "Git", slug: "git" },
  { name: "GitHub", slug: "github" },
  { name: "Vercel", slug: "vercel" },
  { name: "HTML5", slug: "html5" },
  { name: "CSS3", slug: "css" },
  { name: "MySQL", slug: "mysql" },
  { name: "Prisma", slug: "prisma" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
];

export function Skills() {
  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <p className="text-primary font-semibold mb-2 tracking-wide">
          MY EXPERTISE
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Technical Skills
        </h2>
        <p className="text-muted-foreground max-sm:px-5">
          These are the technologies I&apos;ve worked with and am proficient in.
        </p>
      </div>

      <div className="mb-10">
        <Marquee className="py-4 max-sm:px-5" pauseOnHover>
          {skills.slice(0, Math.ceil(skills.length / 2)).map((skill, index) => (
            <div
              key={index}
              className="relative h-full w-fit sm:mx-[4rem] mx-[2rem] flex flex-col items-center justify-center gap-2"
            >
              <img
                src={`https://cdn.simpleicons.org/${skill.slug}`}
                alt={skill.name}
                className="h-10 w-10"
                height={40}
                width={40}
              />
              <span className="text-sm font-medium">{skill.name}</span>
            </div>
          ))}
        </Marquee>
      </div>

      <div>
        <Marquee pauseOnHover direction="right" className="py-4 max-sm:px-5">
          {skills.slice(Math.ceil(skills.length / 2)).map((skill, index) => (
            <div
              key={index}
              className="relative h-full w-fit sm:mx-[4rem] mx-[2rem] flex flex-col items-center justify-center gap-2"
            >
              <img
                src={`https://cdn.simpleicons.org/${skill.slug}`}
                alt={skill.name}
                className="h-10 w-10"
                height={40}
                width={40}
              />
              <span className="text-sm font-medium">{skill.name}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
