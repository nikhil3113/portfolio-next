"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { useState } from "react";
import axios from "axios";

interface ImageUploadProps<T extends FieldValues> {
  imageUrl: string | undefined;
  setImageUrl: (url: string) => void;
  form: UseFormReturn<T>;
  field: Path<T>;
}

function getCloudinaryPublicId(url: string): string {
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return "";
    let publicIdWithVersionAndExt = url.substring(uploadIndex + 8);
    publicIdWithVersionAndExt = publicIdWithVersionAndExt.replace(
      /^v\d+\//,
      ""
    );
    publicIdWithVersionAndExt = publicIdWithVersionAndExt.split(/[?#]/)[0];
    const extIndex = publicIdWithVersionAndExt.lastIndexOf(".");
    return extIndex !== -1
      ? publicIdWithVersionAndExt.slice(0, extIndex)
      : publicIdWithVersionAndExt;
  } catch (error) {
    console.error("Error extracting Cloudinary public ID:", error);
    return "";
  }
}

export function ImageUpload<T extends FieldValues>({
  imageUrl,
  setImageUrl,
  form,
  field,
}: ImageUploadProps<T>) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!imageUrl) return;
    setRemoving(true);
    const public_id = getCloudinaryPublicId(imageUrl);
    try {
      await axios.delete("/api/sign-cloudinary-params", {
        data: { publicId: public_id },
      });
      setImageUrl("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(field, "" as any);
    } catch (err) {
      console.error("Error removing image:", err);
    } finally {
      setRemoving(false);
    }
  };
  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        signatureEndpoint="/api/sign-cloudinary-params"
        onSuccess={(result) => {
          if (result.info && typeof result.info !== "string") {
            const uploadedUrl = result.info.secure_url;
            setImageUrl(uploadedUrl);
            form.setValue(
              field,
              uploadedUrl as import("react-hook-form").PathValue<
                T,
                typeof field
              >
            );
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => open()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Image
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full flex items-center justify-center"
                      onClick={handleRemove}
                      disabled={removing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {removing ? "Removing..." : "Cancel"}
                    </Button>
                  </div>
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
  );
}
