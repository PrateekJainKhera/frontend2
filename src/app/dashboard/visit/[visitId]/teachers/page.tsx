//src/app/dashboard/visit/[visitId]/teachers/page.tsx
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
import { PlusCircle, ArrowLeft, Check, CheckCircle, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { GiveBookModal } from '../GiveBookModal';
import { PlaceOrderModal, type OrderItem } from '@/app/dashboard/visit/[visitId]/PlaceOrderModal'; // Make sure OrderItem is imported
import { toast } from '@/hooks/use-toast';
// --- Interfaces ---
interface Teacher { 
  id: number; 
  name: string; 
  whatsAppNumber: string | null;
    subjectsTaught: { classLevel: string; subject: string; }[];


}
// --- Replace this part ---
const classOptions = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
// --- ADD this mapping instead ---
const classToSubjects: Record<string, string[]> = {
  Nursery: ['Rhymes', 'Drawing', 'Pre-Maths', 'Oral Activities'],
  LKG: ['Hindi', 'English', 'Numbers', 'Drawing'],
  UKG: ['Hindi', 'English', 'Maths', 'General Knowledge'],
  '1st': ['Hindi', 'English', 'Maths', 'EVS'],
  '2nd': ['Hindi', 'English', 'Maths', 'EVS'],
  '3rd': ['Hindi', 'English', 'Maths', 'EVS'],
  '4th': ['Hindi', 'English', 'Maths', 'EVS'],
  '5th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '6th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '7th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '8th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '9th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '10th': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit'],
  '11th': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Maths', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Political Science', 'Geography'],
  '12th': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Maths', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Political Science', 'Geography']
};
interface BookInStock { bookId: number; bookTitle: string; remainingStock: number; }
interface DistributedBook { bookId: number; bookTitle: string; quantity: number; }
export default function TeacherInteractionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const visitId = parseInt(params.visitId as string);
  const schoolId = parseInt(searchParams.get('schoolId') || '0');
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [booksInStock, setBooksInStock] = useState<BookInStock[]>([]);
  const [completedTeachers, setCompletedTeachers] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherWhatsApp, setTeacherWhatsApp] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState<{ classLevel: string; subject: string; }[]>([]);
  const [currentSubject, setCurrentSubject] = useState({ classLevel: '', subject: '' });

  const [distributedBooks, setDistributedBooks] = useState<DistributedBook[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  // Add this line with your other useState hooks
const [allCompanyBooks, setAllCompanyBooks] = useState<{id: number, title: string}[]>([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  // Add state for the new teacher modal later
  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const [teachersRes, stockRes,allBooksRes] = await Promise.all([
          api.get(`/schools/${schoolId}/teachers`),
          api.get('/inventory/my-stock'),
                  api.get('/books') // <-- NEW API CALL
        ]);
        setAllTeachers(teachersRes.data);
        setBooksInStock(stockRes.data);
              setAllCompanyBooks(allBooksRes.data); // <-- STORE THE RESULT
      } catch (error) { console.error("Failed to fetch data", error); }
    };
    fetchData();
  }, [schoolId]);
const handleSelectTeacher = (teacherId: string) => {
  const teacher = allTeachers.find(t => t.id === parseInt(teacherId));
  if (teacher) {
    setSelectedTeacher(teacher);
    setTeacherWhatsApp(teacher.whatsAppNumber || '');
    // Set the state with the array of subjects from the selected teacher
    setSubjectsTaught(teacher.subjectsTaught || []);
    setDistributedBooks([]);
    setIsRecommending(false);
  }
};
  const handleGiveBook = (bookId: number, quantity: number) => {
    const book = booksInStock.find(b => b.bookId === bookId);
    if (book) {
      setDistributedBooks(prev => [...prev, { bookId, bookTitle: book.bookTitle, quantity }]);
    }
    setIsBookModalOpen(false);
  };
   // --- ADD THIS NEW HANDLER FUNCTION ---
  const handleConfirmOrder = async (items: OrderItem[]) => {
    if (!selectedTeacher) {
      alert("Error: No teacher selected.");
      return;
    }
    try {
      const payload = {
        visitId: visitId,
        placedByType: 0, // 0 for Teacher
        orderPlacedById: selectedTeacher.id,
        items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity }))
      };
      await api.post('/orders', payload);
      toast({
        title: "✅ Order Placed",
        description: `Order for ${selectedTeacher.name} has been successfully placed.`,
      });
      // We don't need to close the modal here, it closes itself.
    } catch (error) {
      toast({
        title: "❌ Order Failed",
        description: "There was an error placing the order.",
        variant: "destructive",
      });
    }
  };
  // --- END OF NEW HANDLER ---
const handleCompleteMeeting = async () => {
  if (!selectedTeacher) return;
  try {
    // The payload for updating the teacher now includes the list of subjects
    const updatePayload = { 
      name: selectedTeacher.name,
      whatsAppNumber: teacherWhatsApp,
      subjectsTaught: subjectsTaught // <-- NEW
    };
    await api.post(`/teachers/${selectedTeacher.id}/update`, updatePayload);
    
    // The rest of the logic for saving distributions is the same
    const distributionPayloads = distributedBooks.map(b => ({
      // ...
    }));
    for (const payload of distributionPayloads) {
      await api.post('/bookdistributions', payload);
    }
    
    alert(`Meeting with ${selectedTeacher.name} is complete. Data saved.`);
    setCompletedTeachers(prev => [...prev, selectedTeacher.id]);
    setSelectedTeacher(null);
  } 
  catch (error) {
    alert("Error saving meeting details.");
  }
};
  const handleEndSchoolVisit = async () => {
    if (!visitId) return;
    if (confirm("Are you sure you want to end this school visit?")) {
        try {
            await api.post(`/visits/${visitId}/end`);
            
            alert("School visit has been marked as complete.");
            router.push('/dashboard');
        } catch (error) {
            alert("Error ending visit. Please try again.");
        }
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
              <Button variant="secondary"><PlusCircle className="h-4 w-4 mr-2" /> Add New</Button>
            </div>
          </div>
          {selectedTeacher && (
            <Card className="bg-gray-50 p-4">
              <CardTitle className="text-lg mb-4">Meeting with: {selectedTeacher.name}</CardTitle>
             
             
              <div className="space-y-4">
{/* --- START OF NEW SUBJECTS UI --- */}
<div className="space-y-2">
  <Label>Subjects & Classes Taught</Label>
  <div className="space-y-2 p-2 border rounded-md bg-white">
    {/* Display the list of existing subjects */}
    {subjectsTaught.map((s, index) => (
      <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
        <p className="text-sm font-medium">{s.classLevel} - {s.subject}</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSubjectsTaught(prev => prev.filter((_, i) => i !== index))}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ))}
    
    {/* Form to add a new subject */}
    <div className="flex items-end gap-2 pt-2 border-t">
      <div className="flex-1">
        <Select onValueChange={(val) => setCurrentSubject(p => ({ ...p, classLevel: val, subject: '' }))}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Select onValueChange={(val) => setCurrentSubject(p => ({ ...p, subject: val }))} disabled={!currentSubject.classLevel}>
          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
          <SelectContent>{(classToSubjects[currentSubject.classLevel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button 
        variant="secondary" 
        onClick={() => {
          if (currentSubject.classLevel && currentSubject.subject) {
            setSubjectsTaught(prev => [...prev, currentSubject]);
            setCurrentSubject({ classLevel: '', subject: '' }); // Reset the dropdowns
          }
        }}
        disabled={!currentSubject.classLevel || !currentSubject.subject}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
{/* --- END OF NEW SUBJECTS UI --- */}
                <div className="space-y-2">
                  <Label>Teacher's WhatsApp Number *</Label>
                <Input 
                value={teacherWhatsApp}
                 onChange={(e) => setTeacherWhatsApp(e.target.value)} 
                    placeholder="Enter 10-digit number" // "N/A" ki jagah
        maxLength={10}
        type="tel" />
                </div>
                <div className="space-y-2">
                  <Label>Books Distributed</Label>
                  <div className="space-y-2 min-h-10">
                    {distributedBooks.map(db => (
                      <div key={db.bookId} className="flex justify-between items-center p-2 border rounded bg-white">
                        <p className="text-sm">{db.bookTitle}</p>
                        <Badge>Qty: {db.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setIsBookModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" /> Give Book</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label className="font-semibold">Did teacher recommend the books?</Label>
                  <Switch checked={isRecommending} onCheckedChange={setIsRecommending} />
                </div>
               <div className="space-y-2">
  <Label>Teacher Orders</Label>
  <Button 
    variant="outline" 
    className="w-full" 
    onClick={() => setIsOrderModalOpen(true)}
  >
    <PlusCircle className="h-4 w-4 mr-2" />
    Place New Order for Teacher
  </Button>
</div>
                
                <Button className="w-full mt-4" onClick={handleCompleteMeeting}><Check className="h-4 w-4 mr-2" />Complete Meeting with {selectedTeacher.name}</Button>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
       <Button 
        variant="destructive" 
        className="w-full text-lg py-6"
        onClick={handleEndSchoolVisit}
      >
        End School Visit & Go to Dashboard
      </Button>
      <GiveBookModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} books={booksInStock.map(b => ({id: b.bookId, title: b.bookTitle}))} onConfirm={handleGiveBook} />
      {selectedTeacher && <PlaceOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}      books={allCompanyBooks} 
       onConfirmOrder={handleConfirmOrder}
/>}
    </div>
  );
  }