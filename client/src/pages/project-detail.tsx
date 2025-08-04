import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/layout/header";
import TaskCard from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, insertGithubRepositorySchema, insertContainerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Github, 
  Plus, 
  ExternalLink, 
  Calendar,
  Users,
  GitBranch,
  Settings,
  Trash2,
  Container,
  Play,
  StopCircle
} from "lucide-react";
import { Link } from "wouter";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id;
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isRepoDialogOpen, setIsRepoDialogOpen] = useState(false);
  const [isContainerDialogOpen, setIsContainerDialogOpen] = useState(false);

  const { toast } = useToast();

  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: repositories } = useQuery({
    queryKey: ["/api/projects", projectId, "repositories"],
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: !!projectId,
  });

  const { data: containers } = useQuery({
    queryKey: ["/api/projects", projectId, "containers"],
    enabled: !!projectId,
  });

  // Fetch all repositories for selection
  const { data: allRepositories } = useQuery({
    queryKey: ["/api/repositories"],
  });

  const taskForm = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: 1.0,
      estimatedHours: 0,
      authorName: "",
      projectId: projectId || "",
    },
  });

  const repoForm = useForm({
    resolver: zodResolver(insertGithubRepositorySchema),
    defaultValues: {
      url: "",
      description: "",
      projectId: projectId || "",
    },
  });

  const containerForm = useForm({
    resolver: zodResolver(insertContainerSchema),
    defaultValues: {
      name: "",
      imageTag: "latest",
      status: "pending",
      projectId: projectId || "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/projects/${projectId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsTaskDialogOpen(false);
      taskForm.reset();
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const createRepoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/projects/${projectId}/repositories`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "repositories"] });
      setIsRepoDialogOpen(false);
      repoForm.reset();
      toast({
        title: "Success",
        description: "Repository added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add repository",
        variant: "destructive",
      });
    },
  });

  const linkExistingRepoMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return await apiRequest("PUT", `/api/repositories/${repositoryId}`, {
        projectId: projectId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "repositories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setIsRepoDialogOpen(false);
      toast({
        title: "Success",
        description: "Repository linked to project successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to link repository to project",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const createContainerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/projects/${projectId}/containers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "containers"] });
      setIsContainerDialogOpen(false);
      containerForm.reset();
      toast({
        title: "Success",
        description: "Container created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create container",
        variant: "destructive",
      });
    },
  });

  const onTaskSubmit = (data: any) => {
    createTaskMutation.mutate(data);
  };

  const onRepoSubmit = (data: any) => {
    createRepoMutation.mutate(data);
  };

  const onContainerSubmit = (data: any) => {
    createContainerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="animate-pulse">
          <div className="bg-white shadow-sm border-b border-gray-200 p-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1">
        <Header title="Project Not Found" subtitle="The requested project could not be found" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent bg-opacity-10 text-accent';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1">
      {/* Custom Header for Project */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-gray-600 mb-4">
                {project.description || "No description provided"}
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <GitBranch className="w-4 h-4 mr-1" />
                  {repositories?.length || 0} repositories
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {tasks?.length || 0} tasks
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                onClick={() => setIsRepoDialogOpen(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Repository
              </Button>
              <Button onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Repositories and Containers */}
          <div className="xl:col-span-1 space-y-6">
            {/* Repositories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Repositories</h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsRepoDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {repositories?.map((repo) => (
                    <div key={repo.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-center mb-2">
                        <Github className="w-5 h-5 text-gray-700 mr-2" />
                        <span className="font-medium text-gray-900">{repo.name}</span>
                        <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                      )}
                      {repo.lastUpdated && (
                        <div className="text-xs text-gray-500">
                          <span>Updated {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {repositories?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Github className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No repositories added</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setIsRepoDialogOpen(true)}
                      >
                        Add Repository
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Containers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Containers</h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsContainerDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {containers?.map((container: any) => (
                    <div key={container.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Container className="w-5 h-5 text-gray-700 mr-2" />
                          <span className="font-medium text-gray-900">{container.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {container.status === 'running' ? (
                            <span className="flex items-center text-sm text-green-600">
                              <Play className="w-4 h-4 mr-1" />
                              Running
                            </span>
                          ) : (
                            <span className="flex items-center text-sm text-gray-500">
                              <StopCircle className="w-4 h-4 mr-1" />
                              Stopped
                            </span>
                          )}
                        </div>
                      </div>
                      {container.taskId && (
                        <div className="text-xs text-gray-500">
                          <span>Task: {container.taskId}</span>
                        </div>
                      )}
                      {container.createdAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span>Created: {new Date(container.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!containers || containers.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Container className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No containers running</p>
                      <p className="text-xs mt-1">Containers will appear when tasks are executed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {tasks?.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDelete={() => deleteTaskMutation.mutate(task.id)}
                    />
                  ))}
                  
                  {tasks?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
                      <p className="mb-4">Create your first task to get started</p>
                      <Button onClick={() => setIsTaskDialogOpen(true)}>
                        Create Task
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter task description"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (0-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            placeholder="1.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={taskForm.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsTaskDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTaskMutation.isPending}
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Repository Dialog */}
        <Dialog open={isRepoDialogOpen} onOpenChange={setIsRepoDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Repository to Project</DialogTitle>
            </DialogHeader>
            
            {/* Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Select a repository to link to this project
              </div>
              <Link href="/repositories">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRepoDialogOpen(false)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Repositories
                </Button>
              </Link>
            </div>

            {/* Select from Existing Repositories */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Select Repository
                </label>
                <Select onValueChange={(repoId) => {
                  const selectedRepo = allRepositories?.find(r => r.id === repoId);
                  if (selectedRepo) {
                    linkExistingRepoMutation.mutate(selectedRepo.id);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a repository..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allRepositories?.filter(repo => 
                      // Filter out repositories already linked to this project
                      !repositories?.some(projRepo => projRepo.id === repo.id)
                    ).map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        <div className="flex items-center gap-2">
                          <Github className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{repo.name}</div>
                            {repo.description && (
                              <div className="text-xs text-gray-500">{repo.description}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {allRepositories?.filter(repo => 
                !repositories?.some(projRepo => projRepo.id === repo.id)
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Github className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No available repositories to link</p>
                  <p className="text-xs">All repositories are already linked</p>
                  <Link href="/repositories">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsRepoDialogOpen(false)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Repository
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRepoDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Container Dialog */}
        <Dialog open={isContainerDialogOpen} onOpenChange={setIsContainerDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Container</DialogTitle>
            </DialogHeader>
            <Form {...containerForm}>
              <form onSubmit={containerForm.handleSubmit(onContainerSubmit)} className="space-y-4">
                <FormField
                  control={containerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-container" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={containerForm.control}
                  name="imageTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="latest" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={containerForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task to associate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {tasks?.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={containerForm.control}
                  name="logs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Logs (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Container initialization logs..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsContainerDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createContainerMutation.isPending}
                  >
                    {createContainerMutation.isPending ? "Creating..." : "Create Container"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
