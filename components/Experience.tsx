"use client";

import { motion } from "framer-motion";

interface ExperienceItem {
  date: string;
  company: string;
  role: string;
  description: string;
}

const experienceData: ExperienceItem[] = [
  {
    date: "January 2025 - Present",
    company: "Digixpressions Pvt Ltd",
    role: "Full Stack Developer - Junior Executive",
    description: "Revamping their official website using MERN stack and Leading the frontend development for developing an in house project."
  },
  {
    date: "September 2024 - January 2025",
    company: "Digixpressions Pvt Ltd",
    role: "Product Intern",
    description: "Built a React-based dashboard with reusable components to improve efficiency and user experience while maintaining online accessibility. Created a blog page with PHP, MySQL, and Bootstrap, then conducted competitive research to maximize SEO with structured data formats for increased visibility."
  },
  {
    date: "February 2023 - April 2023",
    company: "Terna Engineering College",
    role: "Flutter Developer Intern",
    description: "Contributed to the full development lifecycle of Flutter applications, from design to deployment. Helped improve the user interface and gained real experience with Flutter app development."
  },
  {
    date: "June 2023 - July 2023",
    company: "Mira Advanced Engineering",
    role: "Java Developer Intern",
    description: "Acquired hands-on experience in Java application development. Contributed to the development of Java-based web applications and JSP websites."
  }
];

export function Experience() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-primary font-semibold mb-2 tracking-wide">MY JOURNEY</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
          <p className="text-muted-foreground">
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
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <span className="text-sm text-muted-foreground font-medium">{item.date}</span>
                <h3 className="text-xl font-bold mt-2">{item.company}</h3>
                <h4 className="font-medium text-primary">{item.role}</h4>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}