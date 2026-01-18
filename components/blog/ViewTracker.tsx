"use client"

import { useEffect } from "react";

export function BlogViewTracker({ slug }: { slug: string }) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        const viewedKey = `blog-viewed-${slug}`;
        if (typeof window !== 'undefined' && sessionStorage.getItem(viewedKey)) {
            return;
        }

        fetch(`/api/blog/views/${slug}`, { method: "POST" })
            .then(() => {
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(viewedKey, 'true');
                }
            })
            .catch((error) => {
                console.error("Error tracking blog view:", error);
            });
    }, [slug]);

    return null;
}