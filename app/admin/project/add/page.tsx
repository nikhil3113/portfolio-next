"use client";

import FormFields from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import axios from "axios";
import { CldUploadWidget } from "next-cloudinary";
import {
  Plus,
  FileText,
  Link2,
  ImageIcon,
  Upload,
  Tag,
  ArrowLeft,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  siteLink: z.url("Invalid URL format").min(1, "Site link is required"),
  githubLink: z.url("Invalid URL format").min(1, "GitHub link is required"),
  image: z.string().min(1, "Image URL is required"),
  tags: z.string().min(1, "At least one tag is required"),
});

export default function AddProject() {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      siteLink: "",
      githubLink: "",
      image: "",
      tags: "",
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
      });
      if (response.status === 201) {
        alert("Project created successfully!");
        form.reset();
      } else {
        alert("Failed to create project. Please try again.");
      }
    } catch (error) {
      console.log("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Add New Project
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new project for your portfolio
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full w-1/4"></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Project Details Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Project Details
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Basic information about your project
                    </p>
                  </div>

                  <div className="space-y-6">
                    <FormFields
                      name="title"
                      control={form.control}
                      label="Project Title"
                      placeholder="Enter an awesome project title"
                    />

                    <FormFields
                      name="description"
                      control={form.control}
                      label="Project Description"
                      placeholder="Describe what makes your project special..."
                      type="textarea"
                    />
                  </div>
                </div>

                {/* Links Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <Link2 className="w-5 h-5 mr-2 text-green-600" />
                      Project Links
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Share your live site and source code
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormFields
                      name="siteLink"
                      control={form.control}
                      label="Live Site URL"
                      placeholder="https://your-awesome-project.com"
                    />
                    <FormFields
                      name="githubLink"
                      control={form.control}
                      label="GitHub Repository"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>

                {/* Media Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
                      Project Image
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Upload a screenshot or preview of your project
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <CldUploadWidget
                      uploadPreset={
                        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                      }
                      signatureEndpoint="/api/sign-cloudinary-params"
                      onSuccess={(result) => {
                        console.log("Image uploaded successfully:", result);

                        if (result.info && typeof result.info !== "string") {
                          const uploadedUrl = result.info.secure_url;
                          setImageUrl(uploadedUrl);
                          form.setValue("image", uploadedUrl);
                        }
                      }}
                      options={{
                        singleUploadAutoClose: true,
                        multiple: false,
                        maxFiles: 1,
                      }}
                    >
                      {({ open }) => {
                        return (
                          <div className="space-y-4">
                            {imageUrl ? (
                              <div className="space-y-4">
                                <Image
                                  src={imageUrl}
                                  alt="Uploaded preview"
                                  className="w-full h-48 object-cover rounded-lg border"
                                  width={400}
                                  height={200}
                                />
                                <Button
                                  type="button"
                                  onClick={() => open()}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Change Image
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <Button
                                    type="button"
                                    onClick={() => open()}
                                    variant="outline"
                                    className="mb-2"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Project Image
                                  </Button>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    </CldUploadWidget>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-orange-600" />
                      Technologies & Tags
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Add technologies and keywords for your project
                    </p>
                  </div>

                  <FormFields
                    name="tags"
                    control={form.control}
                    label="Project Tags"
                    placeholder="React, Next.js, TypeScript, Tailwind CSS"
                    type="tags"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
                  <Button type="button" variant="outline" className="px-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>

                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" className="px-8">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      type="submit"
                      className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isLoading ? "Loading" : "Create Project"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
