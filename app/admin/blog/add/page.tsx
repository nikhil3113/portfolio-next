"use client";

import { BlogForm } from "@/components/blog/Form";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  h1: z.string().min(1, "Heading is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
  author: z.string().min(1, "Author is required"),
});
export default function AddBlogPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1: "",
      metaDescription: "",
      content: "",
      imageUrl: "",
      author: "",
    },
  });

  useAuthRedirect("/");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.post("/api/blog", {
        h1: values.h1,
        metaDescription: values.metaDescription,
        content: values.content,
        imageUrl: values.imageUrl,
        author: values.author,
      });
      if (response.status === 201) {
        alert("Blog created successfully!");
        form.reset();
      } else {
        alert("Failed to create blog. Please try again.");
      }
    } catch (error) {
      console.log("Error submitting form:", error);
    }
  }
  return (
    <div>
      <BlogForm onSubmit={onSubmit} form={form} />
    </div>
  );
}
