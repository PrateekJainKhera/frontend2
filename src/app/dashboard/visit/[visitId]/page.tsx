
// src/app/dashboard/visit/[visitId]/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, ArrowLeft, Check, PlusCircle, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from "@/hooks/use-toast"; 
import { FeedbackPopup } from '@/components/ui/FeedbackPopup';
import { useVisitState } from '@/hooks/useVisitState'; // <-- ADD THIS LINE

// --- Interfaces ---
interface School {
  id: number;
  name: string;
  principalName: string | null;
   principalMobileNumber: string | null;
  totalStudentCount: number;
}
interface Visit { id: number; }
interface TeacherInfo {
  name: string;
  whatsAppNumber: string;
    subjectsTaught: { classLevel: string; subject: string; }[];


}

interface VisitFormData {
  principalName: string;
  principalMobile: string;
  studentCount: string;
  principalRemarks: string;
  permissionGranted: boolean;
  teachersFromPrincipal: TeacherInfo[];
}
// --- Constants for Dropdowns ---
// --- Constants for Dropdowns ---
const classOptions = [
  'Nursery', 'LKG', 'UKG',
  '1st', '2nd', '3rd', '4th', '5th',
  '6th', '7th', '8th', '9th', '10th',
  '11th', '12th'
];
// Map class to subjects dynamically
const subjectsByClass: Record<string, string[]> = {
  Nursery: ['Rhymes', 'Drawing', 'Play Activities'],
  LKG: ['Hindi', 'English', 'Numbers', 'Drawing'],
  UKG: ['Hindi', 'English', 'Maths', 'Drawing'],
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
export default function VisitExecutionPage() {
    // const { toast } = useToast(); // 2. Initialize
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const visitPlanId = parseInt(params.visitId as string);
  const searchParams = useSearchParams();
  const locationType = searchParams.get('locationType');
  const [visitStep, setVisitStep] = useState<'checkin' | 'form'>('checkin');
  const [school, setSchool] = useState<School | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
   const [feedback, setFeedback] = useState<{ title: string; description: string; variant: 'success' | 'error' } | null>(null);
// State for the new teacher being added
const [newTeacherName, setNewTeacherName] = useState('');
const [newTeacherWhatsApp, setNewTeacherWhatsApp] = useState('');
// State for the current subject/class being added to that teacher
const [currentSubject, setCurrentSubject] = useState({ classLevel: '', subject: '' });
// State to hold the list of subjects for the new teacher
const [newTeacherSubjects, setNewTeacherSubjects] = useState<{ classLevel: string; subject: string }[]>([]);
const { formData, setFormData, clearSavedState } = useVisitState(visitPlanId);

useEffect(() => {
    const fetchInitialData = async () => { // Renamed for clarity
      if (!visitPlanId) return;
      try {
        // 1. Still makes the FIRST API call to get the school ID.
        const planResponse = await api.get(`/beatplans/${visitPlanId}`);
        const schoolData = planResponse.data;
        setSchool(schoolData);
        // --- NEW CHANGE 1: A SECOND API CALL ---
        // 2. Makes a NEW API call to our '/last-visit-details' endpoint.
        const lastVisitResponse = await api.get(`/schools/${schoolData.id}/last-visit-details`);
        const lastVisitData = lastVisitResponse.data;
        // --- NEW CHANGE 2: PRE-FILL ALL FIELDS ---
        // 3. Now pre-fills ALL form fields using the data from the new API call.
        setFormData(prev => ({
          ...prev,
          principalName: lastVisitData.principalName || '',
          principalMobile: lastVisitData.principalMobileNumber || '',
          studentCount: lastVisitData.totalStudentCount?.toString() || '',
          principalRemarks: lastVisitData.principalRemarks || '', // <-- New
          permissionGranted: lastVisitData.permissionToMeetTeachers || false, // <-- New
          teachersFromPrincipal: lastVisitData.knownTeachers.map((t: any) => ({ // <-- New
            name: t.name,
            whatsAppNumber: t.whatsAppNumber || '',
            classesTaught: t.classesTaught || '',
            primarySubject: t.primarySubject || ''
          }))
        }));
      } catch (err) {
        console.error("Failed to fetch visit data", err);
        setError("Could not load visit details.");
      }
    };
    fetchInitialData();
    }, [visitPlanId, setFormData]);


  const handleTakePhotoClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !school) return;
    setIsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const formData = new FormData();
      formData.append('salesExecutiveId', user.id.toString());
      formData.append('locationId', school.id.toString());
      formData.append('locationType', locationType || '0');
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('checkInPhoto', file);
      try {
        const response = await api.post('/visits/checkin', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
if (response.data.daTargetCompleted) {
          setFeedback({
            title: "🎉 Congratulations!",
            description: "You have completed your Daily Allowance target for today.",
            variant: 'success',
          });
        }
        setVisit(response.data.visit);
        setVisitStep('form');
      } catch (err: any) {
        setFeedback({
          title: `❌ ${t('visit.checkInFailed')}`,
          description: err.response?.data?.message || t('visit.tryAgain'),
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }, (geoError) => {
      setError(t('visit.locationError'));
      setIsLoading(false);
    });
  };

const handleAddTeacherToList = () => {
    if (!newTeacherName.trim() || newTeacherSubjects.length === 0) {
      alert("Please provide the teacher's name and add at least one subject/class combination.");
      return;
    }

    // This object now perfectly matches the new TeacherInfo interface
    const newTeacherData: TeacherInfo = {
      name: newTeacherName,
      whatsAppNumber: newTeacherWhatsApp,
      subjectsTaught: newTeacherSubjects 
    };

    setFormData(prev => ({ ...prev, teachersFromPrincipal: [...prev.teachersFromPrincipal, newTeacherData] }));
    
    // Reset the form for adding the next teacher
    setNewTeacherName('');
    setNewTeacherWhatsApp('');
    setNewTeacherSubjects([]);
    setCurrentSubject({ classLevel: '', subject: '' });
  };
  const handleRemoveTeacherFromList = (index: number) => {
  setFormData(prev => ({ ...prev, teachersFromPrincipal: prev.teachersFromPrincipal.filter((_, i) => i !== index) }));
  };
  const handleCompletePrincipalMeeting = async () => {
    if (!visit || !school) return;
    setIsLoading(true);
    try {
       const schoolUpdatePayload = {
        principalName: formData.principalName,
        principalMobileNumber: formData.principalMobile,
        totalStudentCount: parseInt(formData.studentCount) || 0,
        teachers: formData.teachersFromPrincipal
    };
    //  await api.put(`/schools/${school.id}`, schoolUpdatePayload);
        await api.post(`/schools/${school.id}/update`, schoolUpdatePayload);
     const visitUpdatePayload = {
        principalRemarks: formData.principalRemarks,
        permissionToMeetTeachers: formData.permissionGranted,
    };
     // await api.put(`/visits/${visit.id}/principal-meeting`, visitUpdatePayload);
         await api.post(`/visits/${visit.id}/principal-meeting`, visitUpdatePayload);
      
      if (formData.permissionGranted) {
        router.push(`/dashboard/visit/${visit.id}/teachers?schoolId=${school.id}`);
      } else {
        await api.post(`/visits/${visit.id}/end`);
                clearSavedState(); // <-- ADD THIS LINE

        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Failed to save details", err);
      alert("Error saving details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  if (!school) return <div className="p-4">{t('common.loading')}</div>;
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('visit.backToMyDay')}
      </Button>
      <h2 className="text-3xl font-bold">{school.name}</h2>
      {visitStep === 'checkin' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('visit.checkInTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 py-12">
            <p className="text-gray-600">{t('visit.checkInDesc')}</p>
            <Button size="lg" onClick={handleTakePhotoClick} disabled={isLoading}>
              <Camera className="h-5 w-5 mr-2" />
              {isLoading ? t('visit.processing') : t('visit.takePhoto')}
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}
      {visitStep === 'form' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('visit.principalMeeting')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principalName">{t('visit.principalName')}</Label>
                  <Input 
                    id="principalName" 
                    value={formData.principalName} 
onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                  />
                </div>
                   <div className="space-y-2">
  <Label htmlFor="principalMobile">{t('visit.principalMobile')}</Label>
  <Input 
    id="principalMobile" 
    type="tel"
value={formData.principalMobile}
onChange={(e) => setFormData(prev => ({ ...prev, principalMobile: e.target.value }))}
    maxLength={10} 
    placeholder={t('visit.enterMobilePlaceholder')} 
  />
</div>
                <div className="space-y-2">
                  <Label htmlFor="studentCount">{t('visit.studentCount')}</Label>
                  <Input 
                    id="studentCount" 
                    type="number" 
                    value={formData.studentCount} 
  onChange={(e) => setFormData(p => ({ ...p, studentCount: e.target.value }))} // FIX: was updating principalMobile
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remarks">{t('visit.remarks')}</Label>
                <Textarea 
                  id="remarks" 
                  value={formData.principalRemarks} 
onChange={(e) => setFormData(prev => ({ ...prev, principalRemarks: e.target.value }))}
                  placeholder={t('visit.remarksPlaceholder')} 
                />
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label>{t('visit.teacherInfo')}</Label>
                <div className="p-2 border rounded-md space-y-2">
                  {formData.teachersFromPrincipal.map((teacher, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <p className="flex-1 text-sm font-medium">
  ({teacher.subjectsTaught && teacher.subjectsTaught.map(s => `${s.classLevel} ${s.subject}`).join(', ')})
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
  onClick={() => setFormData(prev => ({ 
    ...prev, 
    teachersFromPrincipal: prev.teachersFromPrincipal.filter((_, i) => i !== index) 
  }))}                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  
                
{/* --- START OF NEW TEACHER FORM --- */}
<div className="p-3 border bg-gray-50 rounded-lg mt-2 space-y-3">
  <h4 className="font-semibold text-sm">Add a New Teacher</h4>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Input 
      placeholder={`${t('visit.teacherName')}*`}
      value={newTeacherName} 
      onChange={(e) => setNewTeacherName(e.target.value)} 
    />
    <Input 
      type="tel"
      maxLength={10}
      placeholder={t('visit.whatsAppOptional')}
      value={newTeacherWhatsApp}
      onChange={(e) => setNewTeacherWhatsApp(e.target.value.replace(/[^0-9]/g, ''))}
    />
  </div>

  {/* Subject/Class list for the new teacher */}
  <div className="space-y-2">
    {newTeacherSubjects.map((s, index) => (
      <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-md">
        <p className="text-sm font-medium">{s.classLevel} - {s.subject}</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNewTeacherSubjects(prev => prev.filter((_, i) => i !== index))}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ))}
  </div>

  {/* Inputs to add a new subject/class */}
  <div className="flex items-end gap-2">
    <div className="flex-1">
      <Label className="text-xs">Class</Label>
      <Select value={currentSubject.classLevel} onValueChange={(val) => setCurrentSubject(p => ({ ...p, classLevel: val, subject: '' }))}>
        <SelectTrigger><SelectValue placeholder={t('visit.selectClass')} /></SelectTrigger>
        <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="flex-1">
      <Label className="text-xs">Subject</Label>
      <Select value={currentSubject.subject} onValueChange={(val) => setCurrentSubject(p => ({ ...p, subject: val }))} disabled={!currentSubject.classLevel}>
        <SelectTrigger><SelectValue placeholder={t('visit.selectSubject')} /></SelectTrigger>
        <SelectContent>{(subjectsByClass[currentSubject.classLevel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <Button 
      variant="secondary" 
      onClick={() => {
        if (currentSubject.classLevel && currentSubject.subject) {
          setNewTeacherSubjects(prev => [...prev, currentSubject]);
          setCurrentSubject({ classLevel: '', subject: '' });
        }
      }}
      disabled={!currentSubject.classLevel || !currentSubject.subject}
    >
      <PlusCircle className="h-4 w-4" />
    </Button>
  </div>

  <Button onClick={handleAddTeacherToList} className="w-full mt-2">
    {t('visit.addTeacher')}
  </Button>
</div>
{/* --- END OF NEW TEACHER FORM --- */}
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="permission" 
                  checked={formData.permissionGranted} 
onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permissionGranted: checked as boolean }))}
                />
                <Label htmlFor="permission" className="cursor-pointer">
                  {t('visit.permission')}
                </Label>
              </div>
              
              <Button 
                onClick={handleCompletePrincipalMeeting} 
                disabled={isLoading} 
                className="w-full mt-4"
              >
                <Check className="h-4 w-4 mr-2" />
                {formData.permissionGranted ? t('visit.saveAndProceed') : t('visit.saveAndComplete')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
       <FeedbackPopup
        isOpen={feedback !== null}
        onClose={() => setFeedback(null)}
        title={feedback?.title || ''}
        description={feedback?.description || ''}
        variant={feedback?.variant || 'success'}
      />
    </div>
  );
}