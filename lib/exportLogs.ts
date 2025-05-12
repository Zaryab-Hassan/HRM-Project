'use client';

import { jsPDF } from 'jspdf';

// Interface for activity logs
interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Export activity logs as CSV file
 * 
 * @param logs - Activity logs to export
 * @param filename - Name for the exported file (without extension)
 */
export function exportLogsAsCSV(logs: ActivityLog[], filename: string = 'activity-logs'): void {
  // Define the CSV headers
  const headers = ['User', 'Role', 'Action', 'Module', 'Details', 'Timestamp', 'IP Address'];
  
  // Format each log as a CSV row
  const rows = logs.map(log => [
    log.userName,
    log.userRole,
    log.action,
    log.module,
    `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in CSV
    new Date(log.timestamp).toLocaleString(),
    log.ipAddress || 'N/A'
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link to download the file
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  
  // Append to the document, trigger the download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export activity logs as PDF file
 * 
 * @param logs - Activity logs to export
 * @param filename - Name for the exported file (without extension)
 */
export function exportLogsAsPDF(logs: ActivityLog[], filename: string = 'activity-logs'): void {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Activity Logs Report', 15, 15);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 22);
  
  // Define table columns
  const columns = ['User', 'Role', 'Action', 'Module', 'Details', 'Timestamp'];
  
  // Format the data for the table
  const data = logs.map(log => [
    log.userName,
    log.userRole,
    log.action.toUpperCase(),
    log.module,
    log.details.length > 30 ? log.details.substring(0, 30) + '...' : log.details, // Truncate long details
    new Date(log.timestamp).toLocaleString()
  ]);
  
  // Configure table options
  const startY = 30;
  
  // We're using the autoTable method which is added by jsPDF-AutoTable plugin
  // Here we simulate what it would do with our own implementation
  let y = startY;
  const rowHeight = 10;
  const cellPadding = 3;
  const pageWidth = doc.internal.pageSize.width;
  const columnWidth = pageWidth / columns.length - 8;
  
  // Draw table headers
  doc.setFillColor(220, 220, 220);
  doc.rect(10, y, pageWidth - 20, rowHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  columns.forEach((header, i) => {
    doc.text(header, 10 + (i * columnWidth) + cellPadding, y + rowHeight - cellPadding);
  });
  
  y += rowHeight;
  
  // Draw table rows
  doc.setFont('helvetica', 'normal');
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 20;
    }
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, pageWidth - 20, rowHeight, 'F');
    }
    
    // Add row data
    row.forEach((cell, i) => {
      doc.text(String(cell), 10 + (i * columnWidth) + cellPadding, y + rowHeight - cellPadding);
    });
    
    y += rowHeight;
  });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
}

/**
 * Export filtered activity logs
 * 
 * @param logs - Activity logs to export
 * @param format - Export format ('csv' or 'pdf')
 * @param options - Additional export options
 */
export function exportActivityLogs(
  logs: ActivityLog[],
  format: 'csv' | 'pdf' = 'csv',
  options: { 
    filename?: string;
    filterRole?: string; 
    filterModule?: string;
    dateRange?: [Date | null, Date | null];
  } = {}
): void {
  // Generate filename with date
  const today = new Date().toISOString().split('T')[0];
  const filename = options.filename || `activity-logs-${today}`;
  
  // Filter logs if needed
  let filteredLogs = [...logs];
  
  if (options.filterRole && options.filterRole !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.userRole === options.filterRole);
  }
  
  if (options.filterModule && options.filterModule !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.module === options.filterModule);
  }
  
  if (options.dateRange && options.dateRange[0] && options.dateRange[1]) {
    const startDate = options.dateRange[0];
    const endDate = options.dateRange[1];
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }
  
  // Export in the requested format
  if (format === 'pdf') {
    exportLogsAsPDF(filteredLogs, filename);
  } else {
    exportLogsAsCSV(filteredLogs, filename);
  }
}
