"use client";

import Image from "next/image";
import Link from "next/link";
import { RadiantButton } from "./RadiantButton";

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
      <div className="group relative h-full flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800 transition duration-200">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-tl-lg rounded-tr-lg bg-gray-100 dark:bg-zinc-800">
          <Image
            src={image}
            alt={title}
            className="h-full w-full transform object-cover transition duration-200 group-hover:scale-95 group-hover:rounded-2xl"
            width={500}
            height={500}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="my-3 text-lg font-bold text-zinc-700 dark:text-zinc-200">
            {title}
          </h2>
          <p className="my-3 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            {description}
          </p>

          <div className="flex flex-wrap gap-2 my-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-2 flex flex-row items-center justify-between">
            <Link
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
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
