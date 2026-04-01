import { Button as KobalteButton } from "@kobalte/core/button";
import { splitProps } from "solid-js";

import type { JSX } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "loading",
    "class",
    "children",
    "disabled",
  ]);

  const variant = local.variant ?? "primary";
  const size = local.size ?? "md";

  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost:
      "text-gray-700 hover:bg-orange-50 hover:text-brand-600 focus:ring-brand-500 dark:text-gray-300 dark:hover:bg-[#2b211a] dark:hover:text-brand-300",
    primary:
      "bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:scale-[1.02] hover:bg-brand-600 focus:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-600",
    secondary:
      "border border-orange-100 bg-white text-gray-900 hover:bg-orange-50 focus:ring-brand-500 dark:border-[#3a2c23] dark:bg-[#2b211a] dark:text-gray-100 dark:hover:bg-[#33271f]",
  };

  const sizeClasses = {
    lg: "px-6 py-3 text-base",
    md: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm",
  };

  return (
    <KobalteButton
      class={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${local.class ?? ""}`}
      disabled={local.disabled || local.loading}
      {...others}
    >
      {local.loading && (
        <svg
          class="-ml-1 mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            fill="currentColor"
          ></path>
        </svg>
      )}
      {local.children}
    </KobalteButton>
  );
}
