import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Task, TaskItemWithChildren } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause,
  MessageSquare,
  Wrench,
  FileText,
  AlertTriangle,
  ThumbsDown,
  Calendar,
  Hash
} from "lucide-react";
import { format } from "date-fns";

export default function TaskDetail() {
  const params = useParams();
  const taskId = params?.id;

  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId,
  });

  const { data: taskItems, isLoading: itemsLoading } = useQuery<TaskItemWithChildren[]>({
    queryKey: ["/api/tasks", taskId, "items"],
    enabled: !!taskId,
  });

  if (taskLoading || itemsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Task Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested task could not be found.</p>
          <Link href="/tasks">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Play className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <Pause className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTaskItemIcon = (type: string) => {
    switch (type) {
      case "planning":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "tool_call":
        return <Wrench className="w-5 h-5 text-purple-500" />;
      case "file_creation":
        return <FileText className="w-5 h-5 text-green-500" />;
      case "approval_request":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "rejection":
        return <ThumbsDown className="w-5 h-5 text-red-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTaskItemColor = (type: string, needsApproval?: boolean, isApproved?: boolean | null | undefined) => {
    if (needsApproval && isApproved === null) {
      return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
    }
    if (needsApproval && isApproved === false) {
      return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
    }
    if (needsApproval && isApproved === true) {
      return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20";
    }
    
    switch (type) {
      case "planning":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
      case "tool_call":
        return "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20";
      case "file_creation":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20";
      case "rejection":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50";
    }
  };

  const formatPriority = (priority: number) => {
    return priority.toFixed(1);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (priority >= 2) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</label>
                <div className="mt-1">
                  <Badge className={getPriorityColor(task.priority)}>
                    {formatPriority(task.priority)}
                  </Badge>
                </div>
              </div>

              {task.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{task.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>

              {task.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</label>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4" />
                    {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}

              {task.containerId && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Container ID</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                    {task.containerId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Task Execution History
              </CardTitle>
              <CardDescription>
                Detailed timeline of agent actions and conversations for this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskItems && taskItems.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {taskItems.map((item: TaskItemWithChildren, index: number) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 ${getTaskItemColor(item.type, item.needsApproval, item.isApproved)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTaskItemIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {item.type.replace('_', ' ')}
                              </Badge>
                              {item.needsApproval && (
                                <Badge variant="outline" className="text-xs">
                                  {item.isApproved === null ? 'Pending Approval' : 
                                   item.isApproved ? 'Approved' : 'Rejected'}
                                </Badge>
                              )}
                            </div>
                            
                            {item.content && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                                {item.content}
                              </p>
                            )}

                            {item.chatResponse && (
                              <div className="bg-white dark:bg-gray-900 rounded border p-3 mb-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Agent Response:
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {item.chatResponse}
                                </p>
                              </div>
                            )}

                            {item.toolName && (
                              <div className="bg-white dark:bg-gray-900 rounded border p-3 mb-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Tool: {item.toolName}
                                </p>
                                {item.toolParameters && (
                                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(item.toolParameters, null, 2)}
                                  </pre>
                                )}
                                {item.toolResponse && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Response:
                                    </p>
                                    <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(item.toolResponse, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.filePath && (
                              <div className="bg-white dark:bg-gray-900 rounded border p-3 mb-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  File: {item.filePath}
                                </p>
                                {item.fileContent && (
                                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-40">
                                    {item.fileContent}
                                  </pre>
                                )}
                              </div>
                            )}

                            {item.rejectionReason && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-2">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                  Rejection Reason:
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  {item.rejectionReason}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span>{format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                              {item.children && item.children.length > 0 && (
                                <span>{item.children.length} replies</span>
                              )}
                            </div>

                            {/* Child items */}
                            {item.children && item.children.length > 0 && (
                              <div className="mt-3 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-3">
                                {item.children.map((child) => (
                                  <div key={child.id} className="bg-white dark:bg-gray-900 rounded border p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getTaskItemIcon(child.type)}
                                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                                        {child.title}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {child.type.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {child.content && (
                                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {child.content}
                                      </p>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      {format(new Date(child.createdAt), "MMM d, h:mm a")}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium mb-2">No execution history yet</p>
                  <p className="text-sm">Task items will appear here when the agent starts working on this task</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}