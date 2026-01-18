"use client"

import { useEffect } from "react";

export function BlogViewTracker({ slug }: { slug: string }) {
    useEffect(() => {
        fetch(`/api/blog/views/${slug}`, { method: "POST" })
            .catch((error) => {
                console.error("Error tracking blog view:", error);
            });
    }, [slug]);

    return null;
}