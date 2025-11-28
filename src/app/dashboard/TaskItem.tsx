// src/app/dashboard/TaskItem.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

// Define the props our component will accept
interface TaskItemProps {
  plan: {
    id: number;
    locationName: string;
    status: number;
    locationType: number;
  };
  onStartVisit: (plan: TaskItemProps['plan']) => void;
}

export function TaskItem({ plan, onStartVisit }: TaskItemProps) {
  // State 1: Completed Visit (status: 2)
  if (plan.status === 2) {
    return (
      <Card className="flex items-center p-4 bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700">
        <CheckCircle2 className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
        <div className="flex-1 min-w-0"> {/* ADDED min-w-0 for flex shrink */}
          <p className="font-medium text-gray-400 line-through truncate dark:text-gray-500">
            {plan.locationName}
          </p>
        </div>
      </Card>
    );
  }

  // State 2: Pending or Approved (Actionable)
  const isActionable = plan.status === 1;

  return (
    <Card className="flex items-center justify-between p-4">
      {/* THIS IS THE MAIN FIX: We add `min-w-0` to allow this container to shrink */}
      <div className="flex items-center flex-1 min-w-0">
        {isActionable ? (
          <PlayCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
        ) : (
          <Clock className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
        )}
        {/* This div will now correctly truncate its children */}
        <div className="truncate">
          <p className="font-medium truncate">{plan.locationName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isActionable ? 'Ready to start' : 'Pending Approval'}
          </p>
        </div>
      </div>

      {/* We add `ml-4` for spacing and make the button smaller on mobile */}
      <Button
        disabled={!isActionable}
        onClick={() => onStartVisit(plan)}
        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
        size="sm" // Use a smaller button size
      >
        <PlayCircle className="h-5 w-5 md:mr-2" />
        {/* The text is hidden on small screens, shown on medium and up */}
        <span className="hidden md:inline">Start</span>
      </Button>
    </Card>
  );
}