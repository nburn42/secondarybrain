import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import SwipeCard from "@/components/swipe-card";
import { ApprovalQueueWithTask } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, X, Check, Clock } from "lucide-react";

export default function Approvals() {
  const [isSwipeModalOpen, setIsSwipeModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ["/api/approvals"],
  });

  const processApprovalMutation = useMutation({
    mutationFn: async ({ id, isApproved, notes }: { id: string; isApproved: boolean; notes?: string }) => {
      return await apiRequest("POST", `/api/approvals/${id}/process`, {
        isApproved,
        notes,
        reviewedBy: "Current User", // In a real app, this would come from auth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Approval processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    },
  });

  const handleApprove = async (approval: ApprovalQueueWithTask) => {
    await processApprovalMutation.mutateAsync({ 
      id: approval.id, 
      isApproved: true,
      notes: "Approved via swipe interface"
    });
    moveToNext();
  };

  const handleReject = async (approval: ApprovalQueueWithTask) => {
    await processApprovalMutation.mutateAsync({ 
      id: approval.id, 
      isApproved: false,
      notes: "Rejected via swipe interface"
    });
    moveToNext();
  };

  const moveToNext = () => {
    if (approvals && currentIndex < approvals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSwipeModalOpen(false);
      setCurrentIndex(0);
    }
  };

  const handleQuickApprove = async (approval: ApprovalQueueWithTask) => {
    await processApprovalMutation.mutateAsync({ 
      id: approval.id, 
      isApproved: true,
      notes: "Quick approval"
    });
  };

  const handleQuickReject = async (approval: ApprovalQueueWithTask) => {
    await processApprovalMutation.mutateAsync({ 
      id: approval.id, 
      isApproved: false,
      notes: "Quick rejection"
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <Header 
          title="Approval Queue" 
          subtitle="Review and approve pending tasks"
        />
        <main className="flex-1 px-6 py-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Header 
        title="Approval Queue" 
        subtitle="Review and approve pending tasks"
      />
      
      <main className="flex-1 px-6 py-6">
        {approvals && approvals.length > 0 ? (
          <>
            {/* Quick Actions Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="font-medium text-gray-900">
                    {approvals.length} tasks pending approval
                  </span>
                </div>
                <Button 
                  onClick={() => setIsSwipeModalOpen(true)}
                  className="bg-primary hover:bg-blue-700"
                >
                  Open Swipe Interface
                </Button>
              </div>
            </div>

            {/* Approval List */}
            <div className="space-y-4">
              {approvals.map((approval: ApprovalQueueWithTask) => (
                <div key={approval.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="border-l-4 border-warning pl-6 pr-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{approval.task.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {approval.task.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                            {approval.task.project.name}
                          </span>
                          <span>Priority: {approval.task.priority}</span>
                          <span>Author: {approval.task.authorName}</span>
                          <span>
                            Submitted {new Date(approval.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReject(approval)}
                          disabled={processApprovalMutation.isPending}
                          className="text-error hover:bg-red-50 border-red-200"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickApprove(approval)}
                          disabled={processApprovalMutation.isPending}
                          className="text-accent hover:bg-green-50 border-green-200"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Swipe Interface Modal */}
            <Dialog open={isSwipeModalOpen} onOpenChange={setIsSwipeModalOpen}>
              <DialogContent className="max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Task Approval</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsSwipeModalOpen(false)}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  
                  {approvals[currentIndex] && (
                    <>
                      <SwipeCard
                        approval={approvals[currentIndex]}
                        onApprove={() => handleApprove(approvals[currentIndex])}
                        onReject={() => handleReject(approvals[currentIndex])}
                      />
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-4">
                        <Button 
                          className="flex-1 bg-error hover:bg-red-600 text-white"
                          onClick={() => handleReject(approvals[currentIndex])}
                          disabled={processApprovalMutation.isPending}
                        >
                          <X className="w-5 h-5 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          className="flex-1 bg-accent hover:bg-green-600 text-white"
                          onClick={() => handleApprove(approvals[currentIndex])}
                          disabled={processApprovalMutation.isPending}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Approve
                        </Button>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <span className="text-sm text-gray-500">
                          {currentIndex + 1} of {approvals.length} tasks remaining
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-24 h-24 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No pending approvals
            </h3>
            <p className="text-gray-500 mb-6">
              All tasks have been reviewed. Great job!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
