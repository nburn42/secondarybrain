import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageLayout({ children, className, fullWidth = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={cn(
        fullWidth ? "" : "px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto",
        className
      )}>
        {children}
      </div>
    </div>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}