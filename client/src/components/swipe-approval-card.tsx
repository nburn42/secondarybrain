import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface SwipeApprovalCardProps {
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSkip?: () => void;
}

export default function SwipeApprovalCard({ 
  item, 
  onApprove, 
  onReject, 
  onSkip 
}: SwipeApprovalCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Motion values for swipe animation
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [
      "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)", // Red for reject
      "linear-gradient(90deg, #ef4444 0%, #ffffff 100%)",
      "linear-gradient(90deg, #ffffff 0%, #ffffff 100%)", // Default
      "linear-gradient(90deg, #ffffff 0%, #22c55e 100%)",
      "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)", // Green for approve
    ]
  );

  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0.8, 0.4, 1, 0.4, 0.8]);
  const scale = useTransform(x, [-300, 0, 300], [0.9, 1, 0.9]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;
    
    if (info.offset.x > threshold) {
      // Approve (swipe right)
      onApprove(item.id);
    } else if (info.offset.x < -threshold) {
      // Reject (swipe left) - show reason dialog
      setShowRejectDialog(true);
    }
    
    // Reset position
    x.set(0);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReject(item.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tool_call":
        return <AlertCircle className="h-4 w-4" />;
      case "file_creation":
        return <AlertCircle className="h-4 w-4" />;
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

  return (
    <>
      <motion.div
        className="relative w-full max-w-sm mx-auto"
        style={{ x, opacity, scale, background }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        <Card className="relative overflow-hidden border-2 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur">
          {/* Swipe indicators */}
          <motion.div 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
            style={{ 
              opacity: useTransform(x, [-300, -100, 0], [1, 0.5, 0]),
              scale: useTransform(x, [-300, -100, 0], [1.2, 1, 0.8])
            }}
          >
            <div className="bg-red-500 text-white p-3 rounded-full shadow-lg">
              <X className="h-6 w-6" />
            </div>
          </motion.div>

          <motion.div 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
            style={{ 
              opacity: useTransform(x, [0, 100, 300], [0, 0.5, 1]),
              scale: useTransform(x, [0, 100, 300], [0.8, 1, 1.2])
            }}
          >
            <div className="bg-green-500 text-white p-3 rounded-full shadow-lg">
              <Check className="h-6 w-6" />
            </div>
          </motion.div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </CardTitle>
                {item.task && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.task.project.name} • {item.task.title}
                  </p>
                )}
              </div>
              <Badge className={`ml-2 ${getTypeColor(item.type)}`}>
                <div className="flex items-center gap-1">
                  {getTypeIcon(item.type)}
                  {item.type.replace("_", " ")}
                </div>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {item.content || "No content provided"}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending approval
                </span>
              </div>
            </div>
          </CardContent>

          {/* Manual action buttons */}
          <div className="flex gap-2 p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(true)}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(item.id)}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </Card>

        {/* Swipe instruction overlay */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 text-center">
          ← Swipe left to reject • Swipe right to approve →
        </div>
      </motion.div>

      {/* Rejection reason dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Reject Approval
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {item.task?.project.name} • {item.task?.title}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Reason for rejection *
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this approval..."
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}