import { Controller, UseFormReturn } from "react-hook-form";
import { Form } from "../ui/form";
import FormFields from "../Form";
// import { ImageUpload } from "./ImageUpload";
import { TipTap } from "../TipTap";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Save, Eye } from "lucide-react";
import { ImageUpload } from "../ImageUpload";

interface BlogFormData {
  h1: string;
  metaDescription: string;
  content: string;
  imageUrl?: string;
  author: string;
}

interface BlogFormProps {
  onSubmit: (data: BlogFormData) => void;
  form: UseFormReturn<BlogFormData>;
  isLoading?: boolean;
  isUpdate?: boolean;
}

export function BlogForm({
  onSubmit,
  form,
  isLoading = false,
  isUpdate = false,
}: BlogFormProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isUpdate ? (
              <span> Update Existing Blog</span>
            ) : (
              <span>Create New Blog Post</span>
            )}

            <Badge variant="outline">Draft</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <FormFields
                    name="h1"
                    control={form.control}
                    label="Blog Title"
                    placeholder="Enter an engaging title for your blog post"
                  />
                  <FormFields
                    name="metaDescription"
                    control={form.control}
                    label="Meta Description"
                    placeholder="Brief description for SEO (150-160 characters recommended)"
                  />
                  <FormFields
                    name="author"
                    control={form.control}
                    label="Author"
                    placeholder="Enter author name"
                  />
                </div>
              </div>

              <Separator />

              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Featured Image</h3>
                {/* <ImageUpload
                  onImageUploaded={(url) => form.setValue("imageUrl", url)}
                  value={form.watch("imageUrl")}
                /> */}
                <ImageUpload<BlogFormData>
                  form={form}
                  imageUrl={form.watch("imageUrl")}
                  setImageUrl={(url) => form.setValue("imageUrl", url)}
                  field="imageUrl"
                />
              </div>

              <Separator />

              {/* Content Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content</h3>
                <Controller
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <div className="border rounded-lg p-4 min-h-[400px]">
                      <TipTap
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                      />
                    </div>
                  )}
                />
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish Blog
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
