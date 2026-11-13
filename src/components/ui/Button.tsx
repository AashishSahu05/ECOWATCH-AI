import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonBaseProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "lemon";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  icon,
  iconPosition = "right",
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-brand-emerald text-white hover:bg-[#1C6948] shadow-sm hover:shadow active:scale-[0.98] border border-brand-emerald/80",
    secondary:
      "bg-brand-mint-cream text-brand-deep-green hover:bg-brand-soft-sage/70 active:scale-[0.98] border border-brand-soft-sage font-semibold",
    outline:
      "bg-white text-brand-deep-green hover:bg-brand-mint-cream active:scale-[0.98] border border-brand-soft-sage/80 shadow-subtle",
    ghost:
      "bg-transparent text-brand-deep-green hover:bg-brand-mint-cream/80 active:scale-[0.98]",
    lemon:
      "bg-brand-lemon text-brand-deep-green hover:bg-[#CCE095] font-bold shadow-subtle active:scale-[0.98] border border-brand-lemon",
  };

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 rounded-lg gap-1.5 font-medium",
    md: "text-sm px-5 py-2.5 rounded-xl gap-2 font-semibold",
    lg: "text-base px-6 py-3.5 rounded-xl gap-2.5 font-semibold",
  };

  const baseStyles = cn(
    "inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "w-auto",
    className
  );

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={baseStyles} {...linkProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={baseStyles} {...buttonProps}>
      {content}
    </button>
  );
}
