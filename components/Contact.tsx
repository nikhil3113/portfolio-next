"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";

interface ContactFormProps {
  compact?: boolean;
}

export function ContactForm({ compact = false }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Message sent successfully!", {
          description: "I'll get back to you soon.",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "shadow-input mx-auto w-full rounded-none p-4 md:rounded-2xl dark:bg-black border",
        compact ? "p-4 md:p-6" : "max-w-md p-4 md:p-8 mt-20"
      )}
    >


      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Get in Touch
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Have a question or want to work together? Send me a message.
      </p>

      <form className={compact ? "my-4" : "my-8"} onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-3">
          <Label htmlFor={compact ? "name-compact" : "name"}>Name</Label>
          <Input
            id={compact ? "name-compact" : "name"}
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            type="text"
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-3">
          <Label htmlFor={compact ? "email-compact" : "email"}>
            Email Address
          </Label>
          <Input
            id={compact ? "email-compact" : "email"}
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Your Email"
            type="email"
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className={compact ? "mb-4" : "mb-8"}>
          <Label htmlFor={compact ? "message-compact" : "message"}>
            Message
          </Label>
          <Textarea
            id={compact ? "message-compact" : "message"}
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message here..."
            className={cn(
              "resize-none",
              compact ? "min-h-[80px]" : "min-h-[120px]"
            )}
            required
          />
        </LabelInputContainer>

        <button
          className="group/btn relative flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Hire Me"
          )}
          <BottomGradient />
        </button>
      </form>
      <Toaster />
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
