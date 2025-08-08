import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Container,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Container as ContainerType } from "@shared/schema";
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

export default function ContainerDetail() {
  const [, params] = useRoute("/containers/:id");
  const [, setLocation] = useLocation();
  const containerId = params?.id;
  const { toast } = useToast();

  const { data: container, isLoading, error } = useQuery({
    queryKey: ["/api/containers", containerId],
    enabled: !!containerId,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/containers", containerId, "logs"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/containers/${containerId}/logs`);
      return await response.json();
    },
    enabled: !!containerId,
    refetchInterval: container?.status === "running" ? 5000 : false, // Auto-refresh logs for running containers
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
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/");
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

  const handleDeleteContainer = async () => {
    if (!containerId) return;
    deleteContainerMutation.mutate(containerId);
  };

  const getStatusIcon = (status: ContainerType["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "running":
        return <Play className="h-5 w-5" />;
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      case "failed":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: ContainerType["status"]) => {
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

  const getDuration = (container: ContainerType) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading Container..." />
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !container) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Container Not Found" />
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Container not found or you don't have permission to view it.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => setLocation("/")} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={container.name || `Container ${container.id.slice(0, 8)}`}
      />
      
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setLocation("/")} 
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                disabled={deleteContainerMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteContainerMutation.isPending ? "Shutting down..." : "Shut down"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Shut down container?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently shut down and delete the container. 
                  Any running tasks will be terminated. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteContainer}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Shut down container
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Container Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Container className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">
                    {container.name || `Container ${container.id.slice(0, 8)}`}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {container.id}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(container.status)}>
                {getStatusIcon(container.status)}
                <span className="ml-2 capitalize">{container.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Image Tag</label>
                  <p className="text-sm">{container.imageTag || "latest"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(container.createdAt), { addSuffix: true })}
                  </p>
                </div>
                
                {container.startedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Started</label>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(container.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {container.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed</label>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(container.completedAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
                
                {getDuration(container) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm">{getDuration(container)}</p>
                  </div>
                )}
                
                {container.exitCode !== null && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Exit Code</label>
                    <p className={`text-sm font-medium ${
                      container.exitCode === 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {container.exitCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Container Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Container Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading logs...</p>
              </div>
            ) : logsData?.logs ? (
              <ScrollArea className="h-96 w-full rounded-md border bg-gray-50 p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {logsData.logs}
                </pre>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Container className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{logsData?.message || "No logs available for this container yet."}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}