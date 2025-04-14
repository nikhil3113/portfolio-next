import { Experience } from "@/components/Experience";
import { ProjectCard } from "@/components/ProjectCard";
import { Skills } from "@/components/Skills";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  siteLink: string;
  githubLink: string;
}

const project: Project[] = [
  {
    id: "seo-validator",
    title: "SEO Validator",
    description:
      "SEO Validator is an AI-powered tool that generates and optimizes meta titles and descriptions for better search rankings. It ensures SEO best practices with real-time feedback on keywords and character limits.",
    image: "/images/seo-validator.png",
    tags: ["React", "Next.js", "AI", "OpenAI"],
    siteLink: "https://seo-validator.com",
    githubLink: "https://github.com/username/seo-validator",
  },
  {
    id: "modern-mart",
    title: "Modern Mart",
    description:
      "Modern Mart, an eCommerce platform designed to provide a seamless shopping experience. It features a modern UI, allowing users to browse products, add reviews with headlines and descriptions, and make secure payments through the Razorpay payment gateway.",
    image: "/images/ecommerce.png",
    tags: ["React", "Next.js", "MongoDB", "Razorpay"],
    siteLink: "https://modern-mart.com",
    githubLink: "https://github.com/username/modern-mart",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative min-h-screen flex items-center justify-center">
        <BackgroundBeamsWithCollision>
          <div>
            <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
              Nikhil Chavan <br />
              <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                  <span className="">Full Stack Developer</span>
                </div>
                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                  <span className="">Full Stack Developer</span>
                </div>
              </div>
            </h2>
            {/* Resume Download Button */}
            <div className="mt-8 flex justify-center z-20 relative">
              <a
                href="/resume.pdf"
                download="Nikhil_Chavan_Resume.pdf"
                className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium transition duration-300 ease-out border-2 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-primary/50 hover:border-primary"
              >
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 group-hover:translate-x-0 ease ">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V9"
                    ></path>
                  </svg>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-foreground transition-all duration-300 transform group-hover:translate-x-full ease">
                  My Resume
                </span>
                <span className="relative invisible">My Resume</span>
              </a>
            </div>
          </div>
        </BackgroundBeamsWithCollision>
      </section>

      <section className="py-16 max-w-5xl mx-auto">
        {/* Skills */}
        <div>
          <Skills />
        </div>

        {/* Work */}
        <div>
          <div className="max-w-3xl mx-auto text-center mb-0">
            <p className="text-primary font-semibold mb-2 tracking-wide">
              MY WORK
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Projects</h2>
            <p className="text-muted-foreground">
              Explore a selection of my projects that showcase my technical
              skills and problem-solving abilities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 p-0">
            {project.map((items, idx) => (
              <ProjectCard
                key={idx}
                title={items.title}
                description={items.description}
                image={items.image}
                tags={items.tags}
                siteLink={items.siteLink}
                githubLink={items.githubLink}
              />
            ))}
          </div>
          <div className="flex justify-end mt-0">
            <Link href="/projects">
              <InteractiveHoverButton text="More" />
            </Link>
          </div>
        </div>

        <div>
          <Experience />
        </div>
      </section>
    </div>
  );
}
