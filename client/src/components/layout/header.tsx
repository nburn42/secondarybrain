import { Button } from "@/components/ui/button";
import { Plus, Download, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonText?: string;
}

export default function Header({ 
  title, 
  subtitle, 
  showNewButton = false, 
  onNewClick,
  newButtonText = "New Project" 
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            {showNewButton && (
              <Button onClick={onNewClick} className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {newButtonText}
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Download className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
