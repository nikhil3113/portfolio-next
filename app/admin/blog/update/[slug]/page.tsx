"use client";

import { BlogForm } from "@/components/blog/Form";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner"
import { useForm } from "react-hook-form";
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
export default function UpdateBlogPage() {
  const { slug } = useParams();
  const router = useRouter()
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

  useEffect(() => {
    toast.loading("Loading blog data...");
    axios
      .get(`/api/blog/${slug}`)
      .then((res) => {
        if (res.status === 200) {
          form.reset({
            h1: res.data.h1,
            metaDescription: res.data.metaDescription,
            content: res.data.content,
            imageUrl: res.data.imageUrl,
            author: res.data.author,
            isPublished: res.data.isPublished,
            slug: res.data.slug,
          });
        }
        toast.success("Blog data loaded");
      })
      .catch((err) => {
        toast.error("Failed to load blog data");
        console.error("Error fetching blog data:", err);
      });
  }, [slug]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.put(`/api/blog/${slug}`, {
        h1: values.h1,
        metaDescription: values.metaDescription,
        content: values.content,
        imageUrl: values.imageUrl,
        author: values.author,
        isPublished: values.isPublished,
        newSlug: values.slug,
      });
      if (response.status === 201 || 200) {
        toast.success("Blog updated successfully");
        form.reset();
        router.push("/admin/blog");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Error: ${error.response.data.message || 'Failed to update blog'}`);
      }
      console.log("Error submitting form:", error);
    }
  }
  return (
    <div>
      <BlogForm onSubmit={onSubmit} form={form} isUpdate={true} />
    </div>
  );
}
