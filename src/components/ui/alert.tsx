import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const styles: Record<Variant, { wrap: string; icon: React.ReactNode }> = {
  info: {
    wrap: "bg-sky-50 text-sky-900 ring-sky-200",
    icon: <Info className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />,
  },
  success: {
    wrap: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />,
  },
  warning: {
    wrap: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />,
  },
  error: {
    wrap: "bg-red-50 text-red-900 ring-red-200",
    icon: <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const style = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-inset", style.wrap, className)}
    >
      {style.icon}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}
