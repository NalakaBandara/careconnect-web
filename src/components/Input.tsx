import type { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm " +
        "placeholder:text-muted-foreground " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    />
  );
}
