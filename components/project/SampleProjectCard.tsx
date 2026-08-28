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
    <CardContainer
      className="inter-var max-sm:px-5"
      containerClassName="py-0"
    >
       <CardBody className="relative group/card w-auto rounded-xl border border-border bg-card p-6 h-auto sm:w-[30rem]">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-card-foreground"
        >
          {title}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="mt-2 max-w-sm text-sm text-muted-foreground"
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
              className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
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
            className="flex items-center rounded-xl px-4 py-2 text-xs font-normal text-foreground hover:text-accent-text hover:underline"
          >
            Visit Site →
          </CardItem>
          <CardItem
            translateZ={20}
            as={Link}
            href={githubLink}
            target="_blank"
            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            <Github size={16} /> GitHub
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
