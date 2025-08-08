import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "completed",
  "failed"
]);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Firebase UID
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

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
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const githubRepositories = pgTable("github_repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }), // Optional for global repos
  owner: text("owner"), // Add owner field for GitHub username/org
  url: text("url").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  githubToken: text("github_token"), // Encrypted GitHub personal access token
  isPrivate: boolean("is_private").default(false),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").references(() => tasks.id),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: real("priority").notNull().default(1.0),
  containerId: varchar("container_id").references(() => containers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
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
  chatResponse: text("chat_response"), // Agent's text response
  filePath: text("file_path"),
  fileContent: text("file_content"),
  needsApproval: boolean("needs_approval").default(false),
  isApproved: boolean("is_approved"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  repositories: many(githubRepositories),
  tasks: many(tasks),
  containers: many(containers),
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
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
  }),
  children: many(tasks),
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
    relationName: "parentTaskItem",
  }),
  children: many(taskItems, {
    relationName: "parentTaskItem",
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

// Global repository schema for repository management (extends GitHub repository with owner field)
export const insertGlobalRepositorySchema = insertGithubRepositorySchema.extend({
  owner: z.string().min(1, "Owner is required"),
}).omit({
  projectId: true, // Remove projectId requirement for global repository management
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type InsertGithubRepository = z.infer<typeof insertGithubRepositorySchema>;
export type GithubRepository = typeof githubRepositories.$inferSelect;

export type InsertGlobalRepository = z.infer<typeof insertGlobalRepositorySchema>;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskItem = z.infer<typeof insertTaskItemSchema>;
export type TaskItem = typeof taskItems.$inferSelect;

// Extended types with relations
export type ProjectWithRelations = Project & {
  repositories: GithubRepository[];
  tasks: Task[];
};

export type GithubRepositoryWithProject = GithubRepository & {
  project: Project | null;
};

export type TaskWithProject = Task & {
  project: Project;
};

export type TaskWithChildren = Task & {
  children: Task[];
};

export type TaskItemWithChildren = TaskItem & {
  children: TaskItem[];
};

export type TaskWithItems = Task & {
  taskItems: TaskItemWithChildren[];
};

export type TaskWithProjectAndChildren = Task & {
  project: Project;
  children: Task[];
};

// Container schema for GKE containers
export const containers = pgTable("containers", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name"),
  imageTag: text("image_tag").default("latest"),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "paused"] }).notNull().default("pending"),
  jwtToken: text("jwt_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  exitCode: integer("exit_code"),
});

export const containerRelations = relations(containers, ({ one }) => ({
  project: one(projects, { fields: [containers.projectId], references: [projects.id] }),
}));

export const insertContainerSchema = createInsertSchema(containers).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  jwtToken: true,
});

export type Container = typeof containers.$inferSelect;
export type InsertContainer = z.infer<typeof insertContainerSchema>;
