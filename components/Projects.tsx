// In your projects page or component
import { ProjectCard } from "@/components/ProjectCard";

export default function Projects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      <ProjectCard
        title="SEO Validator"
        description="SEO Validator is an AI-powered tool that generates and optimizes meta titles and descriptions for better search rankings. It ensures SEO best practices with real-time feedback on keywords and character limits."
        image="/images/seo-validator.png"
        tags={["React", "Next.js", "Tailwind CSS", "Stripe"]}
        siteLink="https://myproject.com"
        githubLink="https://github.com/username/project"
      />
      <ProjectCard
        title="Modern Mart"
        description="Modern Mart, an eCommerce platform designed to provide a seamless shopping experience. It features a modern UI, allowing users to browse products, add reviews with headlines and descriptions, and make secure payments through the Razorpay payment gateway."
        image="/images/ecommerce.png"
        tags={["React", "Next.js", "Tailwind CSS", "Stripe"]}
        siteLink="https://myproject.com"
        githubLink="https://github.com/username/project"
      />
      <ProjectCard
        title="Navi Tourism"
        description="A website built to help users explore the city's beauty. It features top-rated locations, user likes to highlight popular spots, admin controls for smooth updates, and detailed descriptions with map previews and distances from the nearest station."
        image="/images/tourism.png"
        tags={["React", "Next.js", "Tailwind CSS", "Stripe"]}
        siteLink="https://myproject.com"
        githubLink="https://github.com/username/project"
      />
      {/* More ProjectCards here */}
    </div>
  );
}
