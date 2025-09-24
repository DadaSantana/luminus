import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <img
      src="/logo.png"
      alt="Practia"
      className={cn(
        "select-none w-auto object-contain",
        sizes[size],
        // In dark theme, force the logo to pure white for better contrast
        "dark:brightness-0 dark:invert",
        className
      )}
      draggable={false}
    />
  );
}