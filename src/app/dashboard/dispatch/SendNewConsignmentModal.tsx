'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AddBookModal } from './AddBookModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Send, Package, PlusCircle, Trash2, PackagePlus, Upload } from 'lucide-react';
import api from '@/services/api';
import { Checkbox } from '@/components/ui/checkbox';
// --- Types ---
interface Salesman { id: number; name: string; roleName: string; }
interface Book { id: number; title: string; classLevel: string; subject: string;medium: string | null;  }
interface BookItem { bookId: number; bookTitle: string; quantity: number; }
// --- Main Component ---
export function SendNewConsignmentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  // Individual states for form fields
  const [transport, setTransport] = useState('');
  const [biltyNo, setBiltyNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState<Date | undefined>();
  const [salesmanId, setSalesmanId] = useState('');
  const [items, setItems] = useState<BookItem[]>([]);
  const [biltyFile, setBiltyFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const resetForm = () => {
    setTransport('');
    setBiltyNo('');
    setDispatchDate(undefined);
    setSalesmanId('');
    setItems([]);
    setBiltyFile(null);
    setError('');
  };
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [salesmenRes, booksRes] = await Promise.all([
            api.get('/executives'),
            api.get('/books')
          ]);
          setSalesmen(salesmenRes.data.filter((s: Salesman) => s.roleName === 'Executive'));
          setAllBooks(booksRes.data);
        } catch (err) {
          console.error("Failed to fetch data for modal", err);
        }
      };
      fetchData();
    } else {
      resetForm();
    }
  }, [isOpen]);
  const handleDeleteBook = (bookId: number) => {
    setItems(prev => prev.filter(item => item.bookId !== bookId));
  };
  const handleAssignConsignment = async () => {
    if (!transport || !biltyNo || !dispatchDate || !salesmanId || items.length === 0) {
        setError("Please fill all required fields and add at least one book.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('TransportCompanyName', transport);
      formData.append('BiltyNumber', biltyNo);
      // Fix: Format date as YYYY-MM-DD to avoid timezone conversion issues
      const year = dispatchDate.getFullYear();
      const month = String(dispatchDate.getMonth() + 1).padStart(2, '0');
      const day = String(dispatchDate.getDate()).padStart(2, '0');
      formData.append('DispatchDate', `${year}-${month}-${day}`);
      formData.append('SalesExecutiveId', salesmanId);
      
      const itemPayload = items.map(({ bookId, quantity }) => ({ bookId, quantity }));
      formData.append('ItemsJson', JSON.stringify(itemPayload));
      if (biltyFile) {
        formData.append('BiltyBillFile', biltyFile);
      }
      await api.post('/consignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create consignment.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // ERROR FIX #1: Function ka naam yahan change kiya
  const handleBooksAdded = (newBooks: BookItem[]) => {
    const currentItems = [...items];
    let addedCount = 0;
    newBooks.forEach(newBook => {
      if (!currentItems.some(item => item.bookId === newBook.bookId)) {
        currentItems.push(newBook);
        addedCount++;
      }
    });
    setItems(currentItems);
    setIsAddBookModalOpen(false);
    if (addedCount < newBooks.length) {
      alert("Some books were already in the list and were skipped.");
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="flex items-center text-xl"><Package className="h-6 w-6 mr-2" />Create & Assign New Consignment</DialogTitle><DialogDescription>Fill in the details below to dispatch a new consignment.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Transport Company</Label><Input value={transport} onChange={(e) => setTransport(e.target.value)} /></div>
              <div className="space-y-2"><Label>Bilty Number</Label><Input value={biltyNo} onChange={(e) => setBiltyNo(e.target.value)} /></div>
              <div className="space-y-2"><Label>Dispatch Date</Label><DatePicker date={dispatchDate} onSelect={setDispatchDate} /></div>
              <div className="space-y-2"><Label>Assign to Salesman</Label><Select value={salesmanId} onValueChange={setSalesmanId}><SelectTrigger><SelectValue placeholder="Select salesman" /></SelectTrigger><SelectContent>{salesmen.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label>Upload Bilty Bill (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">{biltyFile ? biltyFile.name : 'Click to upload a photo or PDF'}</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={(e) => setBiltyFile(e.target.files?.[0] || null)} className="hidden" accept="image/*,application/pdf" />
            </div>
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center"><PackagePlus className="h-5 w-5 mr-2" />Consignment Contents</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">{items.length === 0 ? (<p className="text-sm text-gray-500 text-center py-4">No books added yet.</p>) : (items.map(item => (<div key={item.bookId} className="flex justify-between items-center p-2 bg-gray-50 rounded"><p>{item.bookTitle}</p><div className="flex items-center gap-2"><Badge variant="secondary">Qty: {item.quantity}</Badge><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteBook(item.bookId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>)))}</div>
              <Button variant="outline" className="w-full" onClick={() => setIsAddBookModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Add Book to Consignment</Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAssignConsignment} disabled={isLoading}>{isLoading ? 'Assigning...' : <><Send className="h-4 w-4 mr-2" /> Assign Consignment</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ERROR FIX #2: Prop ka naam yahan change kiya */}
      <AddBookModal isOpen={isAddBookModalOpen} onClose={() => setIsAddBookModalOpen(false)} allBooks={allBooks} onBooksAdded={handleBooksAdded} />
    </>
  );
}
// // --- AddBookModal Component (Naya wala) ---
// interface AddBookModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   allBooks: Book[];
//   onBooksAdded: (books: BookItem[]) => void;
// }
// function AddBookModal({ isOpen, onClose, allBooks, onBooksAdded }: AddBookModalProps) {
//     const [selectedClass, setSelectedClass] = useState('');
//     const [selections, setSelections] = useState<Record<number, number>>({});
//     useEffect(() => {
//         if (isOpen) {
//             setSelectedClass('');
//             setSelections({});
//         }
//     }, [isOpen]);
//     const handleCheckboxChange = (checked: boolean, bookId: number) => {
//         setSelections(prev => {
//             const newSelections = { ...prev };
//             if (checked) {
//                 newSelections[bookId] = 1;
//             } else {
//                 delete newSelections[bookId];
//             }
//             return newSelections;
//         });
//     };
//     const handleQuantityChange = (bookId: number, quantity: number) => {
//         if (quantity >= 1) {
//             setSelections(prev => ({ ...prev, [bookId]: quantity }));
//         }
//     };
    
//     const handleAddSelectedToList = () => {
//         const selectedItems: BookItem[] = Object.entries(selections).map(([bookIdStr, quantity]) => {
//             const bookId = parseInt(bookIdStr);
//             const book = allBooks.find(b => b.id === bookId)!;
//             return { bookId, bookTitle: book.title, quantity };
//         });
//         onBooksAdded(selectedItems);
//     };
//     const classOptions = [...new Set(allBooks.map(b => b.classLevel))];
//     const filteredBooksByClass = selectedClass ? allBooks.filter(b => b.classLevel === selectedClass) : [];
//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Select Books & Quantities</DialogTitle>
//                     <DialogDescription>Select a class to see available subjects. Check the books you want to add.</DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                     <div className="space-y-2">
//                         <Label>Class</Label>
//                         <Select value={selectedClass} onValueChange={setSelectedClass}>
//                             <SelectTrigger><SelectValue placeholder="First, select a class" /></SelectTrigger>
//                             <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
//                         </Select>
//                     </div>
//                     {selectedClass && (
//                         <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border-t pt-4">
//                             {filteredBooksByClass.map(book => (
//                                 <div key={book.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
//                                     <Checkbox 
//                                         id={book-${book.id}}
//                                         checked={!!selections[book.id]}
//                                         onCheckedChange={(checked) => handleCheckboxChange(!!checked, book.id)}
//                                     />
//                                     <label htmlFor={book-${book.id}} className="flex-1 font-medium">{book.subject}</label>
//                                     <Input 
//                                         type="number" min="1" className="w-24"
//                                         value={selections[book.id] || ''}
//                                         onChange={(e) => handleQuantityChange(book.id, parseInt(e.target.value) || 1)}
//                                         disabled={!selections[book.id]}
//                                         placeholder="Qty"
//                                     />
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//                 <DialogFooter>
//                     <Button variant="outline" onClick={onClose}>Cancel</Button>
//                     <Button onClick={handleAddSelectedToList} disabled={Object.keys(selections).length === 0}>
//                         Add {Object.keys(selections).length} Item(s) to List
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }









