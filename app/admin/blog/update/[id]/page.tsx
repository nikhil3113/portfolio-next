"use client";

import { BlogForm } from "@/components/blog/Form";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  h1: z.string().min(1, "Heading is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
  author: z.string().min(1, "Author is required"),
  isPublished: z.boolean(),
});
export default function UpdateBlogPage() {
  const { id } = useParams();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1: "",
      metaDescription: "",
      content: "",
      imageUrl: "",
      author: "",
      isPublished: false,
    },
  });

  useAuthRedirect("/");

  useEffect(() => {
    axios
      .get(`/api/blog/${id}`)
      .then((res) => {
        if (res.status === 200) {
          form.reset({
            h1: res.data.h1,
            metaDescription: res.data.metaDescription,
            content: res.data.content,
            imageUrl: res.data.imageUrl,
            author: res.data.author,
            isPublished: res.data.isPublished,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching blog data:", err);
      });
  }, [id]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.put(`/api/blog/${id}`, {
        h1: values.h1,
        metaDescription: values.metaDescription,
        content: values.content,
        imageUrl: values.imageUrl,
        author: values.author,
        isPublished: values.isPublished,
      });
      if (response.status === 201 || 200) {
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
      <BlogForm onSubmit={onSubmit} form={form} isUpdate={true} />
    </div>
  );
}
