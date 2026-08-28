"use client";

import Link from "next/link";
import { RadiantButton } from "../landing/RadiantButton";
import { CldImage } from "next-cloudinary";

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  tags: string[];
  siteLink: string;
  githubLink: string;
}

export function ProjectCard({
  title,
  description,
  image,
  tags,
  siteLink,
  githubLink,
}: ProjectCardProps) {
  return (
    <div className="w-full h-full">
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-200">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-tl-lg rounded-tr-lg bg-muted">
          <CldImage
            src={image}
            alt={title}
            className="h-full w-full transform object-cover transition duration-200 group-hover:scale-95 group-hover:rounded-2xl"
            width={500}
            height={500}
          />
        </div>
        <div className="flex flex-grow flex-col p-4">
          <Link
            href={siteLink}
            className="h-full w-full"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="my-3 text-lg font-bold text-card-foreground">
              {title}
            </h2>
            <p className="my-3 text-sm font-normal text-muted-foreground">
              {description}
            </p>
          </Link>
          <div className="my-4 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-row items-center justify-between pt-2">
            <Link
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View Source
            </Link>
            <Link
              href={siteLink}
              target="_blank"
              rel="noopener noreferrer"
              className=""
            >
              <RadiantButton text="Live Demo" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
