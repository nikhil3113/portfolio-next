"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function BlogActions({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setPending(true);
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/auth/signin");
        return;
      }

      if (!response.ok) {
        throw new Error(`Delete failed (${response.status})`);
      }

      toast.success("Blog deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
