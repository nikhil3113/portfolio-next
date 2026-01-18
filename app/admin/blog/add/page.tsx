"use client";

import { BlogForm } from "@/components/blog/Form";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  h1: z.string().min(1, "Heading is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
  author: z.string().min(1, "Author is required"),
  slug: z.string().min(1, "Slug is required"),
  isPublished: z.boolean(),
});
export default function AddBlogPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1: "",
      metaDescription: "",
      content: "",
      imageUrl: "",
      author: "",
      slug: "",
      isPublished: false,
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
        slug: values.slug,
        isPublished: values.isPublished,
      });
      if (response.status === 201) {
        toast.success("Blog created successfully");
        form.reset();
        router.push("/admin/blog");
      } else {
        alert("Failed to create blog. Please try again.");
      }
    } catch (error) {
      axios.isAxiosError(error) && error.response
        ? toast.error(
          `Error: ${error.response.data.message || "Failed to create blog"}`
        )
        : toast.error("An unexpected error occurred");
      console.log("Error submitting form:", error);
    }
  }
  return (
    <div>
      <BlogForm onSubmit={onSubmit} form={form} />
    </div>
  );
}
