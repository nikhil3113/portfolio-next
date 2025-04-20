import { ProjectCard } from "@/components/ProjectCard";
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

  
const projects: Project[] = [
    {
      id: "seo-validator",
      title: "SEO Validator",
      description:
        "AI-powered tool that generates and optimizes meta titles and descriptions for better search rankings with real-time feedback on keywords and character limits.",
      image: "/images/seo-validator.png",
      tags: ["React", "Next.js", "AI", "OpenAI"],
      siteLink: "https://seo-validator.com",
      githubLink: "https://github.com/username/seo-validator",
    },
    {
      id: "modern-mart",
      title: "Modern Mart",
      description:
        "eCommerce platform with a modern UI, user reviews, and Razorpay integration for secure payments.",
      image: "/images/ecommerce.png",
      tags: ["React", "Next.js", "MongoDB", "Razorpay"],
      siteLink: "https://modern-mart.com",
      githubLink: "https://github.com/username/modern-mart",
    },
    {
      id: "task-manager",
      title: "Task Manager",
      description:
        "A productivity app for managing tasks with drag-and-drop interface, priority levels, and deadline notifications.",
      image: "/images/task-manager.png",
      tags: ["TypeScript", "React", "Firebase"],
      siteLink: "https://task-manager-app.com",
      githubLink: "https://github.com/username/task-manager",
    },
    {
      id: "weather-app",
      title: "Weather Dashboard",
      description:
        "Real-time weather forecasting with interactive maps, location search, and personalized weather alerts.",
      image: "/images/weather-app.png",
      tags: ["JavaScript", "OpenWeather API", "Charts.js"],
      siteLink: "https://weather-dashboard.com",
      githubLink: "https://github.com/username/weather-dashboard",
    },
  ];
  
  export default function ProjectsPage() {
    return (
      <div className="container mx-auto px-2 md:px-32 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-primary font-semibold mb-2 tracking-wide">
            MY WORK
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Projects</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore my portfolio of projects that showcase my technical skills and problem-solving abilities.
            Each project represents unique challenges I&apos;ve tackled using different technologies.
          </p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
            />
          ))}
        </div>
        
        <div className="text-center mt-16 ">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              >
              </path>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }