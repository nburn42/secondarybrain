import { 
  projects, 
  githubRepositories, 
  tasks, 
  taskItems,
  approvalQueue,
  type Project, 
  type InsertProject,
  type GithubRepository,
  type InsertGithubRepository,
  type Task,
  type InsertTask,
  type TaskItem,
  type InsertTaskItem,
  type ApprovalQueue,
  type InsertApprovalQueue,
  type ProjectWithRelations,
  type TaskWithProject,
  type TaskWithItems,
  type TaskItemWithChildren,
  type ApprovalQueueWithTask
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
  getRepositoriesByProject(projectId: string): Promise<GithubRepository[]>;
  createRepository(repository: InsertGithubRepository): Promise<GithubRepository>;
  deleteRepository(id: string): Promise<void>;

  // Tasks
  getTasks(): Promise<TaskWithProject[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<TaskWithProject | undefined>;
  getTaskWithItems(id: string): Promise<TaskWithItems | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Task Items
  getTaskItems(taskId: string): Promise<TaskItemWithChildren[]>;
  getTaskItem(id: string): Promise<TaskItem | undefined>;
  createTaskItem(taskItem: InsertTaskItem): Promise<TaskItem>;
  updateTaskItem(id: string, taskItem: Partial<InsertTaskItem>): Promise<TaskItem>;
  deleteTaskItem(id: string): Promise<void>;

  // Approval Queue
  getApprovalQueue(): Promise<ApprovalQueueWithTask[]>;
  createApprovalRequest(approval: InsertApprovalQueue): Promise<ApprovalQueue>;
  processApproval(id: string, isApproved: boolean, notes?: string, reviewedBy?: string): Promise<void>;
  
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

    // If task requires approval, add to approval queue
    if (insertTask.status === "awaiting_approval") {
      await db.insert(approvalQueue).values({
        taskId: task.id,
      });
    }

    return task;
  }

  async updateTask(id: string, insertTask: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        ...insertTask,
        updatedAt: new Date(),
        ...(insertTask.status === "completed" && { completedAt: new Date() }),
        ...(insertTask.status === "approved" && { approvedAt: new Date() }),
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
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

    // If task item requires approval and creates files, add to approval queue
    if (insertTaskItem.needsApproval && (insertTaskItem.type === "file_creation" || insertTaskItem.type === "tool_call")) {
      await db.insert(approvalQueue).values({
        taskId: insertTaskItem.taskId,
        taskItemId: taskItem.id,
      });
    }

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

  async getApprovalQueue(): Promise<ApprovalQueueWithTask[]> {
    return await db.query.approvalQueue.findMany({
      where: isNull(approvalQueue.reviewedAt),
      with: {
        task: {
          with: {
            project: true,
          },
        },
        taskItem: true,
      },
      orderBy: [desc(approvalQueue.submittedAt)],
    });
  }

  async createApprovalRequest(insertApproval: InsertApprovalQueue): Promise<ApprovalQueue> {
    const [approval] = await db
      .insert(approvalQueue)
      .values(insertApproval)
      .returning();
    return approval;
  }

  async processApproval(id: string, isApproved: boolean, notes?: string, reviewedBy?: string): Promise<void> {
    // Update approval queue
    await db
      .update(approvalQueue)
      .set({
        isApproved,
        notes,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(approvalQueue.id, id));

    // Get the task ID from the approval queue
    const approval = await db.query.approvalQueue.findFirst({
      where: eq(approvalQueue.id, id),
    });

    if (approval) {
      // Update task status
      await db
        .update(tasks)
        .set({
          status: isApproved ? "approved" : "rejected",
          ...(isApproved && { approvedAt: new Date() }),
          ...(!isApproved && { rejectionReason: notes }),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, approval.taskId));
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
      .from(approvalQueue)
      .where(isNull(approvalQueue.reviewedAt));

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
