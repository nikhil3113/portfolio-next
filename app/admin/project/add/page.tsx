"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import axios from "axios";
import { useState } from "react";
import { ProjectForm } from "@/components/project/ProjectForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  siteLink: z.url("Invalid URL format").min(1, "Site link is required"),
  githubLink: z.url("Invalid URL format").min(1, "GitHub link is required"),
  image: z.string().min(1, "Image URL is required"),
  tags: z.string().min(1, "At least one tag is required"),
  createdAt: z.string().optional(),
});

export default function AddProject() {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const tagArray = values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    try {
      setIsLoading(true);
      const response = await axios.post("/api/projects", {
        title: values.title,
        description: values.description,
        siteLink: values.siteLink,
        githubLink: values.githubLink,
        imageUrl: values.image,
        tags: tagArray,
        createdAt: values.createdAt,
      });
      if (response.status === 201) {
        toast.success("Project created successfully");
        form.reset();
        router.push("/admin/project");
      } else {
        alert("Failed to create project. Please try again.");
      }
    } catch (error) {
      axios.isAxiosError(error) && error.response
        ? toast.error(
          `Error: ${error.response.data.message || "Failed to create blog"}`
        )
        : toast.error("An unexpected error occurred");
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
    />
  );
}
