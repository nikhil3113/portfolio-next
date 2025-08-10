"use client";

import React, { useState } from "react";
import axios from "axios";
import { Upload, X, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import Image from "next/image";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  value?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onImageUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setUploadedImageUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    setError(null);

    try {
      const res = await axios.post("/api/blog/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedImageUrl(res.data.url);
      onImageUploaded(res.data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = async (fileName: string) => {
    const res = await axios.delete("/api/blog/upload", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ fileName }),
    });
    if (res.status !== 200) {
      setError("Failed to delete image. Please try again.");
    } else {
      setUploadedImageUrl(null);
      onImageUploaded("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload" className="text-sm font-medium">
        Blog Image *
      </Label>

      {!value ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop your image here or{" "}
                  <label
                    htmlFor="image-upload"
                    className="text-primary cursor-pointer hover:underline"
                  >
                    browse files
                  </label>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {uploading && (
                <div className="flex items-center space-x-2 text-primary">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={value}
                  alt="Uploaded"
                  className="h-full w-full object-cover"
                  fill
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Image uploaded successfully
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {value.split("/").pop()}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeImage(value.split("/").pop() || "")}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
};
