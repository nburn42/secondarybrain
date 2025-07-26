import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "awaiting_approval", 
  "approved",
  "rejected",
  "running",
  "completed",
  "failed"
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium", 
  "high",
  "critical"
]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const githubRepositories = pgTable("github_repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  estimatedHours: integer("estimated_hours"),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
});

export const approvalQueue = pgTable("approval_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  isApproved: boolean("is_approved"),
  notes: text("notes"),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  repositories: many(githubRepositories),
  tasks: many(tasks),
}));

export const githubRepositoriesRelations = relations(githubRepositories, ({ one }) => ({
  project: one(projects, {
    fields: [githubRepositories.projectId],
    references: [projects.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  approvalQueue: many(approvalQueue),
}));

export const approvalQueueRelations = relations(approvalQueue, ({ one }) => ({
  task: one(tasks, {
    fields: [approvalQueue.taskId],
    references: [tasks.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGithubRepositorySchema = createInsertSchema(githubRepositories).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  completedAt: true,
});

export const insertApprovalQueueSchema = createInsertSchema(approvalQueue).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertGithubRepository = z.infer<typeof insertGithubRepositorySchema>;
export type GithubRepository = typeof githubRepositories.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertApprovalQueue = z.infer<typeof insertApprovalQueueSchema>;
export type ApprovalQueue = typeof approvalQueue.$inferSelect;

// Extended types with relations
export type ProjectWithRelations = Project & {
  repositories: GithubRepository[];
  tasks: Task[];
};

export type TaskWithProject = Task & {
  project: Project;
};

export type ApprovalQueueWithTask = ApprovalQueue & {
  task: TaskWithProject;
};
