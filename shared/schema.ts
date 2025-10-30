import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rememberMe: boolean("remember_me").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("uploading"), // uploading, processing, extracting, complete, error
  progress: integer("progress").default(0),
  webhookUrl: text("webhook_url"),
  excelData: jsonb("excel_data"),
  modifiedData: jsonb("modified_data"),
  isApproved: boolean("is_approved").default(false),
  driveFileId: text("drive_file_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  webhookUrl: text("webhook_url").default("https://aiautoeye.app.n8n.cloud/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871"),
  processingTimeout: integer("processing_timeout").default(5),
  pollingInterval: integer("polling_interval").default(2),
  autoApprove: boolean("auto_approve").default(false),
  enableWebhook: boolean("enable_webhook").default(true),
  enableDrive: boolean("enable_drive").default(true),
  driveFolderId: text("drive_folder_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalFiles: integer("total_files").default(0),
  approvedWithoutChanges: integer("approved_without_changes").default(0),
  modifiedBeforeApproval: integer("modified_before_approval").default(0),
  monthlyData: jsonb("monthly_data"),
  recentActivity: jsonb("recent_activity"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  rememberMe: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  originalName: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  webhookUrl: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  webhookUrl: true,
  processingTimeout: true,
  pollingInterval: true,
  autoApprove: true,
  enableWebhook: true,
  enableDrive: true,
  driveFolderId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
