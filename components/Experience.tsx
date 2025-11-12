"use client";

import { motion } from "framer-motion";
import { MagicCard } from "./ui/magic-card";
import { useTheme } from "next-themes";

interface ExperienceItem {
  date: string;
  company: string;
  role: string;
  description: string[];
}

const experienceData: ExperienceItem[] = [
  {
    date: "January 2025 - Present",
    company: "Digixpressions Pvt Ltd",
    role: "Full Stack Developer - Junior Executive",
    description: [
      "Orchestrated the full-stack development of the company’s website, delivering a production-ready application 3–4 times faster than the projected timeline for external vendors, resulting in significant cost savings.",
      "Led the frontend development lifecycle for an in-house SEO analytics tool, from concept to deployment, creating an intuitive interface that reduced manual audit time by 30%.",
      "Developed a DA/PA checker tool using Next.js that checks Domain and Page Authority, eliminating 85% of the manual workload for the off-page SEO team.",
      "Managed the complete deployment lifecycle for the SEO tool’s frontend, utilizing Git, PM2, and Nginx to ensure high availability.",
    ],
  },
  {
    date: "September 2024 - January 2025",
    company: "Digixpressions Pvt Ltd",
    role: "Product Intern",
    description: [
      "Revamped Hero Section and engineered a blog page for EasyHomeLoan using PHP, MySQL, and Bootstrap, improving page load speed by 30%.",
      "Built and integrated RESTful APIs in PHP, streamlining data flow between frontend and backend.",
      "Automated HR emails via Google Apps Script, reducing manual effort by 90%.",
      "Managed the content publishing workflow in WordPress, overseeing the formatting, scheduling, and final upload of articles for multiple teams.",
    ],
  },
  {
    date: "June 2023 - July 2023",
    company: "Mira Advanced Engineering",
    role: "Java Developer Intern",
    description: [
      "Implemented backend features in Java for internal tools, optimizing load time by 15–20%.",
      "Worked on multiple projects using JSP, AWT, and Swing. And reviewed code regularly with mentor.",
    ],
  },
  {
    date: "February 2023 - April 2023",
    company: "Terna Engineering College",
    role: "Flutter Developer Intern",
    description: [
      "Developed 3-4 screens (primarily authentication-related) using Flutter and integrated with Firebase Database.",
      "Enhanced app usability by refining 5+ UI screens, improving user satisfaction scores in testing by 25%",
    ],
  },
];

export function Experience() {
  const { theme } = useTheme();
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-primary font-semibold mb-2 tracking-wide">
            MY JOURNEY
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Professional Experience
          </h2>
          <p className="text-muted-foreground max-sm:px-5">
            A timeline of my professional growth and career milestones.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {experienceData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative pl-8 mb-12 last:mb-0"
            >
              {/* Timeline connector */}
              {index < experienceData.length - 1 && (
                <div className="absolute left-[15px] top-[28px] w-[1px] h-[calc(100%-28px)] bg-border" />
              )}

              {/* Timeline dot */}
              <div className="absolute left-0 top-[6px] w-[30px] h-[30px] rounded-full border-4 border-background bg-primary/20 flex items-center justify-center">
                <div className="w-[10px] h-[10px] rounded-full bg-primary" />
              </div>

              {/* Content */}
              <MagicCard
                className="bg-card border rounded-lg p-6 shadow-sm"
                gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
              >
                <span className="text-sm text-muted-foreground font-medium">
                  {item.date}
                </span>
                <h3 className="text-xl font-bold mt-2">{item.company}</h3>
                <h4 className="font-medium text-primary">{item.role}</h4>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {item.description.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
