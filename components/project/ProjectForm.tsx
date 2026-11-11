import FormFields from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Controller, UseFormReturn } from "react-hook-form";
import { Plus, FileText, Link2, ImageIcon, Tag, ArrowLeft, EyeOff } from "lucide-react";
import { ImageUpload } from "../ImageUpload";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectFormData {
  title: string;
  description: string;
  siteLink: string;
  githubLink: string;
  image: string;
  tags: string;
  hidden: boolean;
  createdAt?: string;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
  imageUrl?: string;
  setImageUrl: (url: string) => void;
  form: UseFormReturn<ProjectFormData>;
  isUpdate?: boolean;
}

export function ProjectForm({
  onSubmit,
  isLoading = false,
  imageUrl,
  setImageUrl,
  form,
  isUpdate = false,
}: ProjectFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Add New Project
              </h1>
              <p className="text-muted-foreground">
                Create a new project for your portfolio
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div className="bg-primary h-1 rounded-full w-1/4"></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card backdrop-blur-sm rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Project Details Section */}
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-accent-text" />
                      Project Details
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
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

                    <FormFields
                      name="createdAt"
                      control={form.control}
                      label="Project Date"
                      placeholder="YYYY-MM-DD"
                      type="date"
                    />
                  </div>
                </div>

                {/* Links Section */}
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <Link2 className="w-5 h-5 mr-2 text-accent-text" />
                      Project Links
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
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
                  <div className="border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2 text-accent-text" />
                      Project Image
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a screenshot or preview of your project
                    </p>
                  </div>

                  <ImageUpload
                    form={form}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                    field="image"
                  />
                </div>

                {/* Tags Section */}
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-accent-text" />
                      Technologies & Tags
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
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

                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <EyeOff className="w-5 h-5 mr-2 text-accent-text" />
                      Visibility
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Control whether this project appears on your public
                      portfolio
                    </p>
                  </div>

                  <Controller
                    name="hidden"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hidden"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!!checked)
                          }
                        />
                        <Label
                          htmlFor="hidden"
                          className="text-sm font-medium leading-none"
                        >
                          Hide this project from the public site
                        </Label>
                      </div>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-8 border-t border-border">
                  <Button type="button" variant="outline" className="px-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      className="px-8 bg-primary hover:opacity-90"
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isLoading
                        ? "Loading"
                        : isUpdate
                          ? "Update Project"
                          : "Add Project"}
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
