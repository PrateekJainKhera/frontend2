'use client';
import { useState, useEffect } from 'react';
// --- YEH HAI ASLI FIX: Ek naya, robust date parsing function ---
const parseAndFormatTimes = (timestamp: string) => {
    // Sabse pehle, hum jaasoosi karenge ki backend se kya aa raha hai.
    console.log("Original Timestamp from Backend:", timestamp);
    // Agar timestamp ke aakhir me 'Z' nahi hai, to use add karo.
    // 'Z' ka matlab hota hai ki yeh time UTC hai. Isse JavaScript aache se samajh paata hai.
    if (!timestamp.endsWith('Z')) {
        timestamp += 'Z';
    }
    const dateObject = new Date(timestamp);
    // Check karein ki date valid hai ya nahi
    if (isNaN(dateObject.getTime())) {
        console.error("Invalid timestamp received:", timestamp);
        return { relative: "Invalid time", absolute: "Invalid time" };
    }
    // --- Relative time (e.g., "5m ago") ---
    const now = new Date();
    const seconds = Math.round((now.getTime() - dateObject.getTime()) / 1000);
    let relative = '';
    if (seconds < 60) {
        relative = `${seconds}s ago`;
    } else if (seconds < 3600) {
        relative = `${Math.round(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
        relative = `${Math.round(seconds / 3600)}h ago`;
    } else {
        relative = `${Math.round(seconds / 86400)}d ago`;
    }
    // --- Absolute time (e.g., "26 Oct 2025, 5:30 PM") ---
    // 'en-IN' locale use karne se date (DD-MM-YYYY) aur time (AM/PM) Indian format me aayega.
    const absoluteIST = dateObject.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata' // Force IST conversion
    });
    const absoluteUTC = dateObject.toUTCString();
    // Debugging ke liye dono time return karenge
   // const absolute = `IST: ${absoluteIST} | UTC: ${absoluteUTC}`;
   const absolute = absoluteIST;


    return { relative, absolute };
};
export function TimeAgo({ timestamp }: { timestamp: string }) {
  const [timeAgo, setTimeAgo] = useState('');
  const [absoluteTime, setAbsoluteTime] = useState('');
  useEffect(() => {
    if (!timestamp) return;
    const updateTimes = () => {
      const { relative, absolute } = parseAndFormatTimes(timestamp);
      setTimeAgo(relative);
      setAbsoluteTime(absolute);
    };
    updateTimes(); // Pehli baar run karein
    const interval = setInterval(updateTimes, 10000); // Har 10 second me update karein
    return () => clearInterval(interval);
  }, [timestamp]); // Jab bhi timestamp prop badle, yeh effect dobara chalega
  return <span title={absoluteTime}>{timeAgo}</span>;
  }