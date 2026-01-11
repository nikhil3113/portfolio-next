"use client";

import { ProjectForm } from "@/components/project/ProjectForm";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  siteLink: z.url("Invalid URL format").min(1, "Site link is required"),
  githubLink: z.url("Invalid URL format").min(1, "GitHub link is required"),
  image: z.string().min(1, "Image URL is required"),
  tags: z.string().min(1, "At least one tag is required"),
  createdAt: z.string().optional(),
});

export default function UpdateProjects() {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const projectId = params.id as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      siteLink: "",
      githubLink: "",
      image: "",
      tags: "",
      createdAt: "",
    },
  });

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await axios.get(`/api/projects/${projectId}`);
        const project = response.data;
        console.log("Fetched project:", project);
        form.reset({
          title: project.title,
          description: project.description,
          siteLink: project.siteLink,
          githubLink: project.githubLink,
          image: project.imageUrl,
          tags: project.tags.join(", "),
          createdAt: project.createdAt ? project.createdAt.split("T")[0] : "",
        });
        setImageUrl(project.imageUrl);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    }
    fetchProject();
  }, [projectId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const tagArray = values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    try {
      const response = await axios.put(`/api/projects/${projectId}`, {
        title: values.title,
        description: values.description,
        siteLink: values.siteLink,
        githubLink: values.githubLink,
        imageUrl: values.image,
        tags: tagArray,
        createdAt: values.createdAt,
      });
      if (response.status === 200) {
        alert("Project updated successfully!");
        form.reset();
      } else {
        alert("Failed to update project. Please try again.");
      }
    } catch (error) {
      console.log("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProjectForm
      form={form}
      onSubmit={onSubmit}
      setImageUrl={setImageUrl}
      imageUrl={imageUrl}
      isLoading={isLoading}
      isUpdate={true}
    />
  );
}
