export const allowedFileTypes = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

export const getFileExtension = (filename: string): string => {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidFileType = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return allowedFileTypes.includes(extension);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileTypeIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return 'fa-file-pdf';
  if (fileType.includes('image')) return 'fa-file-image';
  if (fileType.includes('doc')) return 'fa-file-word';
  return 'fa-file';
};

export const createExcelDownload = (data: string[][], filename: string) => {
  const csvContent = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
