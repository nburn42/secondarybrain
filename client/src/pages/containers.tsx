import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { PageLayout, PageContent } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Container as ContainerIcon,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  AlertTriangle,
  Package
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Container } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ContainersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: containers, isLoading, error } = useQuery({
    queryKey: ["/api/containers"],
  });

  const deleteContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/containers/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Container deleted",
        description: "The container has been successfully shut down and removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the container. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete container:", error);
    },
  });

  const getStatusIcon = (status: Container["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "running":
        return <Play className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Container["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <Header title="Containers" />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <Header title="Containers" />
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load containers. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const sortedContainers = containers ? [...containers].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];

  const runningContainers = sortedContainers.filter(c => c.status === "running");
  const pendingContainers = sortedContainers.filter(c => c.status === "pending");
  const completedContainers = sortedContainers.filter(c => c.status === "completed");
  const failedContainers = sortedContainers.filter(c => c.status === "failed");

  return (
    <PageLayout>
      <Header title="All Containers" />
      
      <PageContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Containers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sortedContainers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                Running
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {runningContainers.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedContainers.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {failedContainers.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Containers List */}
        {sortedContainers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No containers yet
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-md">
                Containers will appear here when you create them from your projects.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Running Containers */}
            {runningContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Running</h2>
                {runningContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                  />
                ))}
              </div>
            )}

            {/* Pending Containers */}
            {pendingContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Pending</h2>
                {pendingContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                  />
                ))}
              </div>
            )}

            {/* Completed Containers */}
            {completedContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
                {completedContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                  />
                ))}
              </div>
            )}

            {/* Failed Containers */}
            {failedContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Failed</h2>
                {failedContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function ContainerCard({ 
  container, 
  onView, 
  onDelete 
}: { 
  container: Container; 
  onView: () => void;
  onDelete: () => void;
}) {
  const getStatusIcon = (status: Container["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "running":
        return <Play className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Container["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 flex-1 cursor-pointer"
            onClick={onView}
          >
            <ContainerIcon className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">
                  {container.name || `Container ${container.id.slice(0, 8)}`}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(container.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(container.status)}
                  {container.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  v{container.imageTag || "latest"}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-500">
                  ID: {container.id.slice(0, 8)}
                </span>
                <span className="text-xs text-gray-500">
                  Created {formatDistanceToNow(new Date(container.createdAt))} ago
                </span>
                {container.exitCode !== null && (
                  <span className={`text-xs ${container.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Exit code: {container.exitCode}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Container?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the container and terminate any running processes.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Delete Container
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}