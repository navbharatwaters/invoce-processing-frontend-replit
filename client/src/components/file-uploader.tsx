import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, CloudUpload } from "lucide-react";

interface FileUploaderProps {
  onFileUploaded?: (file: any) => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [selectedFileType, setSelectedFileType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      onFileUploaded?.(data);
      toast({
        title: "Upload Started",
        description: "Your file is being processed...",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, DOCX, PNG, JPG, or JPEG files only.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Upload New File</h3>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">File Type</Label>
        <Select value={selectedFileType} onValueChange={setSelectedFileType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select file type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="doc">DOC/DOCX</SelectItem>
            <SelectItem value="image">PNG/JPG/JPEG</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-primary bg-blue-50"
            : "border-gray-300 hover:border-primary"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Click to upload a file</p>
        <p className="text-sm text-gray-500">or drag and drop</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
        />
      </div>
      
      <Button
        onClick={openFileDialog}
        disabled={uploadMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
