import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface StatusBarProps {
  fileId: number | null;
}

interface FileData {
  id: number;
  status: string;
  progress: number;
  originalName: string;
}

export default function StatusBar({ fileId }: StatusBarProps) {
  const { data: file, isLoading } = useQuery<FileData>({
    queryKey: ["/api/files", fileId],
    enabled: !!fileId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if file is still processing
      if (data && typeof data === 'object' && 'status' in data) {
        return ["uploading", "processing", "extracting"].includes(data.status as string) ? 2000 : false;
      }
      return false;
    },
  });

  if (!fileId || isLoading) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: string, progress: number) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing document...";
      case "extracting":
        return "Extracting data...";
      case "complete":
        return "Complete!";
      case "error":
        return "Processing failed";
      default:
        return "Ready to process...";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  if (!file) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {getStatusIcon(file.status)}
        <h4 className="text-sm font-medium text-gray-700">Processing Status</h4>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={file.progress || 0} 
          className="h-3"
        />
        <p className="text-sm text-gray-600">
          {getStatusText(file.status, file.progress || 0)}
        </p>
      </div>
      
      {file.status === "complete" && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            File processed successfully! You can now review and edit the extracted data.
          </p>
        </div>
      )}
      
      {file.status === "error" && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Processing failed. Please try uploading the file again.
          </p>
        </div>
      )}
    </div>
  );
}
