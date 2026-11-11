export interface ExperienceItem {
  date: string;
  company: string;
  role: string;
  website?: string;
}

/** Single source of truth for roles shown on the home page and /about. */
export const experienceData: ExperienceItem[] = [
  {
    date: "January 2025 - Present",
    company: "Digixpressions Pvt Ltd",
    role: "Full Stack Developer - Developer Executive",
    website: "https://digixpressionsmedia.com/",
  },
  {
    date: "September 2024 - January 2025",
    company: "Digixpressions Pvt Ltd",
    role: "Product Intern",
    website: "https://digixpressionsmedia.com/",
  },
  {
    date: "June 2023 - July 2023",
    company: "Mira Advanced Engineering",
    role: "Java Developer Intern",
  },
  {
    date: "February 2023 - April 2023",
    company: "Terna Engineering College",
    role: "Flutter Developer Intern",
    website: "https://ternaengg.ac.in/",
  },
];
