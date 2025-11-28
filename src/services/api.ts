// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // IMPORTANT: This tells axios to send cookies with every request
  headers: {
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning when using reverse proxy
  },
});
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "");

// ======================================================
// Book Bulk Upload & Download Functions
// ======================================================

export interface BulkUploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

export interface BulkDeleteResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  deletedBookIds: number[];
}

export async function bulkUploadBooks(file: File): Promise<BulkUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<BulkUploadResult>('/books/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function downloadExcelTemplate(): Promise<void> {
  const response = await api.get('/books/template', {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'books_template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportBooksToExcel(): Promise<void> {
  const response = await api.get('/books/export', {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'books_export.xlsx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function bulkDeleteBooks(bookIds: number[]): Promise<BulkDeleteResult> {
  const response = await api.post<BulkDeleteResult>('/books/bulk-delete', bookIds);
  return response.data;
}

export default api;