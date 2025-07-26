import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Shuffle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import SwipeApprovalCard from "@/components/swipe-approval-card";

interface ApprovalItem {
  id: string;
  taskId: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  needsApproval: boolean;
  isApproved: boolean | null;
  task?: {
    title: string;
    project: {
      name: string;
    };
  };
}

export default function Approvals() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeMode, setSwipeMode] = useState(false);
  const { toast } = useToast();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["/api/approvals"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/task-items/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Approved",
        description: "Item has been approved successfully",
      });
      moveToNext();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve item",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/task-items/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Rejected",
        description: "Item has been rejected",
      });
      moveToNext();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject item",
        variant: "destructive",
      });
    },
  });

  const moveToNext = () => {
    if (currentIndex < approvals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, reason: string) => {
    rejectMutation.mutate({ id, reason });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tool_call":
        return <AlertTriangle className="h-4 w-4" />;
      case "file_creation":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tool_call":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "file_creation":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <Header title="Approvals" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <Header title="Approvals" />
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>All caught up!</CardTitle>
            <CardDescription>
              No pending approvals at the moment. New items will appear here when they need your review.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentItem = approvals[currentIndex];

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-2xl">
      <Header title="Approvals" />
      
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={!swipeMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setSwipeMode(false)}
            className="text-xs"
          >
            List View
          </Button>
          <Button
            variant={swipeMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setSwipeMode(true)}
            className="text-xs"
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Swipe Mode
          </Button>
        </div>
      </div>

      {swipeMode ? (
        /* Swipe Mode */
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentIndex + 1} of {approvals.length} pending approvals
            </p>
          </div>

          {currentItem && (
            <SwipeApprovalCard
              item={currentItem}
              onApprove={handleApprove}
              onReject={handleReject}
              onSkip={moveToNext}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={moveToNext}
              disabled={currentIndex === approvals.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="space-y-4">
          {approvals.map((item: ApprovalItem) => (
            <Card key={item.id} className="border-l-4 border-l-orange-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    {item.task && (
                      <CardDescription>
                        {item.task.project.name} • {item.task.title}
                      </CardDescription>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(item.type)}
                      {item.type.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {item.content || "No content provided"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(item.id, "Rejected from list view")}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(item.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}