"use client";

import { useState } from "react";

interface ExperienceItem {
  date: string;
  company: string;
  role: string;
  website?: string;
}

const experienceData: ExperienceItem[] = [
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

function CompanyIcon({
  company,
  website,
}: Pick<ExperienceItem, "company" | "website">) {
  const [hasError, setHasError] = useState(false);
  const faviconUrl = website
    ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(website)}&sz=64`
    : null;

  return (
    <>
      {faviconUrl && !hasError ? (
        <img
          src={faviconUrl}
          alt="company favicon"
          className="h-6 w-6 object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        company.charAt(0)
      )}
    </>
  );
}

export function Experience() {
  return (
    <section className="py-0">
      <div className="mx-auto w-full max-w-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 font-semibold tracking-wide text-accent-text">
            MY JOURNEY
          </p>
          <h3 className="mb-4 text-3xl font-bold md:text-4xl">
            Professional Experience
          </h3>
          <p className="text-muted-foreground max-sm:px-5">
            A look at the teams and roles that have shaped my professional
            journey.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {experienceData.map((item) => (
            <article
              key={`${item.company}-${item.role}`}
              className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:py-8"
            >
              <div className="flex min-w-0 gap-4">
                <CompanyIcon company={item.company} website={item.website} />

                <div>
                  <h4 className="text-xl font-bold">
                    {item.website ? (
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-accent-text"
                      >
                        {item.company}
                      </a>
                    ) : (
                      item.company
                    )}
                  </h4>
                  <p className="mt-1 font-medium text-accent-text">{item.role}</p>
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground sm:order-2 sm:pt-2 sm:text-right">
                {item.date}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
