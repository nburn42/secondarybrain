import { ProjectWithRelations } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface ProjectCardProps {
  project: ProjectWithRelations;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent bg-opacity-10 text-accent';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingApprovalCount = project.tasks.filter(task => task.status === 'awaiting_approval').length;

  return (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-medium text-sm">
            {getProjectInitials(project.name)}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{project.name}</h4>
          <p className="text-sm text-gray-500">
            {project.tasks.length} tasks
            {pendingApprovalCount > 0 && ` • ${pendingApprovalCount} pending approval`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
