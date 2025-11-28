'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Pencil, Trash2, FilterX, BookOpen, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '@/services/api';
import { AddEditBookModal } from './AddEditBookModal';
import BulkUploadButton from './BulkUploadButton';
import DownloadExcelButton from './DownloadExcelButton';
import BulkDeleteButton from './BulkDeleteButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// --- Interfaces ---
interface Book {
  id: number;
  title: string;
  subject: string;
  classLevel: string;
  medium: string | null;
  isGift: boolean;
  unitPrice: number;
}
interface TopFilters {
  classLevel: string;
  subject: string;
  medium: string;
  type: string; // 'all', 'specimen', 'gift'
}
interface ColumnFilters {
  title: string;
  classLevel: string;
  subject: string;
  medium: string;
}
const ITEMS_PER_PAGE = 15; // एक पेज पर कितने आइटम दिखाने हैं
export default function BookManagementPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  
  // --- Filter States ---
  const [topFilters, setTopFilters] = useState<TopFilters>({
    classLevel: 'all',
    subject: 'all',
    medium: 'all',
    type: 'all',
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    title: '',
    classLevel: '',
    subject: '',
    medium: '',
  });
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/books');
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchBooks();
  }, []);
  // --- Dynamic options for filters ---
  const classOptions = useMemo(
    () => [...new Set(books.map(b => b.classLevel).filter(Boolean))],
    [books]
  );
  const subjectOptions = useMemo(
    () => [...new Set(books.map(b => b.subject).filter(Boolean))],
    [books]
  );
  const mediumOptions = useMemo(
    () => [...new Set(books.map(b => b.medium).filter(Boolean))] as string[],
    [books]
  );
  // --- Combined Filtering Logic ---
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const topClassMatch = topFilters.classLevel === 'all' || book.classLevel === topFilters.classLevel;
      const topSubjectMatch = topFilters.subject === 'all' || book.subject === topFilters.subject;
      const topMediumMatch = topFilters.medium === 'all' || book.medium === topFilters.medium;
      const topTypeMatch = topFilters.type === 'all' || (topFilters.type === 'gift' && book.isGift) || (topFilters.type === 'specimen' && !book.isGift);
      const colTitleMatch = book.title.toLowerCase().includes(columnFilters.title.toLowerCase());
      const colClassMatch = book.classLevel.toLowerCase().includes(columnFilters.classLevel.toLowerCase());
      const colSubjectMatch = book.subject.toLowerCase().includes(columnFilters.subject.toLowerCase());
      const colMediumMatch = (book.medium || 'N/A').toLowerCase().includes(columnFilters.medium.toLowerCase());
      return topClassMatch && topSubjectMatch && topMediumMatch && topTypeMatch && colTitleMatch && colClassMatch && colSubjectMatch && colMediumMatch;
    });
  }, [books, topFilters, columnFilters]);
  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);
  // Reset page on filter change
  useEffect(() => {
      setCurrentPage(1);
  }, [topFilters, columnFilters]);
  const resetFilters = () => {
    setTopFilters({ classLevel: 'all', subject: 'all', medium: 'all', type: 'all' });
    setColumnFilters({ title: '', classLevel: '', subject: '', medium: '' });
  };
  const handleOpenAddModal = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };
  // const handleDeleteBook = async (bookId: number) => {
  //   if (confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
  //       try {
  //           await api.delete(`/books/${bookId}`);
  //           fetchBooks();
  //       } catch (error) {
  //           alert("Failed to delete book.");
  //       }
  //   }
  // };
  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setIsAlertOpen(true);
  };
  // 2. Yeh function "Confirm" button dabane par chalta hai
  const confirmDelete = async () => {
    if (!bookToDelete) return;
    try {
        await api.delete(`/books/${bookToDelete.id}`);
        fetchBooks(); // Refresh the list
    } catch (error: any) {
        // Backend se aaye specific error ko dikhayein
        alert(error.response?.data?.message || "Failed to delete book. It might be in use.");
    } finally {
        setIsAlertOpen(false);
        setBookToDelete(null);
    }
  };

  // --- Checkbox Selection Handlers ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookIds(paginatedBooks.map(book => book.id));
    } else {
      setSelectedBookIds([]);
    }
  };

  const handleSelectBook = (bookId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookIds(prev => [...prev, bookId]);
    } else {
      setSelectedBookIds(prev => prev.filter(id => id !== bookId));
    }
  };

  const isAllSelected = paginatedBooks.length > 0 && selectedBookIds.length === paginatedBooks.length;
  const isSomeSelected = selectedBookIds.length > 0 && selectedBookIds.length < paginatedBooks.length;
 return (
    <>
      <div className="space-y-6">
        {/* --- PROFESSIONAL HEADER (Responsive) --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {/* Left Side: Title */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Book Management</h2>
            <p className="text-sm text-muted-foreground">Manage your library inventory.</p>
          </div>

          {/* Right Side: Actions Toolbar */}
          {/* Mobile: Stacked vertical | Desktop: Single row aligned right */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            
            {/* Bulk Delete (Conditional) */}
            {selectedBookIds.length > 0 && (
              <BulkDeleteButton
                selectedBookIds={selectedBookIds}
                onDeleteComplete={fetchBooks}
                onClearSelection={() => setSelectedBookIds([])}
              />
            )}

            {/* Secondary Actions Group */}
            {/* We wrap these to control their width together */}
            <div className="flex flex-col sm:flex-row gap-2">
               {/* Note: These buttons will still be colorful unless you edit their files (See Step 2) */}
               <div className="w-full sm:w-auto">
                 <DownloadExcelButton />
               </div>
               <div className="w-full sm:w-auto">
                 <BulkUploadButton onUploadComplete={fetchBooks} />
               </div>
            </div>

            {/* Primary Action */}
            <Button onClick={handleOpenAddModal} className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </div>

      <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          {/* Changed grid-cols-1 (mobile) to sm:grid-cols-2 (tablet) to lg:grid-cols-5 (desktop) */}
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end p-4">
            <Select value={topFilters.classLevel} onValueChange={v => setTopFilters(p => ({...p, classLevel: v}))}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Classes</SelectItem>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            
            <Select value={topFilters.subject} onValueChange={v => setTopFilters(p => ({...p, subject: v}))}>
              <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            
            <Select value={topFilters.medium} onValueChange={v => setTopFilters(p => ({...p, medium: v}))}>
              <SelectTrigger><SelectValue placeholder="Select Medium" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Mediums</SelectItem>{mediumOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            
            <Select value={topFilters.type} onValueChange={v => setTopFilters(p => ({...p, type: v}))}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="specimen">Specimen</SelectItem><SelectItem value="gift">Gift</SelectItem></SelectContent>
            </Select>

            {/* Reset Button: Full width on mobile, Outline style */}
            <Button onClick={resetFilters} variant="outline" className="w-full border-dashed">
              <FilterX className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Master Book List</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        // ref={(el) => el && (el.indeterminate = isSomeSelected)}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Class</th>
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Medium</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                  <tr className="border-b">
                    <th className="p-1"></th>
                    <th className="p-1 font-normal"><Input placeholder="Search Title..." value={columnFilters.title} onChange={e => setColumnFilters(p => ({...p, title: e.target.value}))} className="h-8" /></th>
                    <th className="p-1 font-normal"><Input placeholder="Search Class..." value={columnFilters.classLevel} onChange={e => setColumnFilters(p => ({...p, classLevel: e.target.value}))} className="h-8" /></th>
                    <th className="p-1 font-normal"><Input placeholder="Search Subject..." value={columnFilters.subject} onChange={e => setColumnFilters(p => ({...p, subject: e.target.value}))} className="h-8" /></th>
                    <th className="p-1 font-normal"><Input placeholder="Search Medium..." value={columnFilters.medium} onChange={e => setColumnFilters(p => ({...p, medium: e.target.value}))} className="h-8" /></th>
                    <th className="p-1"></th>
                    <th className="p-1"></th>
                    <th className="p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center p-6">Loading books...</td></tr>
                  ) : paginatedBooks.length > 0 ? (
                    paginatedBooks.map(book => (
                      <tr key={book.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedBookIds.includes(book.id)}
                            onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-medium">{book.title}</td>
                        <td className="p-3">{book.classLevel}</td>
                        <td className="p-3">{book.subject}</td>
                        <td className="p-3">{book.medium || 'N/A'}</td>
                        <td className="p-3">{book.isGift ? 'Gift' : 'Specimen'}</td>
                        <td className="p-3 text-right font-semibold">₹{book.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(book)}><Pencil className="h-4 w-4" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(book)}><Trash2 className="h-4 w-4 text-red-500" /></Button>                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-2" />
                        <p>{books.length > 0 ? 'No books match the current filters.' : 'No books found. Please add a new book.'}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* --- Pagination Controls UI --- */}
           {totalPages > 1 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t">
      <span className="text-sm text-muted-foreground order-1 sm:order-1">
          Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
      </span>
      
      <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-2">
          <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none justify-center"
          >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
          </Button>
          <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex-1 sm:flex-none justify-center"
          >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
      </div>
  </div>
)}
          </CardContent>
        </Card>
      </div>
      <AddEditBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBooks}
        editingBook={editingBook}
      />
   <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book 
              <span className="font-semibold"> "{bookToDelete?.title}"</span>. 
              If this book is used in any consignment or order, deletion might fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Yes, delete book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
  }