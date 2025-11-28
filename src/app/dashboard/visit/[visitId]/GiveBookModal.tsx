// // src/app/dashboard/visit/[visitId]/GiveBookModal.tsx
// 'use client';

// import { useState } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// interface Book { id: number; title: string; }

// interface GiveBookModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   books: Book[];
//   onConfirm: (bookId: number, quantity: number) => void;
// }

// export function GiveBookModal({ isOpen, onClose, books, onConfirm }: GiveBookModalProps) {
//     const [selectedBookId, setSelectedBookId] = useState('');
//     const [quantity, setQuantity] = useState(1);

//     const handleConfirm = () => {
//         if (!selectedBookId) {
//             alert("Please select a book.");
//             return;
//         }
//         onConfirm(parseInt(selectedBookId), quantity);
//         // Reset for next time
//         setSelectedBookId('');
//         setQuantity(1);
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent>
//                 <DialogHeader><DialogTitle>Select Book & Quantity</DialogTitle></DialogHeader>
//                 <div className="space-y-4 py-4">
//                     <div className="space-y-2">
//                         <Label>Book</Label>
//                         <Select value={selectedBookId} onValueChange={setSelectedBookId}>
//                             <SelectTrigger><SelectValue placeholder="Select a book to give" /></SelectTrigger>
//                             <SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.title}</SelectItem>)}</SelectContent>
//                         </Select>
//                     </div>
//                     <div className="space-y-2">
//                         <Label>Quantity</Label>
//                         <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
//                     </div>
//                 </div>
//                 <DialogFooter>
//                     <Button variant="outline" onClick={onClose}>Cancel</Button>
//                     <Button onClick={handleConfirm}>Add to List</Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }
'use client';
import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';  // <-- YEH ADD KARO
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
interface Book { id: number; title: string; }
interface GiveBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onConfirm: (bookId: number, quantity: number) => void;
}
export function GiveBookModal({ isOpen, onClose, books, onConfirm }: GiveBookModalProps) {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const handleConfirm = () => {
    if (!selectedBookId) {
      alert("Please select a book.");
      return;
    }
    onConfirm(parseInt(selectedBookId), quantity);
    setSelectedBookId('');
    setQuantity(1);
  };
  const handleClose = () => {
    setOpen(false);
    setSelectedBookId('');
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Select Book & Quantity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Book</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedBookId
                    ? books.find((book) => book.id.toString() === selectedBookId)?.title
                    : "Select a book to give..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-72 p-0">
                <Command
                  filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    return 0;
                  }}
                >
                  <CommandInput placeholder="Search book title..." />
                  <CommandList>
                    <CommandEmpty>No book found.</CommandEmpty>
                    <CommandGroup>
                      {/* --- YEH HAI MAIN FIX: ScrollArea wrap kiya hai --- */}
                      <ScrollArea className="h-full">
                        {books.map((book) => (
                          <CommandItem
                            key={book.id}
                            value={book.title}
                            onSelect={(currentValue) => {
                              const selected = books.find(b => b.title.toLowerCase() === currentValue.toLowerCase());
                              if (selected) {
                                setSelectedBookId(selected.id.toString());
                              }
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBookId === book.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {book.title}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Add to List</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}