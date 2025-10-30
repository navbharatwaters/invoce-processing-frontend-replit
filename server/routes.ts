import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import { insertUserSchema, insertFileSchema, insertSettingsSchema } from "@shared/schema";

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // File upload configuration
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  });

  // Serve uploaded files with proper content types
  app.get('/uploads/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join('uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Find the file in database to get proper content type
      const files = await storage.getAllFiles();
      const fileRecord = files.find(f => f.fileName === filename);
      
      if (fileRecord) {
        res.setHeader('Content-Type', fileRecord.fileType);
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
      } else {
        // Fallback content type detection
        if (filename.includes('pdf') || filePath.toLowerCase().endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.match(/\.png$/i)) {
          res.setHeader('Content-Type', 'image/png');
        }
      }
      
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      res.status(500).json({ message: "Error serving file" });
    }
  });

  // Authentication middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      // Clear the session cookie
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // File upload route
  app.post("/api/files/upload", requireAuth, upload.single('file'), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const settings = await storage.getSettings(req.session.userId!);
      // Use the navbharatwater.one webhook URL as requested
      const webhookUrl = settings?.webhookUrl || "https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871";
      console.log("Using webhook URL:", webhookUrl);
      
      // Log the webhook URL being used
      console.log(`Using webhook URL: ${webhookUrl}`);
      
      // Check if the webhook URL is from navbharatwater.one and warn if it is
      if (webhookUrl.includes('navbharatwater.one')) {
        console.warn('Warning: Using navbharatwater.one webhook URL which may not be properly configured yet.');
      }

      const file = await storage.createFile({
        userId: req.session.userId!,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        webhookUrl,
      });

      // Send file to webhook for processing
      if (settings?.enableWebhook) {
        processFileWithWebhook(file.id, req.file, webhookUrl).catch(console.error);
      }

      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get files
  app.get("/api/files", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const files = await storage.getFilesByUserId(req.session.userId!);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get file by ID
  app.get("/api/files/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file || file.userId !== req.session.userId!) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Update file data
  app.patch("/api/files/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const { modifiedData } = req.body;
      
      console.log('Updating file', fileId, 'with data length:', modifiedData?.length);
      console.log('Modified data preview:', JSON.stringify(modifiedData?.slice(0, 2)));
      
      const file = await storage.getFile(fileId);
      
      if (!file || file.userId !== req.session.userId!) {
        return res.status(404).json({ message: "File not found" });
      }

      const updatedFile = await storage.updateFile(fileId, { 
        excelData: modifiedData,
        modifiedData: modifiedData 
      });
      
      console.log('File updated successfully with excelData length:', updatedFile.excelData?.length);
      res.json(updatedFile);
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Approve and send file
  app.post("/api/files/:id/approve", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file || file.userId !== req.session.userId!) {
        return res.status(404).json({ message: "File not found" });
      }

      const updatedFile = await storage.updateFile(fileId, { isApproved: true });
      
      // Upload to Google Drive if enabled
      const settings = await storage.getSettings(req.session.userId!);
      if (settings?.enableDrive) {
        // Mock Google Drive upload
        await storage.updateFile(fileId, { driveFileId: `drive_${Date.now()}` });
      }

      // Analytics are now calculated dynamically from files in /api/analytics endpoint

      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve file" });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const settings = await storage.getSettings(req.session.userId!);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(req.session.userId!, validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Analytics route - calculate from actual files
  app.get("/api/analytics", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const files = await storage.getFiles(req.session.userId!);
      
      // Calculate analytics from actual files - count all files, not just complete ones
      const totalFiles = files.length; // Count all files uploaded
      const completedFiles = files.filter(f => f.status === 'complete');
      const approvedFiles = files.filter(f => f.isApproved === true).length;
      const modifiedFiles = files.filter(f => f.modifiedData !== null).length;
      const approvedWithoutChanges = approvedFiles - modifiedFiles;
      
      // Calculate monthly processing data from files
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        
        const monthFiles = files.filter(f => {
          const fileDate = new Date(f.createdAt || f.updatedAt);
          return fileDate.getMonth() === targetMonth && 
                 fileDate.getFullYear() === targetYear;
        });
        
        monthlyData.push({
          month: months[targetMonth],
          files: monthFiles.length,
          value: Math.min(100, (monthFiles.length / Math.max(1, totalFiles)) * 100 * 6) // Scale for visual
        });
      }
      
      const analytics = {
        totalFiles,
        approvedWithoutChanges,
        modifiedBeforeApproval: modifiedFiles,
        monthlyData,
        // Processing accuracy based on completed files
        processingAccuracy: completedFiles.length > 0 ? Math.round((approvedWithoutChanges / completedFiles.length) * 100) : 0,
        // Average processing time (mock for now)
        avgProcessingTime: "2.3 minutes"
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // File processing with webhook
  async function processFileWithWebhook(fileId: number, file: any, webhookUrl: string) {
    try {
      // Update to uploading status
      await storage.updateFile(fileId, {
        status: "uploading",
        progress: 25
      });

      // Read file as binary data for webhook
      const fileBuffer = await fs.promises.readFile(file.path);
      
      console.log(`Sending binary file to webhook: ${webhookUrl}`);
      console.log(`Original filename: ${file.originalname}`);
      console.log(`File: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`);
      console.log(`Headers being sent:`);
      console.log(`  X-Original-Name: ${encodeURIComponent(file.originalname)}`);
      console.log(`  X-Filename: ${file.originalname}`);
      console.log(`  X-File-Name: ${file.originalname}`);
      console.log(`  filename: ${file.originalname}`);

      // Update to processing status
      await storage.updateFile(fileId, {
        status: "processing",
        progress: 50
      });

      // Make the webhook request with binary data and longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for processing
      
      // Add unique identifiers to prevent caching issues
      const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: fileBuffer,
        headers: {
          'Content-Type': file.mimetype || 'application/octet-stream',
          'Content-Length': file.size.toString(),
          'X-Original-Name': encodeURIComponent(file.originalname),
          'X-Filename': file.originalname,
          'X-File-Name': file.originalname, // Multiple ways to pass filename
          'filename': file.originalname,
          'original-filename': file.originalname,
          'X-File-Type': file.mimetype || 'application/octet-stream',
          'X-Request-ID': requestId,
          'X-File-ID': fileId.toString(),
          'X-Timestamp': new Date().toISOString(),
          'User-Agent': 'Navbharat Waters/1.0',
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`Webhook response: ${response.status} ${response.statusText}`);

      // Update to extracting status
      await storage.updateFile(fileId, {
        status: "extracting",
        progress: 75
      });

      let excelData = null;
      let responseText = '';

      try {
        responseText = await response.text();
        console.log(`Webhook response for ${file.originalname} (${responseText.length} chars):`, responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
      } catch (e) {
        console.log('Could not read response body:', e);
      }

      if (response.ok) {
        // Try to parse webhook response
        try {
          const responseData = JSON.parse(responseText);
          console.log('Full webhook response structure:', typeof responseData, Array.isArray(responseData) ? `Array[${responseData.length}]` : 'Object');
          console.log('Response keys:', Array.isArray(responseData) ? 'Array items' : Object.keys(responseData));
          console.log('Full webhook response (first 2000 chars):', JSON.stringify(responseData, null, 2).substring(0, 2000));
          
          // Direct n8n webhook response processing - preserve original structure
          if (Array.isArray(responseData)) {
            console.log('Processing n8n array response with', responseData.length, 'items');
            
            // Check if it's already in table format (array of arrays)
            if (responseData.length > 0 && Array.isArray(responseData[0])) {
              console.log('n8n returned table format (array of arrays) - using directly');
              excelData = responseData;
            } else if (responseData.length > 0 && typeof responseData[0] === 'object' && responseData[0] !== null) {
              // n8n returns array of objects - convert to Excel table format
              console.log('n8n returned array of objects - converting to table');
              console.log('Sample object structure:', JSON.stringify(responseData[0], null, 2));
              
              // Extract column headers from first object to maintain order
              const headers = Object.keys(responseData[0]);
              console.log('Column headers from n8n:', headers);
              
              // Convert to table format: [headers, ...data_rows]
              const tableRows = responseData.map((item: any) => 
                headers.map(header => {
                  const value = item[header];
                  if (value === null || value === undefined) return '';
                  if (typeof value === 'object') return JSON.stringify(value);
                  return String(value).trim();
                })
              );
              
              excelData = [headers, ...tableRows];
              
              console.log(`Converted to table: ${excelData.length} rows x ${headers.length} columns`);
              console.log('Headers:', headers);
              console.log('First data row:', tableRows[0]);
              console.log('Sample of all data:');
              excelData.slice(0, 5).forEach((row, i) => {
                console.log(`Row ${i}:`, row);
              });
            } else {
              console.log('Unexpected n8n array format - using fallback');
              excelData = null;
            }
          } else if (typeof responseData === 'object' && responseData !== null) {
            console.log('Processing object response');
            
            // First check for direct table data in various formats
            excelData = responseData.excelData || responseData.data || responseData.result || 
                       responseData.output || responseData.extractedData || responseData.table ||
                       responseData.rows || responseData.tableData || responseData.spreadsheet || null;
            
            // If no direct data, look for various Excel/table formats
            if (!excelData) {
              console.log('Converting main response object to Excel format');
              console.log('Response object keys:', Object.keys(responseData));
              
              // Look for table/spreadsheet data in various formats
              let tableData = null;
              
              // Check for common Excel data formats in main response
              if (responseData.table || responseData.rows || responseData.tableData || responseData.spreadsheet) {
                tableData = responseData.table || responseData.rows || responseData.tableData || responseData.spreadsheet;
                console.log('Found table data in main response:', Array.isArray(tableData) ? `${tableData.length} rows` : typeof tableData);
              }
              
              // Check for CSV data in main response
              if (!tableData && (responseData.csv || responseData.csvData)) {
                const csvText = responseData.csv || responseData.csvData;
                if (typeof csvText === 'string') {
                  console.log('Found CSV data in main response, parsing...');
                  tableData = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
                }
              }
              
              // Check if main response is already an array of arrays (table format)
              if (!tableData && Array.isArray(responseData) && responseData.length > 0 && Array.isArray(responseData[0])) {
                console.log('Main response appears to be a table array');
                tableData = responseData;
              }
              
              // If we found structured table data, use it
              if (tableData && Array.isArray(tableData) && tableData.length > 0) {
                excelData = tableData;
                console.log(`Using structured table data with ${tableData.length} rows`);
              } else {
                // Fallback: extract all fields as field-value pairs
                console.log('No structured table found, extracting all fields from main object');
                
                const extractedFields = {};
                
                // Flatten the entire response object
                const flattenObject = (obj: any, prefix = '') => {
                  for (const [key, value] of Object.entries(obj)) {
                    const fieldName = prefix ? `${prefix}_${key}` : key;
                    
                    if (value === null || value === undefined) {
                      (extractedFields as any)[fieldName] = '';
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                      flattenObject(value, fieldName);
                    } else if (Array.isArray(value)) {
                      (extractedFields as any)[fieldName] = value.join(', ');
                    } else {
                      (extractedFields as any)[fieldName] = String(value);
                    }
                  }
                };
                
                flattenObject(responseData);
                
                const headers = Object.keys(extractedFields);
                console.log(`Extracted ${headers.length} fields from main object:`, headers);
                
                excelData = [
                  ["Field", "Value"],
                  ...headers.map(header => [
                    header.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()).trim(),
                    (extractedFields as any)[header] || ''
                  ])
                ];
              }
            }
          }
          
          if (excelData && Array.isArray(excelData)) {
            console.log(`Extracted data from webhook for ${file.originalname}: ${excelData.length} rows, ${excelData[0]?.length || 0} columns`);
            console.log('First few rows:', excelData.slice(0, 3));
          } else {
            console.log(`Extracted data from webhook for ${file.originalname}: null`);
          }
        } catch (e) {
          console.log('Webhook response is not valid JSON, using fallback data:', e);
        }
      } else {
        console.log(`Webhook failed with ${response.status}: ${responseText || response.statusText}`);
        if (response.status === 524) {
          console.log('Webhook timed out - n8n workflow may be taking too long to process');
        }
      }

      // Only use fallback data if no webhook data at all
      if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        console.log('No valid data from webhook, document processing failed');
        // Mark as error instead of using fallback to avoid confusion
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

      // Update to complete status with extracted data
      await storage.updateFile(fileId, {
        status: "complete",
        progress: 100,
        excelData: excelData
      });

      console.log(`File processing completed for ${file.originalname}`);

    } catch (error: any) {
      console.error(`Webhook processing error for ${file.originalname}:`, error);
      
      let errorMessage = "Processing failed";
      if (error?.name === 'AbortError') {
        errorMessage = "Processing timed out (3 minutes) - your n8n workflow may be taking too long";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mark as error with clear messaging
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

  const httpServer = createServer(app);
  return httpServer;
}
