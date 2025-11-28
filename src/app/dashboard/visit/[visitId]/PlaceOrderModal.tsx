'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Book, OrderItem } from '@/types';
// import { type Book, type OrderItem } from ; // <-- CHANGE THIS LINE
// --- NEW, MORE GENERIC INTERFACES ---
interface PlaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  // This function will now be responsible for handling the final order items
  onConfirmOrder: (items: OrderItem[]) => void; 
}
export function PlaceOrderModal({ isOpen, onClose, books, onConfirmOrder }: PlaceOrderModalProps) {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [currentItem, setCurrentItem] = useState({ bookId: '', quantity: 1 });
    // Reset state when the modal opens
    useEffect(() => {
        if (isOpen) {
            setOrderItems([]);
            setCurrentItem({ bookId: '', quantity: 1 });
        }
    }, [isOpen]);
    const handleAddItem = () => {
        const book = books.find(b => b.id === parseInt(currentItem.bookId));
        if (!book || orderItems.some(item => item.bookId === book.id)) return;
        setOrderItems(prev => [...prev, { bookId: book.id, bookTitle: book.title, quantity: currentItem.quantity }]);
        setCurrentItem({ bookId: '', quantity: 1 });
    };
    const handleRemoveItem = (bookId: number) => {
        setOrderItems(prev => prev.filter(item => item.bookId !== bookId));
    };
    const handleConfirm = () => {
        if (orderItems.length === 0) {
            alert("Please add at least one item to the order.");
            return;
        }
        onConfirmOrder(orderItems); // Pass the completed list of items back to the parent page
        onClose();
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Place New Order</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Add Item Form */}
                    <div className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="flex-1 space-y-1">
                            <Label>Book</Label>
                            <Select value={currentItem.bookId} onValueChange={(val) => setCurrentItem(p => ({...p, bookId: val}))}>
                                <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
                                <SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="w-24 space-y-1">
                            <Label>Quantity</Label>
                            <Input type="number" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem(p => ({...p, quantity: parseInt(e.target.value) || 1}))} />
                        </div>
                        <Button onClick={handleAddItem} disabled={!currentItem.bookId}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    {/* Order Items List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {orderItems.map(item => (
                            <div key={item.bookId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <p className="text-sm font-medium">{item.bookTitle}</p>
                                <div className="flex items-center gap-2">
                                    <Badge>Qty: {item.quantity}</Badge>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(item.bookId)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={orderItems.length === 0}>Confirm Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
export type { OrderItem };