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
  Package,
  Pause
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
import { useEffect, useState } from "react";

export default function ContainersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [liveStatuses, setLiveStatuses] = useState<Record<string, any>>({});

  const { data: containers, isLoading, error } = useQuery({
    queryKey: ["/api/containers"],
  });

  // Fetch live status for all containers
  useEffect(() => {
    if (!containers || containers.length === 0) return;

    const fetchStatuses = async () => {
      const statuses: Record<string, any> = {};
      
      await Promise.all(
        containers.map(async (container: Container) => {
          try {
            const response = await apiRequest("GET", `/api/containers/${container.id}/live-status`);
            const status = await response.json();
            statuses[container.id] = status;
          } catch (err) {
            console.error(`Failed to fetch status for container ${container.id}:`, err);
            statuses[container.id] = { status: 'unknown' };
          }
        })
      );
      
      setLiveStatuses(statuses);
    };

    fetchStatuses();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [containers]);

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

  if (isLoading) {
    return (
      <PageLayout>
        <Header title="Containers" />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <Header title="Containers" />
        <PageContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load containers. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </PageContent>
      </PageLayout>
    );
  }

  const sortedContainers = containers ? [...containers].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];

  // Group containers by their live status
  const runningContainers = sortedContainers.filter(c => liveStatuses[c.id]?.status === "running");
  const pausedContainers = sortedContainers.filter(c => liveStatuses[c.id]?.status === "paused");
  const pendingContainers = sortedContainers.filter(c => liveStatuses[c.id]?.status === "pending");
  const deletedContainers = sortedContainers.filter(c => liveStatuses[c.id]?.status === "deleted");
  const otherContainers = sortedContainers.filter(c => {
    const status = liveStatuses[c.id]?.status;
    return !status || !["running", "paused", "pending", "deleted"].includes(status);
  });

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
              <CardTitle className="text-sm font-medium text-orange-600">
                Paused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pausedContainers.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Deleted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {deletedContainers.length}
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
                    liveStatus={liveStatuses[container.id]}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}

            {/* Paused Containers */}
            {pausedContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Paused</h2>
                {pausedContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    liveStatus={liveStatuses[container.id]}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
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
                    liveStatus={liveStatuses[container.id]}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}

            {/* Deleted Containers */}
            {deletedContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Deleted</h2>
                {deletedContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    liveStatus={liveStatuses[container.id]}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}

            {/* Other/Unknown Status Containers */}
            {otherContainers.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Other</h2>
                {otherContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    liveStatus={liveStatuses[container.id]}
                    onView={() => setLocation(`/containers/${container.id}`)}
                    onDelete={() => deleteContainerMutation.mutate(container.id)}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
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
  liveStatus,
  onView, 
  onDelete,
  getStatusIcon,
  getStatusColor
}: { 
  container: Container; 
  liveStatus: any;
  onView: () => void;
  onDelete: () => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
}) {
  const status = liveStatus?.status || 'unknown';
  const displayStatus = status === 'not_found' ? 'Not Found' : status;

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
                  className={`${getStatusColor(status)} flex items-center gap-1`}
                >
                  {getStatusIcon(status)}
                  <span className="capitalize">{displayStatus}</span>
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