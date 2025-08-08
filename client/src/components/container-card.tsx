import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@shared/schema";
import { Clock, Play, CheckCircle, XCircle, Trash2, Eye, Pause, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ContainerCardProps {
  container: Container;
  onDelete?: (id: string) => void;
  onViewLogs?: (id: string) => void;
}

export default function ContainerCard({ container, onDelete, onViewLogs }: ContainerCardProps) {
  // Fetch live status from cluster
  const { data: liveStatus } = useQuery({
    queryKey: ["/api/containers", container.id, "live-status"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/containers/${container.id}/live-status`);
      return await response.json();
    },
    refetchInterval: 5000, // Check status every 5 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "running":
        return <Play className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "deleting":
        return <Trash2 className="h-4 w-4" />;
      case "deleted":
        return <XCircle className="h-4 w-4" />;
      case "not_found":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "deleting":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "deleted":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "not_found":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDuration = () => {
    if (container.completedAt && container.startedAt) {
      const duration = new Date(container.completedAt).getTime() - new Date(container.startedAt).getTime();
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/containers/${container.id}`} className="flex-1">
            <div className="space-y-1 cursor-pointer">
              <CardTitle className="text-lg font-semibold hover:text-blue-600 transition-colors">
                {container.name || `Container ${container.id.slice(0, 8)}`}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {liveStatus ? (
                  <Badge variant="outline" className={getStatusColor(liveStatus.status)}>
                    {getStatusIcon(liveStatus.status)}
                    <span className="ml-1 capitalize">
                      {liveStatus.status === 'not_found' ? 'Not Found' : liveStatus.status}
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                    <Clock className="h-4 w-4" />
                    <span className="ml-1">Loading...</span>
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {container.imageTag}
                </span>
              </div>
            </div>
          </Link>
          <div className="flex items-center space-x-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLogs?.(container.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(container.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Created:</span>
            <span>{formatDistanceToNow(new Date(container.createdAt), { addSuffix: true })}</span>
          </div>
          
          {container.startedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Started:</span>
              <span>{formatDistanceToNow(new Date(container.startedAt), { addSuffix: true })}</span>
            </div>
          )}
          
          {container.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Completed:</span>
              <span>{formatDistanceToNow(new Date(container.completedAt), { addSuffix: true })}</span>
            </div>
          )}
          
          {getDuration() && (
            <div className="flex justify-between">
              <span className="text-gray-500">Duration:</span>
              <span>{getDuration()}</span>
            </div>
          )}
          
          {container.exitCode !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Exit Code:</span>
              <span className={container.exitCode === 0 ? "text-green-600" : "text-red-600"}>
                {container.exitCode}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}