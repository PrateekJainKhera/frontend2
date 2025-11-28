'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { ListChecks, CheckCircle2, Circle, Search, Building2, Store, UserSquare } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// Interface to define the structure of a task
interface MonthlyTask {
  id: number;
  locationName: string;
  address: string | null;
  district: string | null;
  city: string | null;
  isCompleted: boolean;
  locationType: number;
}

interface MonthlyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonthlyTasksModal({ isOpen, onClose }: MonthlyTasksModalProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // State for the new filter dropdown

  // Helper function to get the right icon and text for a given location type
  const getLocationTypeInfo = (type: number) => {
    switch (type) {
      case 1: // Coaching
        return { icon: <UserSquare className="h-4 w-4 text-purple-500" />, text: "Coaching Center" };
      case 2: // Shopkeeper
        return { icon: <Store className="h-4 w-4 text-green-500" />, text: "Shopkeeper" };
      default: // School (type 0)
        return { icon: <Building2 className="h-4 w-4 text-blue-500" />, text: "School" };
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchTasks = async () => {
        try {
          setIsLoading(true);
          const response = await api.get('/monthly-tasks/my-tasks');
          setTasks(response.data);
        } catch (error) {
          console.error("Failed to fetch monthly tasks:", error);
          toast({
            title: "Error",
            description: "Could not load your assigned tasks.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchTasks();
    } else {
      // Reset filters when modal closes
      setSearchTerm('');
      setTypeFilter('all');
    }
  }, [isOpen, toast]);

  const handleToggleComplete = async (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );

    try {
      await api.post(`/monthly-tasks/${taskId}/complete`);
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({
        title: "Update Failed",
        description: "Could not sync status. Please try again.",
        variant: "destructive",
      });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        )
      );
    }
  };

  // Combined filtering logic for both search and dropdown
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchMatch = task.locationName.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'all' || task.locationType.toString() === typeFilter;
      return searchMatch && typeMatch;
    });
  }, [tasks, searchTerm, typeFilter]);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <ListChecks className="h-6 w-6 mr-2" />
            Monthly Task List ({completedCount}/{totalCount} Completed)
          </DialogTitle>
        </DialogHeader>
        
        {/* Filter Controls */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          <div className="relative col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in your task list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="col-span-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="0">School</SelectItem>
                <SelectItem value="1">Coaching Center</SelectItem>
                <SelectItem value="2">Shopkeeper</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="py-4 max-h-[50vh] overflow-y-auto pr-2">
          {isLoading ? (
            <p className="text-center">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>{tasks.length > 0 ? 'No tasks match your filters.' : 'No tasks have been assigned for this month.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const { icon, text } = getLocationTypeInfo(task.locationType);

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                      task.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.isCompleted}
                      onCheckedChange={() => handleToggleComplete(task.id)}
                      className="mt-1 h-5 w-5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium cursor-pointer ${
                          task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {task.locationName}
                      </label>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          {icon}
                          <span className="ml-1">{text}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {[task.city, task.district].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    {task.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}