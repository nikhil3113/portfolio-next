"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ContactActions({
  id,
  isRead,
}: {
  id: string;
  isRead: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleRead() {
    setPending(true);
    try {
      const response = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      router.refresh();
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this contact message? This cannot be undone.")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      toast.success("Contact deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="outline" onClick={toggleRead} disabled={pending}>
        {isRead ? "Mark unread" : "Mark read"}
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={pending}>
        Delete
      </Button>
    </div>
  );
}
