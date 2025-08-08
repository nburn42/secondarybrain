import { useState, useRef, useEffect } from "react";
import { ApprovalQueueWithTask } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Check, Clock, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface SwipeCardProps {
  approval: ApprovalQueueWithTask;
  onApprove: () => void;
  onReject: () => void;
}

export default function SwipeCard({ approval, onApprove, onReject }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitX(200);
      onApprove();
    } else if (info.offset.x < -threshold) {
      setExitX(-200);
      onReject();
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 5) return 'text-warning';
    if (priority >= 2) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 5) {
      return <Zap className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="relative h-96 mb-6">
      <motion.div
        ref={cardRef}
        className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-gray-200 p-6 cursor-grab active:cursor-grabbing"
        style={{
          x,
          rotate,
          opacity,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={exitX !== 0 ? { x: exitX } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-600">
              {approval.task.project.name}
            </span>
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {approval.task.title}
          </h4>
          
          {approval.task.description && (
            <p className="text-gray-600 text-sm mb-4 flex-1">
              {approval.task.description}
            </p>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Priority:</span>
              <span className={`font-medium flex items-center gap-1 ${getPriorityColor(approval.task.priority)}`}>
                {getPriorityIcon(approval.task.priority)}
                {approval.task.priority.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-primary text-sm font-medium hover:text-blue-700">
              View Details →
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Swipe Indicators */}
      <motion.div 
        className="absolute -left-4 top-1/2 transform -translate-y-1/2"
        style={{
          opacity: useTransform(x, [-100, 0], [1, 0])
        }}
      >
        <div className="bg-error text-white p-3 rounded-full shadow-lg">
          <X className="w-6 h-6" />
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute -right-4 top-1/2 transform -translate-y-1/2"
        style={{
          opacity: useTransform(x, [0, 100], [0, 1])
        }}
      >
        <div className="bg-accent text-white p-3 rounded-full shadow-lg">
          <Check className="w-6 h-6" />
        </div>
      </motion.div>
    </div>
  );
}
