import { 
  projects, 
  githubRepositories, 
  tasks, 
  taskItems,
  type Project, 
  type InsertProject,
  type GithubRepository,
  type InsertGithubRepository,
  type InsertGlobalRepository,
  type Task,
  type InsertTask,
  type TaskItem,
  type InsertTaskItem,
  type ProjectWithRelations,
  type TaskWithProject,
  type TaskWithChildren,
  type TaskWithItems,
  type TaskItemWithChildren,
  type TaskWithProjectAndChildren
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<ProjectWithRelations[]>;
  getProject(id: string): Promise<ProjectWithRelations | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // GitHub Repositories
  getAllRepositories(): Promise<GithubRepository[]>;
  getRepositoriesByProject(projectId: string): Promise<GithubRepository[]>;
  createRepository(repository: InsertGithubRepository): Promise<GithubRepository>;
  createGlobalRepository(repository: InsertGlobalRepository): Promise<GithubRepository>;
  deleteRepository(id: string): Promise<void>;

  // Tasks
  getTasks(): Promise<TaskWithProject[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<TaskWithProject | undefined>;
  getTaskWithChildren(id: string): Promise<TaskWithChildren | undefined>;
  getTaskWithItems(id: string): Promise<TaskWithItems | undefined>;
  getParentTasks(projectId?: string): Promise<TaskWithProjectAndChildren[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Task Items
  getTaskItems(taskId: string): Promise<TaskItemWithChildren[]>;
  getTaskItem(id: string): Promise<TaskItem | undefined>;
  createTaskItem(taskItem: InsertTaskItem): Promise<TaskItem>;
  updateTaskItem(id: string, taskItem: Partial<InsertTaskItem>): Promise<TaskItem>;
  deleteTaskItem(id: string): Promise<void>;

  // Approvals (from task items)
  getPendingApprovals(): Promise<TaskItem[]>;
  processTaskItemApproval(id: string, isApproved: boolean, rejectionReason?: string): Promise<void>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalProjects: number;
    pendingApprovals: number;
    completedTasks: number;
    runningTasks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<ProjectWithRelations[]> {
    return await db.query.projects.findMany({
      with: {
        repositories: true,
        tasks: true,
      },
      orderBy: [desc(projects.createdAt)],
    });
  }

  async getProject(id: string): Promise<ProjectWithRelations | undefined> {
    return await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        repositories: true,
        tasks: true,
      },
    });
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProject(id: string, insertProject: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({
        ...insertProject,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getAllRepositories(): Promise<GithubRepository[]> {
    return await db.select().from(githubRepositories).orderBy(desc(githubRepositories.createdAt));
  }

  async getRepositoriesByProject(projectId: string): Promise<GithubRepository[]> {
    return await db
      .select()
      .from(githubRepositories)
      .where(eq(githubRepositories.projectId, projectId))
      .orderBy(desc(githubRepositories.createdAt));
  }

  async createRepository(insertRepository: InsertGithubRepository): Promise<GithubRepository> {
    const [repository] = await db
      .insert(githubRepositories)
      .values(insertRepository)
      .returning();
    return repository;
  }

  async createGlobalRepository(insertRepository: InsertGlobalRepository): Promise<GithubRepository> {
    const [repository] = await db
      .insert(githubRepositories)
      .values({
        ...insertRepository,
        projectId: null, // Global repository not tied to specific project
      })
      .returning();
    return repository;
  }

  async deleteRepository(id: string): Promise<void> {
    await db.delete(githubRepositories).where(eq(githubRepositories.id, id));
  }

  async getTasks(): Promise<TaskWithProject[]> {
    return await db.query.tasks.findMany({
      with: {
        project: true,
      },
      orderBy: [desc(tasks.createdAt)],
    });
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<TaskWithProject | undefined> {
    return await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        project: true,
      },
    });
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        updatedAt: new Date(),
      })
      .returning();

    return task;
  }

  async updateTask(id: string, insertTask: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        ...insertTask,
        updatedAt: new Date(),
        ...(insertTask.status === "completed" && { completedAt: new Date() }),
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskWithChildren(id: string): Promise<TaskWithChildren | undefined> {
    return await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        children: {
          orderBy: [desc(tasks.createdAt)],
        },
      },
    });
  }

  async getTaskWithItems(id: string): Promise<TaskWithItems | undefined> {
    return await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        taskItems: {
          with: {
            children: true,
          },
          orderBy: [desc(taskItems.createdAt)],
        },
      },
    });
  }

  async getParentTasks(projectId?: string): Promise<TaskWithProjectAndChildren[]> {
    const whereClause = projectId 
      ? and(isNull(tasks.parentId), eq(tasks.projectId, projectId))
      : isNull(tasks.parentId);

    return await db.query.tasks.findMany({
      where: whereClause,
      with: {
        project: true,
        children: {
          orderBy: [desc(tasks.createdAt)],
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });
  }

  async getTaskItems(taskId: string): Promise<TaskItemWithChildren[]> {
    return await db.query.taskItems.findMany({
      where: and(eq(taskItems.taskId, taskId), isNull(taskItems.parentId)),
      with: {
        children: {
          orderBy: [desc(taskItems.createdAt)],
        },
      },
      orderBy: [desc(taskItems.createdAt)],
    });
  }

  async getTaskItem(id: string): Promise<TaskItem | undefined> {
    return await db.query.taskItems.findFirst({
      where: eq(taskItems.id, id),
    });
  }

  async createTaskItem(insertTaskItem: InsertTaskItem): Promise<TaskItem> {
    const [taskItem] = await db
      .insert(taskItems)
      .values({
        ...insertTaskItem,
        updatedAt: new Date(),
      })
      .returning();

    // Task item approval logic is now handled by the needsApproval flag

    return taskItem;
  }

  async updateTaskItem(id: string, insertTaskItem: Partial<InsertTaskItem>): Promise<TaskItem> {
    const [taskItem] = await db
      .update(taskItems)
      .set({
        ...insertTaskItem,
        updatedAt: new Date(),
      })
      .where(eq(taskItems.id, id))
      .returning();
    return taskItem;
  }

  async deleteTaskItem(id: string): Promise<void> {
    await db.delete(taskItems).where(eq(taskItems.id, id));
  }

  async getPendingApprovals(): Promise<TaskItem[]> {
    return await db
      .select()
      .from(taskItems)
      .where(and(
        eq(taskItems.needsApproval, true),
        isNull(taskItems.isApproved)
      ))
      .orderBy(desc(taskItems.createdAt));
  }

  async processTaskItemApproval(id: string, isApproved: boolean, rejectionReason?: string): Promise<void> {
    // Update the task item with approval status
    await db
      .update(taskItems)
      .set({
        isApproved,
        rejectionReason: isApproved ? null : rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(taskItems.id, id));

    // If rejected, create a new rejection task item
    if (!isApproved && rejectionReason) {
      const originalItem = await this.getTaskItem(id);
      if (originalItem) {
        await this.createTaskItem({
          taskId: originalItem.taskId,
          parentId: originalItem.id,
          type: "rejection",
          title: "Rejection Feedback",
          content: rejectionReason,
          needsApproval: false,
        });
      }
    }
  }

  async getDashboardStats(): Promise<{
    totalProjects: number;
    pendingApprovals: number;
    completedTasks: number;
    runningTasks: number;
  }> {
    const [projectsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects);

    const [pendingApprovalsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskItems)
      .where(and(
        eq(taskItems.needsApproval, true),
        isNull(taskItems.isApproved)
      ));

    const [completedTasksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, "completed"));

    const [runningTasksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, "running"));

    return {
      totalProjects: Number(projectsCount.count),
      pendingApprovals: Number(pendingApprovalsCount.count),
      completedTasks: Number(completedTasksCount.count),
      runningTasks: Number(runningTasksCount.count),
    };
  }
}

export const storage = new DatabaseStorage();
