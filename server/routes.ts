import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertGithubRepositorySchema, insertGlobalRepositorySchema, insertTaskItemSchema, insertContainerSchema } from "@shared/schema";
import { generateAgentToken, verifyAgentToken, extractTokenFromRequest } from "./auth";
import { requireAuth, AuthRequest } from "./middleware/auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats (requires auth)
  app.get("/api/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Projects (requires auth - returns only user's projects)
  app.get("/api/projects", requireAuth, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getProjects(req.userId!);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.userId!);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: AuthRequest, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...projectData,
        userId: req.userId!,
      });
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, req.userId!, projectData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      await storage.deleteProject(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // GitHub Repositories
  app.get("/api/repositories", async (req, res) => {
    try {
      const repositories = await storage.getAllRepositories();
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/repositories", async (req, res) => {
    try {
      const validatedData = insertGlobalRepositorySchema.parse(req.body);
      const repository = await storage.createGlobalRepository(validatedData);
      res.status(201).json(repository);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create repository" });
    }
  });

  app.get("/api/projects/:projectId/repositories", async (req, res) => {
    try {
      const repositories = await storage.getRepositoriesByProject(req.params.projectId);
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/projects/:projectId/repositories", async (req, res) => {
    try {
      const repositoryData = insertGithubRepositorySchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      
      // Extract GitHub repo info from URL
      const urlParts = repositoryData.url.split('/');
      const repoName = urlParts[urlParts.length - 1];
      
      const repository = await storage.createRepository({
        ...repositoryData,
        name: repoName,
      });
      res.status(201).json(repository);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid repository data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add repository" });
    }
  });

  app.delete("/api/repositories/:id", async (req, res) => {
    try {
      await storage.deleteRepository(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete repository" });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasksByUser(req.userId!);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByProject(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.get("/api/tasks/:id/children", async (req, res) => {
    try {
      const task = await storage.getTaskWithChildren(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task with children" });
    }
  });

  app.get("/api/parent-tasks", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const parentTasks = await storage.getParentTasks(projectId);
      res.json(parentTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parent tasks" });
    }
  });

  // Agent Authentication
  app.post("/api/projects/:projectId/agent-token", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { taskId } = req.body;

      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Generate JWT token for agent
      const token = generateAgentToken(projectId, taskId);
      
      res.json({ 
        token,
        project_id: projectId,
        task_id: taskId,
        expires_in: 24 * 60 * 60 // 24 hours in seconds
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate agent token" });
    }
  });

  // Protected agent endpoints
  const authenticateAgent = (req: any, res: any, next: any) => {
    const token = extractTokenFromRequest(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.agent = payload;
    next();
  };

  // Agent-specific repository endpoint
  app.get("/api/agent/repositories", authenticateAgent, async (req: any, res) => {
    try {
      const { project_id } = req.agent;
      const repositories = await storage.getRepositoriesByProject(project_id);
      
      // Decrypt GitHub tokens for agent use
      const { decryptToken } = await import('./crypto');
      const reposWithDecryptedTokens = repositories.map(repo => ({
        ...repo,
        githubToken: repo.githubToken ? decryptToken(repo.githubToken) : null
      }));
      
      res.json(reposWithDecryptedTokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  // Repository updates (linking to projects)
  app.put("/api/repositories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedRepo = await storage.updateRepository(id, updateData);
      
      if (!updatedRepo) {
        return res.status(404).json({ message: "Repository not found" });
      }

      res.json(updatedRepo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update repository" });
    }
  });

  // Repository authentication
  app.put("/api/repositories/:id/auth", async (req, res) => {
    try {
      const { id } = req.params;
      const { githubToken, isPrivate } = req.body;

      if (!githubToken) {
        return res.status(400).json({ message: "GitHub token is required" });
      }

      // Encrypt the token before storing
      const { encryptToken } = await import('./crypto');
      const encryptedToken = encryptToken(githubToken);

      const updatedRepo = await storage.updateRepositoryAuth(id, encryptedToken, isPrivate || false);
      
      if (!updatedRepo) {
        return res.status(404).json({ message: "Repository not found" });
      }

      // Return the repository without the encrypted token
      const { githubToken: _, ...safeRepo } = updatedRepo;
      res.json({ ...safeRepo, hasAuth: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update repository authentication" });
    }
  });

  app.post("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task Items
  app.get("/api/tasks/:taskId/items", async (req, res) => {
    try {
      const taskItems = await storage.getTaskItems(req.params.taskId);
      res.json(taskItems);
    } catch (error) {
      console.error("Error fetching task items:", error);
      res.status(500).json({ message: "Failed to fetch task items" });
    }
  });

  app.get("/api/task-items/:id", async (req, res) => {
    try {
      const taskItem = await storage.getTaskItem(req.params.id);
      if (!taskItem) {
        return res.status(404).json({ message: "Task item not found" });
      }
      res.json(taskItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task item" });
    }
  });

  app.post("/api/task-items", async (req, res) => {
    try {
      const taskItemData = insertTaskItemSchema.parse(req.body);
      const taskItem = await storage.createTaskItem(taskItemData);
      res.status(201).json(taskItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task item" });
    }
  });

  app.patch("/api/task-items/:id", async (req, res) => {
    try {
      const taskItemData = insertTaskItemSchema.partial().parse(req.body);
      const taskItem = await storage.updateTaskItem(req.params.id, taskItemData);
      res.json(taskItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task item" });
    }
  });

  app.delete("/api/task-items/:id", async (req, res) => {
    try {
      await storage.deleteTaskItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task item" });
    }
  });

  // Approvals (from task items)
  app.get("/api/approvals", async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/task-items/:id/approve", async (req, res) => {
    try {
      await storage.processTaskItemApproval(req.params.id, true);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve task item" });
    }
  });

  app.post("/api/task-items/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      await storage.processTaskItemApproval(req.params.id, false, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject task item" });
    }
  });

  // Container routes
  app.get("/api/projects/:projectId/containers", async (req, res) => {
    try {
      const containers = await storage.getContainersByProject(req.params.projectId);
      res.json(containers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch containers" });
    }
  });

  app.post("/api/projects/:projectId/containers", async (req, res) => {
    try {
      const containerData = insertContainerSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      
      // Generate JWT token for the container
      const jwtToken = generateAgentToken(containerData.projectId);
      
      const container = await storage.createContainer({
        ...containerData,
        jwtToken,
      });
      
      // Create the actual container in GKE using Kubernetes API
      const { createAgentJob } = await import('./k8s-client');
      
      try {
        await createAgentJob(container.id, containerData.projectId, jwtToken);
        
        // Update container status to running
        await storage.updateContainer(container.id, { status: 'running', startedAt: new Date() });
        
        res.status(201).json({ ...container, status: 'running' });
      } catch (k8sError) {
        console.error('Failed to create Kubernetes job:', k8sError);
        // Update container status to failed
        await storage.updateContainer(container.id, { status: 'failed' });
        throw new Error('Failed to create container in cluster');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid container data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create container" });
    }
  });

  app.get("/api/containers/:id", async (req, res) => {
    try {
      const container = await storage.getContainer(req.params.id);
      if (!container) {
        return res.status(404).json({ message: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch container" });
    }
  });

  app.patch("/api/containers/:id", async (req, res) => {
    try {
      const container = await storage.updateContainer(req.params.id, req.body);
      res.json(container);
    } catch (error) {
      console.error('Error updating container:', error);
      res.status(500).json({ message: "Failed to update container" });
    }
  });

  app.delete("/api/containers/:id", async (req, res) => {
    try {
      // Delete the Kubernetes job first
      const { deleteAgentJob } = await import('./k8s-client');
      try {
        await deleteAgentJob(req.params.id);
      } catch (k8sError) {
        console.error('Failed to delete Kubernetes job:', k8sError);
        // Continue with database deletion even if k8s deletion fails
      }
      
      await storage.deleteContainer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete container" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
