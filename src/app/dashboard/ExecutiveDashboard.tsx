// src/app/dashboard/ExecutiveDashboard.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusSquare, Play, Square, CheckCircle2, Clock, Zap ,CheckCircle, AlertTriangle} from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/hooks/use-toast'; // ADD THIS
import { SelectVisitTypeModal } from './SelectVisitTypeModal';
import { useRouter } from 'next/navigation';
import { ConsignmentReceiptModal } from './ConsignmentReceiptModal';
import { DailyRouteMap } from './DailyRouteMap';
import { FeedbackPopup } from '@/components/ui/FeedbackPopup';
import { ListChecks } from 'lucide-react'; // 1. Import a new icon
import { MonthlyTasksModal } from './MonthlyTasksModal'; // 2. Import the new modal component
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
import { Consignment, ConsignmentItem } from '@/types';

// Simple TaskItem Component
interface TaskItemProps {
  plan: BeatPlan;
  onStartVisit: (plan: BeatPlan) => void;
  t: (key: string) => string;
}
function TaskItem({ plan, onStartVisit, t }: TaskItemProps) {
  const isCompleted = plan.status === 3;
  const isApproved = plan.status === 1;
  const isPending = plan.status === 0;
  if (isCompleted) {
    return (
      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
        <CheckCircle2 className="h-10 w-10 text-green-500 shrink-0" />
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-900">{plan.locationName}</p>
          <p className="text-sm text-green-600 font-medium">{t('exec.completed')}</p>
        </div>
        <Button
          onClick={() => onStartVisit(plan)}
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 h-12"
          size="lg"
        >
          Revisit
        </Button>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-lg border-2 ${isPending ? 'border-yellow-400' : 'border-gray-200'}`}>
      <Clock className={`h-10 w-10 shrink-0 ${isPending ? 'text-yellow-500' : 'text-gray-400'}`} />
      <div className="flex-1">
        <p className="text-lg font-medium text-gray-900">{plan.locationName}</p>
        <p className="text-sm text-gray-500">
          {isApproved ? t('exec.readyToStart') : t('exec.pendingSync')}
        </p>
      </div>
      <Button
        disabled={!isApproved}
        onClick={() => onStartVisit(plan)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12"
        size="lg"
      >
        {t('exec.start')}
      </Button>
    </div>
  );
}
// Type Definitions
interface BeatPlan {
  id: number;
  locationId: number;
  locationName: string;
  status: number;
  locationType: number;
  latitude: number | null;
  longitude: number | null;
}
export function ExecutiveDashboard() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const [beatPlan, setBeatPlan] = useState<BeatPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [myConsignments, setMyConsignments] = useState<Consignment[]>([]);
  const [isConsignmentLoading, setIsConsignmentLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ title: string; description: string; variant: 'success' | 'error' } | null>(null);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false); // 3. Add state for the modal
  const [confirmation, setConfirmation] = useState<'startDay' | 'endDay' | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);


// --- REVERT THIS ---
const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  const fetchTodaysPlan = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/executives/${user.id}/beatplan`, {
        params: { planDate: today }
      });
      setBeatPlan(response.data);
    } catch (error) {
      console.error("Failed to fetch beat plan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  const fetchMyConsignments = useCallback(async () => {
    if (!user) return;
    try {
      setIsConsignmentLoading(true);
      const response = await api.get('/executives/me/consignments');
      setMyConsignments(response.data.filter((c: Consignment) => c.status === 0));
    } catch (error) {
      console.error("Failed to fetch consignments:", error);
    } finally {
      setIsConsignmentLoading(false);
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      fetchTodaysPlan();
      fetchMyConsignments();

      // --- THIS IS THE FIX ---
      const checkTrackingStatus = async () => {
        try {
          const response = await api.get('/tracking/status');
          if (response.data.isActive) {
            setIsDayStarted(true);
            setTrackingId(response.data.trackingId);
          }
        } catch (error) {
          console.error("Failed to check tracking status", error);
        }
      };
      checkTrackingStatus();
      // --- END FIX ---
    }
}, [user, fetchTodaysPlan, fetchMyConsignments]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchTodaysPlan();
      }
    };
    const handleFocus = () => {
      if (user) {
        fetchTodaysPlan();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchTodaysPlan]);
  useEffect(() => {
    if (isDayStarted && trackingId) {
      trackingIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.post(`/tracking/${trackingId}/location`, { latitude, longitude });
          } catch (error) {
            console.error("Failed to send location ping:", error);
          }
        });
      }, 10000);//10 sec
    }
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isDayStarted, trackingId]);
  // useEffect(() => {
  //   const runTracking = () => {
  //     if (!isDayStarted || !trackingId) {
  //       return;
  //     }
  //     navigator.geolocation.getCurrentPosition(
  //       async (position) => {
  //         const { latitude, longitude } = position.coords;
  //         try {
  //           await api.post(`/tracking/${trackingId}/location`, { latitude, longitude });
  //           console.log("Ping sent from component.");
  //         } catch (error) {
  //           console.error("Failed to send location ping from component:", error);
  //         } finally {
  //           if (timerIdRef.current) {
  //             clearTimeout(timerIdRef.current);
  //           }
  //           timerIdRef.current = setTimeout(runTracking, 30000);
  //         }
  //       },
  //       (error) => {
  //         console.error("Geolocation error:", error);
  //         if (timerIdRef.current) {
  //           clearTimeout(timerIdRef.current);
  //         }
  //         timerIdRef.current = setTimeout(runTracking, 30000);
  //       },
  //       { enableHighAccuracy: true }
  //     );
  //   };

  //   if (isDayStarted && trackingId) {
  //     runTracking();
  //   }

  //   return () => {
  //     if (timerIdRef.current) {
  //       console.log("Clearing tracking timer.");
  //       clearTimeout(timerIdRef.current);
  //     }
  //   };
  // }, [isDayStarted, trackingId]);
  const handleStartDay = () => {
    if (!user) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const payload = { salesExecutiveId: user.id, latitude, longitude };
        const response = await api.post('/tracking/start', payload);
        setTrackingId(response.data.trackingId);
        setIsDayStarted(true);
        // SUCCESS TOAST
        setFeedback({
          title: t('exec.dayStartedTitle'),
          description: t('exec.dayStartedDesc'),
          variant: 'success',
        });
      } catch (error) {
        console.error("Failed to start day:", error);
        // ERROR TOAST
        setFeedback({
          title: t('exec.errorTitle'),
          description: t('exec.startDayError'),
          variant: 'error',
        });
      }
    }, (geoError) => {
      console.error("Geolocation Error:", geoError);
      setFeedback({
        title: t('exec.errorTitle'),
        description: t('visit.locationError'),
        variant: 'error',
      });
    }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
  };
  const handleEndDay = async () => {
    //if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
  // --- THIS IS THE NEW WRAPPER ---
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // All of your existing logic will go inside here
        try {
            // --- THIS IS THE CHANGE ---
    // 1. Get the coordinates from the position object
    const { latitude, longitude } = position.coords;

    // 2. Create the payload object
    const payload = { latitude, longitude };

    // 3. Pass the payload as the second argument to api.post
    const response = await api.post(`/tracking/${trackingId}/end`, payload);
    // --- END OF CHANGE ---
            setIsDayStarted(false);
            setTrackingId(null);
            
            // Tell the Service Worker to stop
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ action: 'STOP_TRACKING' });
            }

            const distance = response.data.totalDistance;
            setFeedback({
                title: "✅ Day Ended",
                description: `Workday complete. Total distance: ${distance.toFixed(2)} km.`,
                variant: 'success'
            });
        } catch (error) {
          console.error("Failed to end day:", error);
          setFeedback({
            title: t('exec.errorTitle'),
            description: t('exec.endDayError'),
            variant: 'error',
          });
        }
      },
      (geoError) => {
        // This is the new error handler for when geolocation fails
        console.error("Geolocation Error on End Day:", geoError);
        setFeedback({
          title: t('exec.errorTitle'),
          description: "Could not get your final location. Please check location services and try again.",
          variant: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 15000 } // Options
    );
    // --- END OF WRAPPER ---
  };
const handleViewConsignment = (consignment: Consignment) => {
  setSelectedConsignment(consignment);
};
 const handleModalClose = () => {
  setSelectedConsignment(null);
};
  const handleReceiveSuccess = () => {
    fetchMyConsignments();
  };
  
  const handleStartVisit = (plan: BeatPlan) => {
    let url = '';
    
    if (plan.locationType === 0) {
      url = `/dashboard/visit/${plan.id}?locationType=0`;
    } else {
      const typeString = plan.locationType === 1 ? 'tuition' : 'shopkeeper';
    url = `/dashboard/quick-visit?type=${typeString}&planId=${plan.id}`;
    }
    
    router.push(url);
  };
  const completedCount = beatPlan.filter(p => p.status === 3).length;
  const totalCount = beatPlan.length;
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('exec.hello')}, {user?.name}
        </h1>
        {!isDayStarted ? (
          <Button 
            onClick={() => setConfirmation('startDay')} 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg"
          >
            <Play className="h-6 w-6 mr-2" />
            {t('exec.startDay')}
          </Button>
        ) : (
          <Button 
            onClick={() => setConfirmation('endDay')} 
            size="lg" 
            className="bg-red-600 hover:bg-red-700 text-white h-14 px-8 text-lg"
          >
            <Square className="h-6 w-6 mr-2" />
            {t('exec.endDay')}
          </Button>
        )}
      </div>
      {/* Map */}
      {beatPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('exec.todaysRoute')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyRouteMap plannedVisits={beatPlan} />
          </CardContent>
        </Card>
      )}

  
{/* 
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          className="w-full h-20 text-lg bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsPlanModalOpen(true)}
        >
          <PlusSquare className="h-6 w-6 mr-3" />
          {t('exec.planNewVisit')}
        </Button>
        <Button
          className="w-full h-20 text-lg bg-green-600 hover:bg-green-700 text-white"
          onClick={() => router.push('/dashboard/direct-visit')}
        >
          <CheckCircle2 className="h-6 w-6 mr-3" />
          Direct Visit
        </Button>
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {/* Secondary Action: Monthly Tasks */}
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => setIsTasksModalOpen(true)}
          >
            <ListChecks className="h-8 w-8 text-gray-600" />
            <span className="font-semibold">Monthly Tasks</span>
          </Button>

          {/* Secondary Action: Plan New Visit */}
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => setIsPlanModalOpen(true)}
          >
            <PlusSquare className="h-8 w-8 text-gray-600" />
            <span className="font-semibold">{t('exec.planNewVisit')}</span>
          </Button>

          {/* Primary Action: Direct Visit */}
          <Button
      className="col-span-2 h-20 w-full text-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center rounded-2xl shadow-md transition-all duration-200"
      onClick={() => router.push('/dashboard/direct-visit')}
    >
      <CheckCircle2 className="h-6 w-6 mr-3" />
      Direct Visit
    </Button>
        
        </CardContent>
      </Card>
      {/* --- END: NEW UNIFIED ACTIONS CARD --- */}

      {/* Tasks List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('exec.todaysVisits')} ({completedCount}/{totalCount})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchTodaysPlan}>
          {t('exec.refresh')}
        </Button>
      </div>
        
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : beatPlan.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('exec.noVisits')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {beatPlan.map(plan => (
            <TaskItem
              key={plan.id}
              plan={plan}
              onStartVisit={handleStartVisit}
              t={t}
            />
          ))}
        </div>
      )}
      
      {/* Consignments */}
      {myConsignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('exec.pendingConsignments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myConsignments.map(c => (
                <div 
                  key={c.id} 
                  className="flex items-center justify-between p-4 border-2 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-lg">{c.transportCompanyName}</p>
                    <p className="text-gray-600">{t('exec.bilty')}: {c.biltyNumber}</p>
                  </div>
                  <Button 
                    onClick={() => handleViewConsignment(c)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('exec.view')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Modals */}
      <ConsignmentReceiptModal
        isOpen={selectedConsignment !== null}
        onClose={handleModalClose}
        onSuccess={handleReceiveSuccess}
        consignment={selectedConsignment} // Pass the ID to the modal
      />
      <SelectVisitTypeModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onPlanCreated={fetchTodaysPlan}
      />
      <FeedbackPopup
        isOpen={feedback !== null}
        onClose={() => setFeedback(null)}
        title={feedback?.title || ''}
        description={feedback?.description || ''}
        variant={feedback?.variant || 'success'}
      />
       <MonthlyTasksModal 
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
      />
       <AlertDialog open={confirmation !== null} onOpenChange={() => setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className={`h-6 w-6 mr-2 ${confirmation === 'startDay' ? 'text-green-500' : 'text-red-500'}`} />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === 'startDay' && "This will start your daily tracking and location monitoring. Your workday will officially begin."}
              {confirmation === 'endDay' && "This will end your workday, calculate your travel distance, and generate your TA/DA expenses. You cannot restart it afterwards."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmation(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmation === 'startDay') {
                  handleStartDay();
                } else if (confirmation === 'endDay') {
                  handleEndDay();
                }
                setConfirmation(null);
              }}
              className={confirmation === 'startDay' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {confirmation === 'startDay' ? 'Yes, Start My Day' : 'Yes, End My Day'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}