import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, GitBranch, Trash2, ExternalLink, FolderPlus, Key, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertGlobalRepositorySchema, type InsertGlobalRepository, type GithubRepository } from "@shared/schema";

export default function Repositories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepository | null>(null);
  const { toast } = useToast();

  const { data: repositories = [], isLoading } = useQuery<GithubRepository[]>({
    queryKey: ["/api/repositories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertGlobalRepository) => 
      apiRequest("POST", "/api/repositories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Repository created",
        description: "GitHub repository has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create repository. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/repositories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Repository deleted",
        description: "Repository has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete repository.",
        variant: "destructive",
      });
    },
  });

  const authMutation = useMutation({
    mutationFn: ({ id, githubToken, isPrivate }: { id: string; githubToken: string; isPrivate: boolean }) =>
      apiRequest("PUT", `/api/repositories/${id}/auth`, { githubToken, isPrivate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setIsAuthDialogOpen(false);
      setSelectedRepo(null);
      authForm.reset();
      toast({
        title: "Authentication updated",
        description: "GitHub authentication has been configured successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update authentication. Please check your token.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertGlobalRepository>({
    resolver: zodResolver(insertGlobalRepositorySchema),
    defaultValues: {
      name: "",
      owner: "",
      url: "",
      description: "",
    },
  });

  const authForm = useForm<{ githubToken: string; isPrivate: boolean }>({
    defaultValues: {
      githubToken: "",
      isPrivate: false,
    },
  });

  const onSubmit = (data: InsertGlobalRepository) => {
    createMutation.mutate(data);
  };

  const onAuthSubmit = (data: { githubToken: string; isPrivate: boolean }) => {
    if (selectedRepo) {
      authMutation.mutate({
        id: selectedRepo.id,
        githubToken: data.githubToken,
        isPrivate: data.isPrivate,
      });
    }
  };

  const handleAuthRepo = (repo: GithubRepository) => {
    setSelectedRepo(repo);
    setIsAuthDialogOpen(true);
  };

  const handleUrlChange = (url: string) => {
    // Auto-populate name and owner from GitHub URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const [, owner, name] = match;
      form.setValue("owner", owner);
      form.setValue("name", name.replace(/\.git$/, ""));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Repositories</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Repositories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GitHub Repository</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://github.com/owner/repo"
                          onChange={(e) => {
                            field.onChange(e);
                            handleUrlChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repository Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="repo-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Brief description of the repository"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Repository"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Authentication Dialog */}
        <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>GitHub Authentication</DialogTitle>
            </DialogHeader>
            <Form {...authForm}>
              <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Add your GitHub Personal Access Token to enable private repository access.
                  <br />
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Create a token here →
                  </a>
                </div>
                <FormField
                  control={authForm.control}
                  name="githubToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Personal Access Token</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={authForm.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Private Repository</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This repository requires authentication to clone
                        </p>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAuthDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={authMutation.isPending}>
                    {authMutation.isPending ? "Saving..." : "Save Authentication"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {repositories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first GitHub repository to start managing your code projects.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Repository
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {repositories.map((repo: GithubRepository) => (
            <Card key={repo.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <CardTitle className="text-lg truncate">
                      {repo.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(repo.id)}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {repo.owner && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Badge variant="secondary">{repo.owner}</Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {repo.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on GitHub
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAuthRepo(repo)}
                    title={repo.githubToken ? "Update authentication" : "Add authentication"}
                  >
                    {repo.githubToken ? <Lock className="h-3 w-3 text-green-600" /> : <Key className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}