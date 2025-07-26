import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
}

export default function Header({ title, subtitle, showNewButton, onNewClick }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 lg:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm lg:text-base text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {showNewButton && onNewClick && (
          <Button onClick={onNewClick} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
      </div>
    </div>
  );
}