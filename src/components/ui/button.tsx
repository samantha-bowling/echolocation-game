import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 motion-snap",
        destructive: "rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 motion-snap",
        outline: "rounded-full border-2 border-border bg-transparent hover:border-foreground hover:bg-foreground/5 motion-snap",
        secondary: "rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 motion-snap",
        ghost: "rounded-full hover:bg-accent/10 hover:text-accent-foreground motion-snap",
        link: "text-primary underline-offset-4 hover:underline",
        echo: "rounded-full bg-echo-ping text-primary-foreground hover:bg-echo-ping/90 shadow-[0_0_20px_hsl(var(--echo-ping)/0.3)] hover:shadow-[0_0_30px_hsl(var(--echo-ping)/0.5)] motion-smooth",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 px-3 min-h-[44px]",
        lg: "h-11 px-8",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
