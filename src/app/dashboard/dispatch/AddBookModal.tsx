'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Types
interface Book { id: number; title: string; classLevel: string; subject: string; medium: string | null; }
interface BookItem { bookId: number; bookTitle: string; quantity: number; }
interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBooks: Book[];
  onBooksAdded: (books: BookItem[]) => void;
}
export function AddBookModal({ isOpen, onClose, allBooks, onBooksAdded }: AddBookModalProps) {
    const [selectedClass, setSelectedClass] = useState('');
    const [selections, setSelections] = useState<Record<number, number>>({});
    useEffect(() => {
        if (isOpen) {
            setSelectedClass('');
            setSelections({});
        }
    }, [isOpen]);
    const handleCheckboxChange = (checked: boolean, bookId: number) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            if (checked) newSelections[bookId] = 1;
            else delete newSelections[bookId];
            return newSelections;
        });
    };
    const handleQuantityChange = (bookId: number, quantity: number) => {
        if (quantity >= 1) {
            setSelections(prev => ({ ...prev, [bookId]: quantity }));
        }
    };
    const handleRemoveSelection = (bookId: number) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            delete newSelections[bookId];
            return newSelections;
        });
    };
    const handleAddSelectedToList = () => {
        const selectedItems: BookItem[] = Object.entries(selections).map(([bookIdStr, quantity]) => {
            const bookId = parseInt(bookIdStr);
            const book = allBooks.find(b => b.id === bookId)!;
            const bookTitleWithMedium = `${book.subject} - ${book.classLevel} (${book.medium})`;
            return { bookId, bookTitle: bookTitleWithMedium, quantity };
        });
        onBooksAdded(selectedItems);
    };
    const classOptions = [...new Set(allBooks.map(b => b.classLevel))].sort();
    const booksForCurrentClass = selectedClass ? allBooks.filter(b => b.classLevel === selectedClass) : [];
    const groupedSelections = Object.entries(selections).reduce((acc, [bookIdStr, quantity]) => {
        const book = allBooks.find(b => b.id === parseInt(bookIdStr));
        if (book) {
            if (!acc[book.classLevel]) acc[book.classLevel] = [];
            acc[book.classLevel].push({ ...book, quantity });
        }
        return acc;
    }, {} as Record<string, (Book & { quantity: number })[]>);
    const totalSelected = Object.keys(selections).length;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select Books & Quantities</DialogTitle>
                    <DialogDescription>Select a class to see available subjects. Check the books you need.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger><SelectValue placeholder="First, select a class" /></SelectTrigger>
                            <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {selectedClass && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border-t pt-4">
                            <h4 className="font-semibold text-sm mb-2">Subjects for {selectedClass}</h4>
                            {booksForCurrentClass.map(book => (
                                <div key={book.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                                    <Checkbox id={`book-${book.id}`} checked={!!selections[book.id]} onCheckedChange={(checked) => handleCheckboxChange(!!checked, book.id)} />
                                    {/* === YEH HAI FIX === */}
                                    <label htmlFor={`book-${book.id}`} className="flex-1 font-medium">
                                        {book.subject} <span className="text-xs text-gray-500">({book.medium})</span>
                                    </label>
                                    <Input type="number" min="1" className="w-24" value={selections[book.id] || ''} onChange={(e) => handleQuantityChange(book.id, parseInt(e.target.value) || 1)} disabled={!selections[book.id]} placeholder="Qty" />
                                </div>
                            ))}
                        </div>
                    )}
                    {totalSelected > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <h4 className="font-semibold text-sm">Selected Items ({totalSelected})</h4>
                            <Accordion type="multiple" className="w-full max-h-48 overflow-y-auto pr-2">
                                {Object.entries(groupedSelections).map(([classLevel, books]) => (
                                    <AccordionItem value={classLevel} key={classLevel}>
                                        <AccordionTrigger>{classLevel} ({books.length} items)</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2 pl-2">
                                                {books.map(book => (
                                                    <div key={book.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        {/* Yahan bhi Medium show karein */}
                                                        <p className="text-sm font-medium">{book.subject} <span className="text-xs text-gray-500">({book.medium})</span></p>
                                                        <div className="flex items-center gap-2">
                                                            <Input type="number" min="1" className="w-20 h-8" value={book.quantity} onChange={(e) => handleQuantityChange(book.id, parseInt(e.target.value) || 1)} />
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveSelection(book.id)}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAddSelectedToList} disabled={totalSelected === 0}>
                        Add {totalSelected} Item(s) to List
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


