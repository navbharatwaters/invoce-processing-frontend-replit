// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  files;
  settings;
  analytics;
  currentUserId;
  currentFileId;
  currentSettingsId;
  currentAnalyticsId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.files = /* @__PURE__ */ new Map();
    this.settings = /* @__PURE__ */ new Map();
    this.analytics = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentSettingsId = 1;
    this.currentAnalyticsId = 1;
    this.createUser({ username: "admin", password: "admin123", rememberMe: false });
    this.addSampleProcessedFile();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = {
      ...insertUser,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    await this.createSettings({
      userId: id,
      webhookUrl: "https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871",
      processingTimeout: 5,
      pollingInterval: 2,
      autoApprove: false,
      enableWebhook: true,
      enableDrive: true
    });
    await this.updateAnalytics(id, {
      userId: id,
      totalFiles: 0,
      approvedWithoutChanges: 0,
      modifiedBeforeApproval: 0,
      monthlyData: [],
      recentActivity: []
    });
    return user;
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getFile(id) {
    return this.files.get(id);
  }
  async getFiles(userId) {
    return Array.from(this.files.values()).filter((file) => file.userId === userId);
  }
  async getFilesByUserId(userId) {
    return Array.from(this.files.values()).filter((file) => file.userId === userId);
  }
  async getAllFiles() {
    return Array.from(this.files.values());
  }
  async createFile(fileData) {
    const id = this.currentFileId++;
    const file = {
      ...fileData,
      id,
      status: "uploading",
      progress: 0,
      excelData: null,
      modifiedData: null,
      isApproved: false,
      driveFileId: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.files.set(id, file);
    return file;
  }
  async updateFile(id, fileData) {
    const file = this.files.get(id);
    if (!file) throw new Error("File not found");
    const updatedData = { ...fileData };
    if (updatedData.excelData && Array.isArray(updatedData.excelData)) {
      updatedData.excelData = updatedData.excelData;
    }
    const updatedFile = { ...file, ...updatedData, updatedAt: /* @__PURE__ */ new Date() };
    this.files.set(id, updatedFile);
    console.log(`Updated file ${id} with excelData:`, updatedFile.excelData ? "Yes" : "No", "Status:", updatedFile.status);
    return updatedFile;
  }
  async deleteFile(id) {
    this.files.delete(id);
  }
  async getSettings(userId) {
    return Array.from(this.settings.values()).find((s) => s.userId === userId);
  }
  async createSettings(settingsData) {
    const id = this.currentSettingsId++;
    const settings2 = {
      ...settingsData,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.settings.set(id, settings2);
    return settings2;
  }
  async updateSettings(userId, settingsData) {
    const settings2 = Array.from(this.settings.values()).find((s) => s.userId === userId);
    if (!settings2) throw new Error("Settings not found");
    const updatedSettings = { ...settings2, ...settingsData, updatedAt: /* @__PURE__ */ new Date() };
    this.settings.set(settings2.id, updatedSettings);
    return updatedSettings;
  }
  async getAnalytics(userId) {
    return Array.from(this.analytics.values()).find((a) => a.userId === userId);
  }
  async updateAnalytics(userId, analyticsData) {
    const existing = Array.from(this.analytics.values()).find((a) => a.userId === userId);
    if (!existing) {
      const id = this.currentAnalyticsId++;
      const analytics2 = {
        id,
        userId,
        totalFiles: 0,
        approvedWithoutChanges: 0,
        modifiedBeforeApproval: 0,
        monthlyData: null,
        recentActivity: null,
        updatedAt: /* @__PURE__ */ new Date(),
        ...analyticsData
      };
      this.analytics.set(id, analytics2);
      return analytics2;
    }
    const updatedAnalytics = { ...existing, ...analyticsData, updatedAt: /* @__PURE__ */ new Date() };
    this.analytics.set(existing.id, updatedAnalytics);
    return updatedAnalytics;
  }
  async addSampleProcessedFile() {
    setTimeout(async () => {
      const sampleExcelData = [
        ["item_code", "item_description", "hsn_code", "color", "quantity", "uom", "unit_price", "net_amount", "tax_amount", "po_no", "po_date", "buyer_name", "buyer_address", "buyer_gst_no", "seller_name", "seller_address", "seller_gst_no", "currency", "delivery_method", "ship_to_delivery_terms"],
        ["659NTH45", "ART # 8892 TEX 18 FILAMENT", "54011000", "", "20", "CON", "39.24", "745.56", "44.7", "25906562", "04/10/2023", "Shahi Exports Pvt. Ltd.", "35, 37/1B, 43/2 & 43/3, Arekere, Bannerghatta Road", "29AAJCS1175L1ZU", "VARDHMAN YARNS AND THREADS LIMITED", "BUILDING NO.101 & 102, JB KAVAL, KHB COLONY", "29AACCV2554K2ZY", "INR", "COURIER", "EX-WORKS"],
        ["W14495", "540111000", "53", "CN5", "72.78", "3703.65", "444.3", "4147.41", "4200514164", "11-Dec-23", "ARVIND LIMITE", "ARVIND LIMITE Bangalore", "560059", "India", "29AAKCA3996L1Z8", "0.0", "28AAKCA3996L1ZP", "KARNATAKA", "INR", "180 days"],
        ["T14495", "540111000", "53", "CN5", "72.78", "3703.65", "444.3", "4147.41", "4200514164", "11-Dec-23", "ARVIND LIMITE", "ARVIND LIMITE Bangalore", "560059", "India", "29AAKCA3996L1Z8", "0.0", "28AAKCA3996L1ZP", "KARNATAKA", "INR", "180 days"],
        ["318532", "540111000", "53", "CN5", "72.78", "3703.65", "444.3", "4147.41", "4200514164", "11-Dec-23", "ARVIND LIMITE", "ARVIND LIMITE Bangalore", "560059", "India", "29AAKCA3996L1Z8", "0.0", "28AAKCA3996L1ZP", "KARNATAKA", "INR", "180 days"]
      ];
      const sampleFile = await this.createFile({
        userId: 1,
        originalName: "25906562.pdf",
        fileName: "sample_processed_file",
        fileType: "application/pdf",
        fileSize: 16876
      });
      await this.updateFile(sampleFile.id, {
        status: "complete",
        progress: 100,
        excelData: sampleExcelData
      });
      console.log("Sample processed file created with extracted data");
    }, 500);
  }
};
var storage = new MemStorage();

// server/routes.ts
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rememberMe: boolean("remember_me").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("uploading"),
  // uploading, processing, extracting, complete, error
  progress: integer("progress").default(0),
  webhookUrl: text("webhook_url"),
  excelData: jsonb("excel_data"),
  modifiedData: jsonb("modified_data"),
  isApproved: boolean("is_approved").default(false),
  driveFileId: text("drive_file_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  webhookUrl: text("webhook_url").default("https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871"),
  processingTimeout: integer("processing_timeout").default(5),
  pollingInterval: integer("polling_interval").default(2),
  autoApprove: boolean("auto_approve").default(false),
  enableWebhook: boolean("enable_webhook").default(true),
  enableDrive: boolean("enable_drive").default(true),
  driveFolderId: text("drive_folder_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalFiles: integer("total_files").default(0),
  approvedWithoutChanges: integer("approved_without_changes").default(0),
  modifiedBeforeApproval: integer("modified_before_approval").default(0),
  monthlyData: jsonb("monthly_data"),
  recentActivity: jsonb("recent_activity"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  rememberMe: true
});
var insertFileSchema = createInsertSchema(files).pick({
  originalName: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  webhookUrl: true
});
var insertSettingsSchema = createInsertSchema(settings).pick({
  webhookUrl: true,
  processingTimeout: true,
  pollingInterval: true,
  autoApprove: true,
  enableWebhook: true,
  enableDrive: true,
  driveFolderId: true
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }
  const upload = multer({
    dest: "uploads/",
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"), false);
      }
    }
  });
  app2.get("/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join("uploads", filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      const files2 = await storage.getAllFiles();
      const fileRecord = files2.find((f) => f.fileName === filename);
      if (fileRecord) {
        res.setHeader("Content-Type", fileRecord.fileType);
        res.setHeader("Content-Disposition", `inline; filename="${fileRecord.originalName}"`);
      } else {
        if (filename.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) {
          res.setHeader("Content-Type", "application/pdf");
        } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
          res.setHeader("Content-Type", "image/jpeg");
        } else if (filePath.match(/\.png$/i)) {
          res.setHeader("Content-Type", "image/png");
        }
      }
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      res.status(500).json({ message: "Error serving file" });
    }
  });
  const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = insertUserSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1e3;
      }
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const settings2 = await storage.getSettings(req.session.userId);
      const webhookUrl = settings2?.webhookUrl || "https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871";
      console.log("Using webhook URL:", webhookUrl);
      console.log(`Using webhook URL: ${webhookUrl}`);
      if (webhookUrl.includes("navbharatwater.one")) {
        console.warn("Warning: Using navbharatwater.one webhook URL which may not be properly configured yet.");
      }
      const file = await storage.createFile({
        userId: req.session.userId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        webhookUrl
      });
      if (settings2?.enableWebhook) {
        processFileWithWebhook(file.id, req.file, webhookUrl).catch(console.error);
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  });
  app2.get("/api/files", requireAuth, async (req, res) => {
    try {
      const files2 = await storage.getFilesByUserId(req.session.userId);
      res.json(files2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
  app2.get("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      if (!file || file.userId !== req.session.userId) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });
  app2.patch("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const { modifiedData } = req.body;
      console.log("Updating file", fileId, "with data length:", modifiedData?.length);
      console.log("Modified data preview:", JSON.stringify(modifiedData?.slice(0, 2)));
      const file = await storage.getFile(fileId);
      if (!file || file.userId !== req.session.userId) {
        return res.status(404).json({ message: "File not found" });
      }
      const updatedFile = await storage.updateFile(fileId, {
        excelData: modifiedData,
        modifiedData
      });
      console.log("File updated successfully with excelData length:", updatedFile.excelData?.length);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });
  app2.post("/api/files/:id/approve", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      if (!file || file.userId !== req.session.userId) {
        return res.status(404).json({ message: "File not found" });
      }
      const updatedFile = await storage.updateFile(fileId, { isApproved: true });
      const settings2 = await storage.getSettings(req.session.userId);
      if (settings2?.enableDrive) {
        await storage.updateFile(fileId, { driveFileId: `drive_${Date.now()}` });
      }
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve file" });
    }
  });
  app2.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings2 = await storage.getSettings(req.session.userId);
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings2 = await storage.updateSettings(req.session.userId, validatedData);
      res.json(settings2);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });
  app2.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const files2 = await storage.getFiles(req.session.userId);
      const totalFiles = files2.length;
      const completedFiles = files2.filter((f) => f.status === "complete");
      const approvedFiles = files2.filter((f) => f.isApproved === true).length;
      const modifiedFiles = files2.filter((f) => f.modifiedData !== null).length;
      const approvedWithoutChanges = approvedFiles - modifiedFiles;
      const monthlyData = [];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentDate = /* @__PURE__ */ new Date();
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        const monthFiles = files2.filter((f) => {
          const fileDate = new Date(f.createdAt || f.updatedAt);
          return fileDate.getMonth() === targetMonth && fileDate.getFullYear() === targetYear;
        });
        monthlyData.push({
          month: months[targetMonth],
          files: monthFiles.length,
          value: Math.min(100, monthFiles.length / Math.max(1, totalFiles) * 100 * 6)
          // Scale for visual
        });
      }
      const analytics2 = {
        totalFiles,
        approvedWithoutChanges,
        modifiedBeforeApproval: modifiedFiles,
        monthlyData,
        // Processing accuracy based on completed files
        processingAccuracy: completedFiles.length > 0 ? Math.round(approvedWithoutChanges / completedFiles.length * 100) : 0,
        // Average processing time (mock for now)
        avgProcessingTime: "2.3 minutes"
      };
      res.json(analytics2);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  async function processFileWithWebhook(fileId, file, webhookUrl) {
    try {
      await storage.updateFile(fileId, {
        status: "uploading",
        progress: 25
      });
      const fileBuffer = await fs.promises.readFile(file.path);
      console.log(`Sending binary file to webhook: ${webhookUrl}`);
      console.log(`Original filename: ${file.originalname}`);
      console.log(`File: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`);
      console.log(`Headers being sent:`);
      console.log(`  X-Original-Name: ${encodeURIComponent(file.originalname)}`);
      console.log(`  X-Filename: ${file.originalname}`);
      console.log(`  X-File-Name: ${file.originalname}`);
      console.log(`  filename: ${file.originalname}`);
      await storage.updateFile(fileId, {
        status: "processing",
        progress: 50
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18e4);
      const requestId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: fileBuffer,
        headers: {
          "Content-Type": file.mimetype || "application/octet-stream",
          "Content-Length": file.size.toString(),
          "X-Original-Name": encodeURIComponent(file.originalname),
          "X-Filename": file.originalname,
          "X-File-Name": file.originalname,
          // Multiple ways to pass filename
          "filename": file.originalname,
          "original-filename": file.originalname,
          "X-File-Type": file.mimetype || "application/octet-stream",
          "X-Request-ID": requestId,
          "X-File-ID": fileId.toString(),
          "X-Timestamp": (/* @__PURE__ */ new Date()).toISOString(),
          "User-Agent": "Navbharat Waters/1.0",
          "Accept": "application/json, text/plain, */*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log(`Webhook response: ${response.status} ${response.statusText}`);
      await storage.updateFile(fileId, {
        status: "extracting",
        progress: 75
      });
      let excelData = null;
      let responseText = "";
      try {
        responseText = await response.text();
        console.log(`Webhook response for ${file.originalname} (${responseText.length} chars):`, responseText.substring(0, 1e3) + (responseText.length > 1e3 ? "..." : ""));
      } catch (e) {
        console.log("Could not read response body:", e);
      }
      if (response.ok) {
        try {
          const responseData = JSON.parse(responseText);
          console.log("Full webhook response structure:", typeof responseData, Array.isArray(responseData) ? `Array[${responseData.length}]` : "Object");
          console.log("Response keys:", Array.isArray(responseData) ? "Array items" : Object.keys(responseData));
          console.log("Full webhook response (first 2000 chars):", JSON.stringify(responseData, null, 2).substring(0, 2e3));
          if (Array.isArray(responseData)) {
            console.log("Processing n8n array response with", responseData.length, "items");
            if (responseData.length > 0 && Array.isArray(responseData[0])) {
              console.log("n8n returned table format (array of arrays) - using directly");
              excelData = responseData;
            } else if (responseData.length > 0 && typeof responseData[0] === "object" && responseData[0] !== null) {
              console.log("n8n returned array of objects - converting to table");
              console.log("Sample object structure:", JSON.stringify(responseData[0], null, 2));
              const headers = Object.keys(responseData[0]);
              console.log("Column headers from n8n:", headers);
              const tableRows = responseData.map(
                (item) => headers.map((header) => {
                  const value = item[header];
                  if (value === null || value === void 0) return "";
                  if (typeof value === "object") return JSON.stringify(value);
                  return String(value).trim();
                })
              );
              excelData = [headers, ...tableRows];
              console.log(`Converted to table: ${excelData.length} rows x ${headers.length} columns`);
              console.log("Headers:", headers);
              console.log("First data row:", tableRows[0]);
              console.log("Sample of all data:");
              excelData.slice(0, 5).forEach((row, i) => {
                console.log(`Row ${i}:`, row);
              });
            } else {
              console.log("Unexpected n8n array format - using fallback");
              excelData = null;
            }
          } else if (typeof responseData === "object" && responseData !== null) {
            console.log("Processing object response");
            excelData = responseData.excelData || responseData.data || responseData.result || responseData.output || responseData.extractedData || responseData.table || responseData.rows || responseData.tableData || responseData.spreadsheet || null;
            if (!excelData) {
              console.log("Converting main response object to Excel format");
              console.log("Response object keys:", Object.keys(responseData));
              let tableData = null;
              if (responseData.table || responseData.rows || responseData.tableData || responseData.spreadsheet) {
                tableData = responseData.table || responseData.rows || responseData.tableData || responseData.spreadsheet;
                console.log("Found table data in main response:", Array.isArray(tableData) ? `${tableData.length} rows` : typeof tableData);
              }
              if (!tableData && (responseData.csv || responseData.csvData)) {
                const csvText = responseData.csv || responseData.csvData;
                if (typeof csvText === "string") {
                  console.log("Found CSV data in main response, parsing...");
                  tableData = csvText.split("\n").map((row) => row.split(",").map((cell) => cell.trim()));
                }
              }
              if (!tableData && Array.isArray(responseData) && responseData.length > 0 && Array.isArray(responseData[0])) {
                console.log("Main response appears to be a table array");
                tableData = responseData;
              }
              if (tableData && Array.isArray(tableData) && tableData.length > 0) {
                excelData = tableData;
                console.log(`Using structured table data with ${tableData.length} rows`);
              } else {
                console.log("No structured table found, extracting all fields from main object");
                const extractedFields = {};
                const flattenObject = (obj, prefix = "") => {
                  for (const [key, value] of Object.entries(obj)) {
                    const fieldName = prefix ? `${prefix}_${key}` : key;
                    if (value === null || value === void 0) {
                      extractedFields[fieldName] = "";
                    } else if (typeof value === "object" && !Array.isArray(value)) {
                      flattenObject(value, fieldName);
                    } else if (Array.isArray(value)) {
                      extractedFields[fieldName] = value.join(", ");
                    } else {
                      extractedFields[fieldName] = String(value);
                    }
                  }
                };
                flattenObject(responseData);
                const headers = Object.keys(extractedFields);
                console.log(`Extracted ${headers.length} fields from main object:`, headers);
                excelData = [
                  ["Field", "Value"],
                  ...headers.map((header) => [
                    header.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/\b\w/g, (l) => l.toUpperCase()).trim(),
                    extractedFields[header] || ""
                  ])
                ];
              }
            }
          }
          if (excelData && Array.isArray(excelData)) {
            console.log(`Extracted data from webhook for ${file.originalname}: ${excelData.length} rows, ${excelData[0]?.length || 0} columns`);
            console.log("First few rows:", excelData.slice(0, 3));
          } else {
            console.log(`Extracted data from webhook for ${file.originalname}: null`);
          }
        } catch (e) {
          console.log("Webhook response is not valid JSON, using fallback data:", e);
        }
      } else {
        console.log(`Webhook failed with ${response.status}: ${responseText || response.statusText}`);
        if (response.status === 524) {
          console.log("Webhook timed out - n8n workflow may be taking too long to process");
        }
      }
      if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        console.log("No valid data from webhook, document processing failed");
        await storage.updateFile(fileId, {
          status: "error",
          progress: 100,
          excelData: [
            ["Status", "Message"],
            ["Error", "Document processing failed"],
            ["Suggestion", "Please try uploading again or check document format"]
          ]
        });
        return;
      }
      await storage.updateFile(fileId, {
        status: "complete",
        progress: 100,
        excelData
      });
      console.log(`File processing completed for ${file.originalname}`);
    } catch (error) {
      console.error(`Webhook processing error for ${file.originalname}:`, error);
      let errorMessage = "Processing failed";
      if (error?.name === "AbortError") {
        errorMessage = "Processing timed out (3 minutes) - your n8n workflow may be taking too long";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      await storage.updateFile(fileId, {
        status: "error",
        progress: 100,
        excelData: [
          ["Status", "Message"],
          ["Error", errorMessage],
          ["Filename", file.originalname],
          ["Webhook URL", webhookUrl],
          ["Suggestion", "Check your n8n workflow or try a smaller file"]
        ]
      });
      console.log(`File processing failed for ${file.originalname}: ${errorMessage}`);
    }
  }
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
