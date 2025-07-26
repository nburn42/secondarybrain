import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertGithubRepositorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // GitHub Repositories
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
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
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

  // Approval Queue
  app.get("/api/approvals", async (req, res) => {
    try {
      const approvals = await storage.getApprovalQueue();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approval queue" });
    }
  });

  app.post("/api/approvals/:id/process", async (req, res) => {
    try {
      const { isApproved, notes, reviewedBy } = req.body;
      await storage.processApproval(req.params.id, isApproved, notes, reviewedBy);
      res.json({ message: "Approval processed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to process approval" });
    }
  });

  // Submit task for approval
  app.post("/api/tasks/:id/submit-for-approval", async (req, res) => {
    try {
      // Update task status to awaiting_approval
      await storage.updateTask(req.params.id, { status: "awaiting_approval" });
      
      // Add to approval queue
      await storage.createApprovalRequest({ taskId: req.params.id });
      
      res.json({ message: "Task submitted for approval" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit task for approval" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
