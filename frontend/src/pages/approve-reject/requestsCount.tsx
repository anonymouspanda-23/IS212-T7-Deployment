// usePendingCount.ts
import { useState, useEffect } from "react";

// Global variables to hold the state and subscribers
let globalPendingCount = 0;
const subscribers = new Set<(count: number) => void>();

// Hook to manage the global pending count
export const usePendingCount = () => {
  const [pendingCount, setPendingCount] = useState(globalPendingCount);

  // Subscribe the component to state changes
  useEffect(() => {
    const handlePendingCountChange = (count: number) => setPendingCount(count);
    subscribers.add(handlePendingCountChange);

    // Cleanup: remove subscription on component unmount
    return () => {
      subscribers.delete(handlePendingCountChange);
    };
  }, []);

  // Function to update the global pending count and notify all subscribers
  const updatePendingCount = (count: number) => {
    globalPendingCount = count;
    subscribers.forEach((callback) => callback(count)); // Notify all subscribers
  };

  return [pendingCount, updatePendingCount] as const;
};
