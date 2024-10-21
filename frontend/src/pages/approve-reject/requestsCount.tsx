import { useState, useEffect, useCallback } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";

// Hook to manage the global pending count
export const usePendingCount = () => {
  const [pendingCount, setPendingCount] = useState(0); // Start with 0
  const { data: user } = useGetIdentity<EmployeeJWT>();

  // Function to fetch pending requests from the backend
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return; // Don't fetch if user is not defined
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getAllSubordinatesRequests`,
        {
          headers: { id: user.staffId },
        },
      );

      // Log the response to check its structure

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        // Filter the requests that are pending
        const pendingRequests = response.data.filter(
          (request: { status: string }) => request.status === "PENDING",
        );
        setPendingCount(pendingRequests.length);
      } else {
        console.error(
          "Expected response.data to be an array, but got:",
          response.data,
        );
        setPendingCount(0); // Set to 0 or handle accordingly
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  }, [user]); // Include user as a dependency

  useEffect(() => {
    fetchPendingRequests(); // Call fetchPendingRequests when user changes
  }, [fetchPendingRequests]); // Depend on the memoized function

  return { pendingCount, fetchPendingRequests }; // Return the pending count and fetch function
};
