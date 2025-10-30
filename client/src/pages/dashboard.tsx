import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FileUploader from "@/components/file-uploader";
import DocumentViewer from "@/components/document-viewer";
import DataTable from "@/components/data-table";
import StatusBar from "@/components/status-bar";
import { CheckCircle, Clock, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileData {
  id: number;
  status: string;
  progress: number;
  originalName: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  excelData?: string[][];
  modifiedData?: string[][];
}

export default function Dashboard() {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [processingFileId, setProcessingFileId] = useState<number | null>(null);

  const { data: files = [] } = useQuery<FileData[]>({
    queryKey: ["/api/files"],
    refetchInterval: 5000, // Refresh files every 5 seconds
  });

  const { data: selectedFile } = useQuery<FileData>({
    queryKey: ["/api/files", selectedFileId],
    enabled: !!selectedFileId,
    refetchInterval: 2000, // Poll for updates every 2 seconds
  });

  // Auto-select the most recent completed file if none selected
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      const completedFiles = files.filter(f => f.status === 'complete');
      if (completedFiles.length > 0) {
        const mostRecent = completedFiles.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedFileId(mostRecent.id);
      }
    }
  }, [files, selectedFileId]);

  const handleFileUploaded = (file: any) => {
    setSelectedFileId(file.id);
    setProcessingFileId(file.id);
  };

  const handleFileSelect = (file: any) => {
    console.log('File selected:', file);
    setSelectedFileId(file.id);
    setProcessingFileId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Complete</span>;
      case "error":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>;
      case "processing":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Processing</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Uploading</span>;
    }
  };

  // Mock notifications for recent activity
  const notifications = [
    {
      id: 1,
      message: "File upload started - processing in progress",
      time: "2 minutes ago",
      type: "info"
    },
    {
      id: 2,
      message: "File upload started - processing in progress", 
      time: "5 minutes ago",
      type: "info"
    },
    {
      id: 3,
      message: "Your file has been downloaded",
      time: "10 minutes ago",
      type: "success"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-6">
          {/* File Upload Section */}
          <div className="mb-8">
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>

          {/* Processing Status Bar */}
          {(processingFileId || (selectedFile && selectedFile.status !== "complete")) && (
            <div className="mb-8">
              <StatusBar fileId={processingFileId || selectedFileId} />
            </div>
          )}

          {/* Recent Notifications */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Notifications</h4>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    notification.type === "success"
                      ? "bg-green-50 border-green-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processed Files */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Processed Files</h4>
            <div className="space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-gray-500">No files processed yet</p>
              ) : (
                files.map((file: FileData) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFileId === file.id ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex-1 flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(file.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Document Comparison</h2>
          <p className="text-gray-600 text-sm">Review and edit extracted data before approval</p>
        </div>

        {/* Split Panel Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Original Document Panel - 50% width */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col min-h-0 overflow-hidden">
            <DocumentViewer file={selectedFile} />
          </div>

          {/* Generated Excel Sheet Panel - 50% width */}
          <div className="w-1/2 bg-white flex flex-col min-h-0 overflow-hidden">
            <DataTable file={selectedFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
