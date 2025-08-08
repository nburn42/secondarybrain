import { Task, TaskWithProject } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface TaskCardProps {
  task: Task | TaskWithProject;
  showProject?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TaskCard({ task, showProject = false, onEdit, onDelete }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent bg-opacity-10 text-accent';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_approval':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 5) return 'text-warning';
    if (priority >= 2) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors group">
      <div className="flex items-center justify-between">
        <Link href={`/tasks/${task.id}`} className="flex-1">
          <div className="cursor-pointer">
            <div className="flex items-center mb-2">
              <h5 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h5>
              <Badge className={`ml-2 ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </Badge>
              <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            )}
            <div className="flex items-center text-xs text-gray-500 space-x-4">
              <span className={getPriorityColor(task.priority)}>
                Priority: {task.priority.toFixed(1)}
              </span>
              {showProject && 'project' in task && (
                <span>Project: {task.project.name}</span>
              )}
            </div>
          </div>
        </Link>
        {(onEdit || onDelete) && (
          <div className="flex items-center space-x-2 ml-4">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
