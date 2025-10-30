import { users, files, settings, analytics, type User, type InsertUser, type File, type InsertFile, type Settings, type InsertSettings, type Analytics } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getAllFiles(): Promise<File[]>;
  createFile(file: InsertFile & { userId: number }): Promise<File>;
  updateFile(id: number, file: Partial<File>): Promise<File>;
  deleteFile(id: number): Promise<void>;
  
  // Settings operations
  getSettings(userId: number): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings & { userId: number }): Promise<Settings>;
  updateSettings(userId: number, settings: Partial<Settings>): Promise<Settings>;
  
  // Analytics operations
  getAnalytics(userId: number): Promise<Analytics | undefined>;
  updateAnalytics(userId: number, analytics: Partial<Analytics>): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private settings: Map<number, Settings>;
  private analytics: Map<number, Analytics>;
  private currentUserId: number;
  private currentFileId: number;
  private currentSettingsId: number;
  private currentAnalyticsId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.settings = new Map();
    this.analytics = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentSettingsId = 1;
    this.currentAnalyticsId = 1;
    
    // Create default user
    this.createUser({ username: "admin", password: "admin123", rememberMe: false });
    
    // Add sample processed file with real data from webhook logs
    this.addSampleProcessedFile();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
    };
    this.users.set(id, user);
    
    // Create default settings and analytics
    await this.createSettings({
      userId: id,
      webhookUrl: "https://n8n.bargainpcmart.com/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871",
      processingTimeout: 5,
      pollingInterval: 2,
      autoApprove: false,
      enableWebhook: true,
      enableDrive: true,
    });
    
    await this.updateAnalytics(id, {
      userId: id,
      totalFiles: 0,
      approvedWithoutChanges: 0,
      modifiedBeforeApproval: 0,
      monthlyData: [],
      recentActivity: [],
    });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFiles(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.userId === userId);
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.userId === userId);
  }

  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }

  async createFile(fileData: InsertFile & { userId: number }): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      ...fileData,
      id,
      status: "uploading",
      progress: 0,
      excelData: null,
      modifiedData: null,
      isApproved: false,
      driveFileId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, fileData: Partial<File>): Promise<File> {
    const file = this.files.get(id);
    if (!file) throw new Error("File not found");
    
    // Ensure excelData is properly handled as JSON
    const updatedData = { ...fileData };
    if (updatedData.excelData && Array.isArray(updatedData.excelData)) {
      // Keep the array structure intact
      updatedData.excelData = updatedData.excelData;
    }
    
    const updatedFile = { ...file, ...updatedData, updatedAt: new Date() };
    this.files.set(id, updatedFile);
    console.log(`Updated file ${id} with excelData:`, updatedFile.excelData ? 'Yes' : 'No', 'Status:', updatedFile.status);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(s => s.userId === userId);
  }

  async createSettings(settingsData: InsertSettings & { userId: number }): Promise<Settings> {
    const id = this.currentSettingsId++;
    const settings: Settings = {
      ...settingsData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.settings.set(id, settings);
    return settings;
  }

  async updateSettings(userId: number, settingsData: Partial<Settings>): Promise<Settings> {
    const settings = Array.from(this.settings.values()).find(s => s.userId === userId);
    if (!settings) throw new Error("Settings not found");
    
    const updatedSettings = { ...settings, ...settingsData, updatedAt: new Date() };
    this.settings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  async getAnalytics(userId: number): Promise<Analytics | undefined> {
    return Array.from(this.analytics.values()).find(a => a.userId === userId);
  }

  async updateAnalytics(userId: number, analyticsData: Partial<Analytics>): Promise<Analytics> {
    const existing = Array.from(this.analytics.values()).find(a => a.userId === userId);
    
    if (!existing) {
      const id = this.currentAnalyticsId++;
      const analytics: Analytics = {
        id,
        userId,
        totalFiles: 0,
        approvedWithoutChanges: 0,
        modifiedBeforeApproval: 0,
        monthlyData: null,
        recentActivity: null,
        updatedAt: new Date(),
        ...analyticsData,
      };
      this.analytics.set(id, analytics);
      return analytics;
    }
    
    const updatedAnalytics = { ...existing, ...analyticsData, updatedAt: new Date() };
    this.analytics.set(existing.id, updatedAnalytics);
    return updatedAnalytics;
  }

  private async addSampleProcessedFile() {
    // Wait a bit for user creation to complete
    setTimeout(async () => {
      // Sample data matching your n8n workflow structure
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
        fileSize: 16876,
      });

      await this.updateFile(sampleFile.id, {
        status: "complete",
        progress: 100,
        excelData: sampleExcelData
      });

      console.log("Sample processed file created with extracted data");
    }, 500);
  }
}

export const storage = new MemStorage();
