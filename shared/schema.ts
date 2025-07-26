import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
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

export const taskItemTypeEnum = pgEnum("task_item_type", [
  "planning",
  "tool_call",
  "file_creation",
  "approval_request",
  "rejection",
  "completion"
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
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: real("priority").notNull().default(1.0),
  estimatedHours: integer("estimated_hours"),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
});

export const taskItems = pgTable("task_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").references(() => taskItems.id),
  type: taskItemTypeEnum("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  toolName: text("tool_name"),
  toolParameters: jsonb("tool_parameters"),
  toolResponse: jsonb("tool_response"),
  filePath: text("file_path"),
  fileContent: text("file_content"),
  needsApproval: boolean("needs_approval").default(false),
  isApproved: boolean("is_approved"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  taskItems: many(taskItems),
}));

export const taskItemsRelations = relations(taskItems, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskItems.taskId],
    references: [tasks.id],
  }),
  parent: one(taskItems, {
    fields: [taskItems.parentId],
    references: [taskItems.id],
  }),
  children: many(taskItems),
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
}).extend({
  priority: z.number().min(0).max(10).default(1.0),
});

export const insertTaskItemSchema = createInsertSchema(taskItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertGithubRepository = z.infer<typeof insertGithubRepositorySchema>;
export type GithubRepository = typeof githubRepositories.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskItem = z.infer<typeof insertTaskItemSchema>;
export type TaskItem = typeof taskItems.$inferSelect;

// Extended types with relations
export type ProjectWithRelations = Project & {
  repositories: GithubRepository[];
  tasks: Task[];
};

export type TaskWithProject = Task & {
  project: Project;
};

export type TaskItemWithChildren = TaskItem & {
  children: TaskItem[];
};

export type TaskWithItems = Task & {
  taskItems: TaskItemWithChildren[];
};
