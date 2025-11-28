// // src/app/dashboard/plan/map/PinpointControl.tsx
// 'use client';

// import { useMap } from '@vis.gl/react-google-maps';
// import { Button } from '@/components/ui/button';
// import { Crosshair } from 'lucide-react';

// interface PinpointControlProps {
//   onClick: () => void;
// }

// export function PinpointControl({ onClick }: PinpointControlProps) {
//   const map = useMap();

//   // This component doesn't do anything with the map instance yet,
//   // but it's good practice to have it available.

//   return (
//     <div className="absolute bottom-24 right-4 z-10">
//       <Button
//         variant="secondary"
//         size="icon"
//         className="h-12 w-12 rounded-full shadow-lg"
//         onClick={onClick}
//         title="Add My Current Location"
//       >
//         <Crosshair className="h-6 w-6" />
//       </Button>
//     </div>
//   );
// }
'use client';
import { Button } from '@/components/ui/button';
import { useMap } from '@vis.gl/react-google-maps';
import { Crosshair } from 'lucide-react';
interface PinpointControlProps {
  onClick: () => void;
}
export function PinpointControl({ onClick }: PinpointControlProps) {
  // --- YEH HAI CHANGE: Outer div aur absolute positioning ko hata diya gaya hai ---
  // Button ka size bhi adjust kiya gaya hai
  const map = useMap();
  return (
    <Button
      variant="secondary"
      size="icon"
      className="rounded-full shadow-lg" // h-12 w-12 hata diya
      onClick={onClick}
      title="Add My Current Location"
    >
      <Crosshair className="h-5 w-5" />
    </Button>
  );
}