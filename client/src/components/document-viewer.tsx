import { useState } from "react";
import { FileText, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentFile {
  fileType?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
}

interface DocumentViewerProps {
  file: DocumentFile | null;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

export default function DocumentViewer({ file }: DocumentViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  const renderToolbar = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {zoomLevel}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRotate}
          aria-label="Rotate"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          aria-label="Reset view"
        >
          Reset
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">
          {Math.round(file!.fileSize / 1024)} KB
        </span>
        <Button
          size="sm"
          variant="outline"
          asChild
        >
          <a 
            href={`/uploads/${file!.fileName}`} 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Open in full screen"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Full Screen
          </a>
        </Button>
      </div>
    </div>
  );

  const renderPdfViewer = () => (
    <div className="flex-1 bg-gray-900 p-0 relative overflow-hidden">
      <div 
        className="overflow-auto w-full h-full"
        style={{
          position: 'absolute',
          inset: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#6b7280 #1f2937'
        }}
      >
        <div 
          style={{
            width: `${100 * (zoomLevel / 100)}%`,
            minWidth: `${100 * (zoomLevel / 100)}%`,
            height: `${100 * (zoomLevel / 100)}%`,
            minHeight: `${100 * (zoomLevel / 100)}%`,
            backgroundColor: 'white',
            position: 'relative',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: '0 0'
          }}
        >
          <iframe
            src={`/uploads/${file!.fileName}#toolbar=0&navpanes=0&scrollbar=1`}
            className="border-0"
            title={`PDF Preview - ${file!.originalName}`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%'
            }}
            onError={() => console.error('PDF iframe failed to load')}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );

  const renderImageViewer = () => (
    <div className="flex-1 bg-gray-900 p-0 relative overflow-hidden">
      <div 
        className="overflow-auto w-full h-full"
        style={{
          position: 'absolute',
          inset: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#6b7280 #1f2937'
        }}
      >
        <div
          style={{
            width: `${100 * (zoomLevel / 100)}%`,
            minWidth: `${100 * (zoomLevel / 100)}%`,
            height: `${100 * (zoomLevel / 100)}%`,
            minHeight: `${100 * (zoomLevel / 100)}%`,
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            transformOrigin: '0 0'
          }}
        >
          <img
            src={`/uploads/${file!.fileName}`}
            alt="Document preview"
            className="object-contain"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              position: 'absolute'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a document file to view the original document</p>
        </div>
      </div>
    );
  }

  const renderFilePreview = () => {
    const fileType = file.fileType?.toLowerCase() || '';
    
    if (fileType.includes('pdf')) {
      return (
        <div className="w-full h-full flex flex-col">
          {renderToolbar()}
          {renderPdfViewer()}
        </div>
      );
    }
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => fileType.includes(ext))) {
      return (
        <div className="w-full h-full flex flex-col">
          {renderToolbar()}
          {renderImageViewer()}
        </div>
      );
    }
    
    return (
      <div className="text-center">
        <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Document Preview</p>
        <p className="text-sm text-gray-500">{file.originalName}</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-medium text-gray-900">Original Document</h3>
        <p className="text-sm text-gray-500">{file.originalName}</p>
      </div>
      <div className="flex-1 p-4 overflow-hidden min-h-0">
        {renderFilePreview()}
      </div>
    </div>
  );
}