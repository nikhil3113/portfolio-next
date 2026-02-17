"use client";

import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "../ui/3d-card";
import Link from "next/link";
import { Github } from "lucide-react";
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
    <CardContainer className="inter-var max-sm:px-5">
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          {title}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300 "
        >
          {description}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <CldImage
            src={image}
            height={1000}
            width={1000}
            className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt={title}
          />
        </CardItem>

        {/* Tags */}
        <CardItem
          translateZ="40"
          className="flex flex-wrap gap-2 mt-4"
        >
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
        </CardItem>

        <div className="flex justify-between items-center mt-8">
          <CardItem
            translateZ={20}
            as={Link}
            href={siteLink}
            target="_blank"
            className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white hover:underline flex items-center"
          >
            Visit Site →
          </CardItem>
          <CardItem
            translateZ={20}
            as={Link}
            href={githubLink}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold flex items-center gap-1"
          >
            <Github size={16} /> GitHub
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}