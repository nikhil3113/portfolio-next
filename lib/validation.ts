import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens",
  );

export const httpUrlSchema = z
  .url("Enter a valid URL")
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Only http and https URLs are allowed",
  });

export const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .max(500)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "Image URL must be http(s) or site-relative",
  );

const dateInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const blogCreateSchema = z.object({
  h1: z.string().trim().min(1).max(200),
  metaDescription: z.string().trim().min(1).max(300),
  content: z.string().min(1).max(200_000),
  imageUrl: imageUrlSchema.or(z.literal("")),
  author: z.string().trim().min(1).max(100),
  isPublished: z.boolean(),
  slug: slugSchema,
});

// The existing slug comes from the route params, not the payload. `newSlug` is
// only shape-checked here; the route applies the stricter slug pattern when it
// actually changes, so posts created before the pattern existed stay editable.
export const blogUpdateSchema = blogCreateSchema.omit({ slug: true }).extend({
  newSlug: z.string().trim().min(1).max(120).optional(),
});

export const projectCreateSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(5000),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  siteLink: httpUrlSchema,
  githubLink: httpUrlSchema,
  imageUrl: imageUrlSchema,
  createdAt: dateInputSchema,
  hidden: z.boolean().optional().default(false),
});

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
