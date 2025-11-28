// src/app/dashboard/visit/[visitId]/teachers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ArrowLeft, Check, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { GiveBookModal } from '@/app/dashboard/visit/[visitId]/GiveBookModal';
import { PlaceOrderModal } from '@/app/dashboard/visit/[visitId]/PlaceOrderModal';

// --- Interfaces ---
interface Teacher { id: number; name: string; whatsAppNumber: string | null; }
interface Book { id: number; title: string; }
interface DistributedBook { bookId: number; bookTitle: string; quantity: number; }

export default function TeacherInteractionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const visitId = parseInt(params.visitId as string);
  const schoolId = parseInt(searchParams.get('schoolId') || '0');

  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [completedTeachers, setCompletedTeachers] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherWhatsApp, setTeacherWhatsApp] = useState('');
  const [distributedBooks, setDistributedBooks] = useState<DistributedBook[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false); // The main toggle state
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isNewTeacherModalOpen, setIsNewTeacherModalOpen] = useState(false);

  useEffect(() => { /* ... fetchData logic remains the same ... */ }, [schoolId]);

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = allTeachers.find(t => t.id === parseInt(teacherId));
    if (teacher) {
      setSelectedTeacher(teacher);
      setTeacherWhatsApp(teacher.whatsAppNumber || '');
      setDistributedBooks([]);
      setOrderPlaced(false);
      setIsRecommending(false); // Reset recommendation toggle for new teacher
    }
  };

  const handleGiveBook = (bookId: number, quantity: number) => {
    if (!selectedTeacher) return;
    const book = allBooks.find(b => b.id === bookId);
    if (book) {
      setDistributedBooks(prev => [...prev, { bookId, bookTitle: book.title, quantity }]);
    }
    setIsBookModalOpen(false);
  };

  const handleCompleteMeeting = async () => {
    if (!selectedTeacher) return;
    try {
      // Send all book distributions to the backend at once
      const distributionPayloads = distributedBooks.map(b => ({
        visitId,
        teacherId: selectedTeacher.id,
        bookId: b.bookId,
        quantity: b.quantity,
        wasRecommended: isRecommending // Use the state of the single toggle for all books
      }));
      
      for (const payload of distributionPayloads) {
        await api.post('/bookdistributions', payload);
      }
      
      alert(`Meeting with ${selectedTeacher.name} is complete. Data saved.`);
      setCompletedTeachers(prev => [...prev, selectedTeacher.id]);
      setSelectedTeacher(null);
    } catch (error) {
      alert("Error saving meeting details.");
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
      <Card>
        <CardHeader><CardTitle>Teacher Interactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Find or Add Teacher</Label>
            <div className="flex gap-2">
              <Select onValueChange={handleSelectTeacher} value={selectedTeacher?.id.toString() || ''}>
                <SelectTrigger><SelectValue placeholder="Select a teacher to interact with" /></SelectTrigger>
                <SelectContent>{allTeachers.map(t => 
                  <SelectItem key={t.id} value={t.id.toString()} disabled={completedTeachers.includes(t.id)}>
                    <div className="flex items-center">
                      {completedTeachers.includes(t.id) && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                      {t.name}
                    </div>
                  </SelectItem>
                )}</SelectContent>
              </Select>
              <Button variant="secondary" onClick={() => setIsNewTeacherModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" /> Add New</Button>
            </div>
          </div>

          {selectedTeacher && (
            <Card className="bg-gray-50 p-4">
              <CardTitle className="text-lg mb-4">Meeting with: {selectedTeacher.name}</CardTitle>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Teacher's WhatsApp Number *</Label><Input value={teacherWhatsApp} onChange={(e) => setTeacherWhatsApp(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Books Distributed</Label>
                  <div className="space-y-2 min-h-[40px]">
                    {distributedBooks.map(db => (
                      <div key={db.bookId} className="flex justify-between items-center p-2 border rounded bg-white">
                        <p className="text-sm">{db.bookTitle}</p>
                        <Badge>Qty: {db.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setIsBookModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" /> Give Book</Button>
                </div>
                
                {/* --- THIS IS THE CORRECTED RECOMMENDATION TOGGLE --- */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label className="font-semibold">Did teacher recommend the books?</Label>
                  <Switch checked={isRecommending} onCheckedChange={setIsRecommending} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label className="font-semibold">Did the teacher place an order?</Label>
                  <Switch checked={orderPlaced} onCheckedChange={(checked) => { setOrderPlaced(checked); if (checked) setIsOrderModalOpen(true); }} />
                </div>
                
                <Button className="w-full mt-4" onClick={handleCompleteMeeting}><Check className="h-4 w-4 mr-2" />Complete Meeting with {selectedTeacher.name}</Button>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
      <GiveBookModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} books={allBooks} onConfirm={handleGiveBook} />
      {selectedTeacher && <PlaceOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} books={allBooks} visitId={visitId} teacherId={selectedTeacher.id} />}
      {/* Add New Teacher Modal would go here */}
    </div>
  );
}