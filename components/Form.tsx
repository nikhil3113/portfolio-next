"use client";

import { Controller, FieldValues, Control, Path } from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "./ui/select";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  type?: string;
  description?: string;
  autocomplete?: string;
  options?: Array<{ value: string | number; label: string }> | string[];
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const FormFields = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = "text",
  description,
  autocomplete = "on",
  options,
  disabled = false,
  icon,
}: FormFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormItem>
      <FormLabel className="text-[15px] font-poppins font-medium">
        {label}
      </FormLabel>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <>
            <FormControl>
              {type === "textarea" ? (
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  aria-invalid={!!fieldState.error}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={5}
                  disabled={disabled}
                  className="dark:border-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4379EE] focus-visible:border-[#4379EE] "
                />
              ) : type === "select" ? (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <SelectTrigger className="dark:border-gray-600 ">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {options?.map((option) => (
                        <SelectItem
                          key={option as string}
                          value={option as string}
                        >
                          {option as string}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      {icon}
                    </div>
                  )}

                  <Input
                    {...field}
                    className="dark:border-gray-600 pr-10"
                    placeholder={placeholder}
                    disabled={disabled}
                    type={
                      type === "password"
                        ? showPassword
                          ? "text"
                          : "password"
                        : type
                    }
                    aria-invalid={!!fieldState.error}
                    onChange={(e) =>
                      type === "number"
                        ? field.onChange(parseInt(e.target.value))
                        : field.onChange(e.target.value)
                    }
                    autoComplete={autocomplete}
                  />
                  {type === "password" && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeClosed className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            {fieldState.error && (
              <FormMessage>{fieldState.error.message}</FormMessage>
            )}
          </>
        )}
      />
    </FormItem>
  );
};

export default FormFields;
