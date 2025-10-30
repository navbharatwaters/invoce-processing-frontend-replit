import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Check, Table2, Info, Plus, Minus, MoreHorizontal } from "lucide-react";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

interface DataTableProps {
  file: any;
}

export default function DataTable({ file }: DataTableProps) {
  const [tableData, setTableData] = useState<string[][]>([]);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{row: number, col: number} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('DataTable received file:', file);
    if (file?.excelData) {
      console.log('Loading Excel data for file:', file.id, 'Data length:', file.excelData.length);
      setTableData(file.excelData);
    } else {
      console.log('No Excel data found for file:', file?.id, 'Status:', file?.status, 'excelData:', file?.excelData);
    }
  }, [file]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Update modified data if there are changes
      if (editedCells.size > 0) {
        await apiRequest("PATCH", `/api/files/${file.id}`, {
          modifiedData: tableData,
        });
      }
      
      // Approve the file
      const response = await apiRequest("POST", `/api/files/${file.id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "File Approved",
        description: "File has been approved and uploaded to Google Drive successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      // Update modified data if there are changes
      if (editedCells.size > 0) {
        await apiRequest("PATCH", `/api/files/${file.id}`, {
          modifiedData: tableData,
        });
      }
      
      // Debug: Log current table data being downloaded
      console.log('Downloading table data:', tableData);
      console.log('Number of rows:', tableData.length);
      console.log('Number of columns:', tableData[0]?.length || 0);
      console.log('Headers:', tableData[0]);
      console.log('First data row:', tableData[1]);
      
      // Create properly formatted CSV with quotes for cells containing commas
      const csvContent = tableData.map(row => 
        row.map(cell => {
          // Handle cells that contain commas, quotes, or newlines
          const cellValue = String(cell || '');
          if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
            return `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        }).join(',')
      ).join('\n');
      
      console.log('Generated CSV content (first 500 chars):', csvContent.substring(0, 500));
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.originalName.split('.')[0]}_extracted_data.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your file download has started.",
      });
    },
  });

  // Handle cell editing with proper state persistence
  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
    
    const cellKey = `${rowIndex}-${colIndex}`;
    setEditedCells(prev => new Set(Array.from(prev).concat([cellKey])));
    
    // Immediately save changes to backend
    saveChangesToBackend(newData);
  };

  // Auto-save function with immediate save for persistence
  const saveChangesToBackend = useCallback(async (data: string[][]) => {
    try {
      await apiRequest("PATCH", `/api/files/${file.id}`, {
        modifiedData: data,
      });
      console.log('Changes saved to backend successfully');
      
      // Update the file data in storage to ensure persistence
      queryClient.setQueryData(['/api/files', file.id], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            excelData: data
          };
        }
        return oldData;
      });
      
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  }, [file?.id, queryClient]);

  // Add row function - adds row above current focused cell or at end
  const addRow = () => {
    if (tableData.length === 0) return;
    const insertIndex = focusedCell ? focusedCell.row : tableData.length;
    const newRow = new Array(tableData[0].length).fill('');
    const newData = [...tableData];
    newData.splice(insertIndex, 0, newRow);
    setTableData(newData);
    
    // Mark the new row as edited
    for (let col = 0; col < newRow.length; col++) {
      const cellKey = `${insertIndex}-${col}`;
      setEditedCells(prev => new Set(Array.from(prev).concat([cellKey])));
    }
    
    // Focus the first cell of new row
    setFocusedCell({ row: insertIndex, col: 0 });
    saveChangesToBackend(newData);
    console.log('Added row above current cell at index:', insertIndex);
  };

  // Add column function - adds column to the left of current focused cell or at end
  const addColumn = () => {
    if (tableData.length === 0) return;
    const insertIndex = focusedCell ? focusedCell.col : tableData[0].length;
    const newData = tableData.map((row, rowIndex) => {
      const newRow = [...row];
      const newCellValue = rowIndex === 0 ? `Column ${insertIndex + 1}` : '';
      newRow.splice(insertIndex, 0, newCellValue);
      return newRow;
    });
    setTableData(newData);
    
    // Mark the new column as edited
    for (let row = 0; row < newData.length; row++) {
      const cellKey = `${row}-${insertIndex}`;
      setEditedCells(prev => new Set(Array.from(prev).concat([cellKey])));
    }
    
    // Focus the new column header
    setFocusedCell({ row: focusedCell?.row || 1, col: insertIndex });
    saveChangesToBackend(newData);
    console.log('Added column at index:', insertIndex);
  };

  const isCellEdited = (rowIndex: number, colIndex: number) => {
    return editedCells.has(`${rowIndex}-${colIndex}`);
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!focusedCell || !tableData.length) return;

    const { row, col } = focusedCell;
    const maxRow = tableData.length - 1;
    const maxCol = tableData[0]?.length - 1 || 0;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) { // Allow navigation to header row (row 0)
          setFocusedCell({ row: row - 1, col });
          setIsEditing(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < maxRow) {
          setFocusedCell({ row: row + 1, col });
          setIsEditing(false);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          setFocusedCell({ row, col: col - 1 });
          setIsEditing(false);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < maxCol) {
          setFocusedCell({ row, col: col + 1 });
          setIsEditing(false);
        }
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        setIsEditing(true);
        // Focus the input after state update
        setTimeout(() => editingInputRef.current?.focus(), 0);
        break;
      case 'Escape':
        e.preventDefault();
        setIsEditing(false);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab - move left/up
          if (col > 0) {
            setFocusedCell({ row, col: col - 1 });
          } else if (row > 1) {
            setFocusedCell({ row: row - 1, col: maxCol });
          }
        } else {
          // Tab - move right/down
          if (col < maxCol) {
            setFocusedCell({ row, col: col + 1 });
          } else if (row < maxRow) {
            setFocusedCell({ row: row + 1, col: 0 });
          }
        }
        setIsEditing(false);
        break;
    }
  }, [focusedCell, tableData]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (focusedCell) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, focusedCell]);

  // Auto-scroll to focused cell
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const { row, col } = focusedCell;
      const cell = tableRef.current.querySelector(
        `tbody tr:nth-child(${row}) td:nth-child(${col + 1})`
      ) as HTMLElement;
      
      if (cell) {
        cell.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [focusedCell]);

  // Handle cell click
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setFocusedCell({ row: rowIndex, col: colIndex });
    setIsEditing(false);
  };

  // Handle cell double-click
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    setFocusedCell({ row: rowIndex, col: colIndex });
    setIsEditing(true);
    setTimeout(() => editingInputRef.current?.focus(), 0);
  };

  // Handle input blur (finish editing)
  const handleInputBlur = (rowIndex: number, colIndex: number, value: string) => {
    console.log('Saving cell edit via blur:', rowIndex, colIndex, value);
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
    
    const cellKey = `${rowIndex}-${colIndex}`;
    setEditedCells(prev => new Set(Array.from(prev).concat([cellKey])));
    
    saveChangesToBackend(newData);
    setIsEditing(false);
  };

  // Handle input key events during editing
  const handleInputKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      console.log('Saving cell edit via Enter:', rowIndex, colIndex, value);
      
      const newData = [...tableData];
      newData[rowIndex][colIndex] = value;
      setTableData(newData);
      
      const cellKey = `${rowIndex}-${colIndex}`;
      setEditedCells(prev => new Set(Array.from(prev).concat([cellKey])));
      
      saveChangesToBackend(newData);
      setIsEditing(false);
      
      // Move to next row
      if (rowIndex < tableData.length - 1) {
        setFocusedCell({ row: rowIndex + 1, col: colIndex });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
    // Stop propagation to prevent table navigation
    e.stopPropagation();
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Table2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a document file to view and edit the Excel data</p>
        </div>
      </div>
    );
  }

  if (file.status === "error") {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Processing Error</h3>
          <p className="text-sm text-red-600">Failed to extract data from document</p>
        </div>
        <div className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">Processing Failed</h4>
                {tableData.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {tableData.slice(1).map((row, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-red-700">{row[0]}:</span>
                        <span className="text-red-600 ml-2">{row[1]}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">Common solutions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check if your n8n workflow is running properly</li>
                    <li>Verify the webhook URL in settings</li>
                    <li>Try uploading a smaller or clearer document</li>
                    <li>Ensure the document format is supported (PDF, PNG, JPG)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file.excelData || file.status !== "complete") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Table2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {file.status === "complete" 
              ? "No data extracted from this document" 
              : "Waiting for document processing to complete..."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900">Generated Excel Sheet</h3>
          {editedCells.size > 0 && (
            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              {editedCells.size} cell{editedCells.size > 1 ? 's' : ''} modified
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={addRow}
            disabled={tableData.length === 0}
            variant="outline"
            size="sm"
            className="px-3 py-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
          <Button
            onClick={addColumn}
            disabled={tableData.length === 0}
            variant="outline"
            size="sm"
            className="px-3 py-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
          <Button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            variant="outline"
            className="px-4 py-2"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="px-4 py-2 bg-primary text-white hover:bg-blue-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve & Send
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-2 overflow-auto min-h-0">
        <div className="overflow-auto h-full" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <table 
            ref={tableRef}
            className="w-full border-collapse border border-gray-300 text-xs"
            tabIndex={0}
            onFocus={() => {
              if (!focusedCell && tableData.length > 1) {
                setFocusedCell({ row: 1, col: 0 });
              }
            }}
          >
            <thead>
              <tr className="bg-gray-50">
                {tableData[0]?.map((header, index) => {
                  const isHeaderFocused = focusedCell?.row === 0 && focusedCell?.col === index;
                  const isEditingHeader = isEditing && isHeaderFocused;
                  
                  return (
                    <th
                      key={index}
                      className={`border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-900 bg-gray-50 sticky top-0 min-w-20 max-w-32 cursor-pointer ${
                        isHeaderFocused ? "bg-blue-100 border-blue-500 border-2" : "hover:bg-blue-50"
                      }`}
                      style={{ width: `${Math.max(120, Math.min(200, header.length * 8 + 40))}px` }}
                      onClick={() => setFocusedCell({ row: 0, col: index })}
                      onDoubleClick={() => {
                        setFocusedCell({ row: 0, col: index });
                        setIsEditing(true);
                        setTimeout(() => editingInputRef.current?.focus(), 0);
                      }}
                    >
                      {isEditingHeader ? (
                        <input
                          ref={editingInputRef}
                          type="text"
                          defaultValue={header || ''}
                          className="w-full h-full px-1 py-0 text-xs border-0 bg-transparent outline-none font-medium"
                          onBlur={(e) => {
                            console.log('Saving header edit:', 0, index, e.target.value);
                            handleInputBlur(0, index, e.target.value);
                          }}
                          onKeyDown={(e) => handleInputKeyDown(e, 0, index)}
                          autoFocus
                        />
                      ) : (
                        <div className="truncate" title={header}>
                          {header}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, colIndex) => {
                    const actualRowIndex = rowIndex + 1;
                    const isFocused = focusedCell?.row === actualRowIndex && focusedCell?.col === colIndex;
                    const isEditingThisCell = isEditing && isFocused;
                    
                    return (
                      <td
                        key={colIndex}
                        className={`border border-gray-300 px-2 py-1 text-xs text-gray-900 cursor-cell relative min-w-20 max-w-32 ${
                          isCellEdited(actualRowIndex, colIndex) ? "bg-yellow-50" : ""
                        } ${
                          isFocused ? "bg-blue-100 border-blue-500 border-2" : "hover:bg-blue-50"
                        }`}
                        style={{ width: `${Math.max(120, Math.min(200, (tableData[0]?.[colIndex]?.length || 10) * 8 + 40))}px` }}
                        onClick={() => handleCellClick(actualRowIndex, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(actualRowIndex, colIndex)}
                      >
                        {isEditingThisCell ? (
                          <input
                            ref={editingInputRef}
                            type="text"
                            defaultValue={cell || ''}
                            className="w-full h-full px-1 py-0 text-xs border-0 bg-transparent outline-none"
                            onBlur={(e) => {
                              console.log('Saving cell edit via onBlur:', actualRowIndex, colIndex, e.target.value);
                              handleInputBlur(actualRowIndex, colIndex, e.target.value);
                            }}
                            onKeyDown={(e) => handleInputKeyDown(e, actualRowIndex, colIndex)}
                            autoFocus
                          />
                        ) : (
                          <div className="truncate" title={cell || ''}>
                            {cell || ''}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-2" />
            <strong>Navigation:</strong> Use arrow keys to move between cells. Press Enter or F2 to edit. 
            Tab/Shift+Tab to move right/left. Double-click or press Enter to edit a cell.
          </p>
        </div>
      </div>
    </div>
  );
}
