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
      "SEO Validator is an AI-powered tool that generates and optimizes meta titles and descriptions for better search rankings. It ensures SEO best practices with real-time feedback on keywords and character limits.",
    image: "/images/seo-validator.png",
    tags: ["Next.js", "TailwindCSS", "TypeScript", "ShadCN"],
    siteLink: "https://seo-validator.vercel.app/",
    githubLink: "https://github.com/nikhil3113/seo-validator",
  },
  {
    id: "modern-mart",
    title: "Modern Mart",
    description:
      "Modern Mart, an eCommerce platform designed to provide a seamless shopping experience. It features a modern UI, allowing users to browse products, add reviews with headlines and descriptions, and make secure payments through the Razorpay payment gateway.",
    image: "/images/ecommerce.png",
    tags: ["Express js", "React", "TypeScript", "ShadCN", "Mongo DB", "Prisma"],
    siteLink: "https://modernmart.netlify.app/",
    githubLink: "https://github.com/nikhil3113/modern-ecommerce",
  },
  {
    id: "navi-tourism",
    title: "Navi Tourism",
    description:
      "A website built to help users explore the city's beauty. It features top-rated locations, user likes to highlight popular spots, admin controls for smooth updates, and detailed descriptions with map previews and distances from the nearest station.",
    image: "/images/tourism.png",
    tags: ["Express js", "React", "Mongo DB", "TailwindCSS", "Prisma"],
    siteLink: "http://navitourism.vercel.app/",
    githubLink: "https://github.com/nikhil3113/Navi-Tourism",
  },
  {
    id: "experavel",
    title: "Experavel",
    description:
      "A web app built for sharing travel experiences. Users can easily share their travel stories and engage with others' experiences through comments, fostering a vibrant travel community.",
    image: "/images/experavel.png",
    tags: ["Express js", "React", "Mongo DB", "TailwindCSS"],
    siteLink: "https://experavel.netlify.app/",
    githubLink: "https://github.com/nikhil3113/Experavel",
  },
  {
    id: "pixato",
    title: "Pixato",
    description:
      "Pixato is your go-to platform for stunning images. Discover and download high-quality visuals effortlessly from a curated collection. Share your favorites directly on Facebook, WhatsApp, and X.",
    image: "/images/pixato.png",
    tags: ["React", "TailwindCSS", "Axios", "Pixabay API"],
    siteLink: "https://pixato.netlify.app/",
    githubLink: "https://github.com/nikhil3113/pixato",
  },
  {
    id: "f1-stats",
    title: "F1 Stats",
    description:
      "An F1 Racing Results that displays season-based race details, winners, countdowns for upcoming races.",
    image: "/images/f1.png",
    tags: ["React", "TypeScript", "ShadCN", "TailwindCSS", "Eargst API"],
    siteLink: "https://f1-results-stats.netlify.app/",
    githubLink: "https://github.com/nikhil3113/F1-Stats",
  },
  {
    id: "gitsight",
    title: "GitSight",
    description:
      "A dynamic, responsive web app that seamlessly integrates with the GitHub API. It displays profile details like picture, bio, location, repositories count, and followers.",
    image: "/images/gitsight.png",
    tags: ["React", "Recoil", "TailwindCSS", "Github API"],
    siteLink: "https://gitsight.netlify.app/",
    githubLink: "https://github.com/nikhil3113/Gitsight",
  },
  {
    id: "bloggering",
    title: "Bloggering",
    description:
      "Bloggering is a secure blogging website built for developers to share their thoughts. Developers can easily create, share, and manage their blog posts. The platform fosters a community where developers can connect and exchange ideas.",
    image: "/images/blog.png",
    tags: ["Express js", "React", "Mongo DB", "TailwindCSS"],
    siteLink: "https://bloggering-tech.netlify.app/",
    githubLink: "https://github.com/nikhil3113/bloggering",
  },
  {
    id: "weather-app",
    title: "Weather App",
    description:
      "A weather app that provides detailed information, including humidity, feels-like temperature, and wind speed. The app delivers accurate and real-time weather updates. Its user-friendly interface makes it easy to stay informed about current conditions.",
    image: "/images/weather.png",
    tags: ["React", "Css", "Axios", "Open Weather API"],
    siteLink: "https://weathers-one.netlify.app/",
    githubLink: "https://github.com/nikhil3113/weather-app-react/",
  },
  {
    id: "movie-search-app",
    title: "Movie Search App",
    description:
      "The movie app allows users to search for movies, view details like ratings, cast, and synopses. It features a sleek, responsive interface for a seamless browsing experience. Discover and explore a vast collection of movies effortlessly.",
    image: "/images/movie.png",
    tags: ["React", "Css", "Axios", "tmdb API"],
    siteLink: "https://movie-tmdb-search.netlify.app/",
    githubLink: "https://github.com/nikhil3113/movieFinder",
  },
  {
    id: "pokedex",
    title: "PokeDex",
    description:
      "The Pokemon Search app lets users search for Pokémon and view detailed information, including stats. It features a clean, responsive interface for an enjoyable browsing experience. Explore and learn about your favorite Pokémon with ease.",
    image: "/images/poke.png",
    tags: ["React", "Css", "Axios", "Poke API"],
    siteLink: "https://pokemon-adventure-check.netlify.app/",
    githubLink: "https://github.com/nikhil3113/pokemon-app",
  },
];

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-2 xl:px-32 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <p className="text-primary font-semibold mb-2 tracking-wide">MY WORK</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Projects</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore my portfolio of projects that showcase my technical skills and
          problem-solving abilities. Each project represents unique challenges
          I&apos;ve tackled using different technologies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
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
            ></path>
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
