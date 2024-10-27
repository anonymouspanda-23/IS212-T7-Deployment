import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";

import { useCustomNotificationProvider } from "@/components/toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const useReassignmentsCounts = () => {
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [hasActiveReassignment, setHasActiveReassignment] = useState<boolean>(false);
  const toast = useCustomNotificationProvider();
  
  useEffect(() => {
    if (user?.staffId) {
      getReassignmentStatus(user.staffId);
    } else {
      setHasActiveReassignment(false);
    }
  }, [user?.staffId]);

  const getReassignmentStatus = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getReassignmentStatus`,
        { headers: { id: staffId } }
      );
      
      const reassignmentStatuses = response.data;
      const activeReassignment = reassignmentStatuses.find(
        (reassignmentStatus: any) => reassignmentStatus.active === true && reassignmentStatus.status === "APPROVED"
      );
      setHasActiveReassignment(!!activeReassignment);

    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch request status.",
        type: "error",
      });
    }
  }

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch incoming reassignment requests
      const incomingResponse = await axios.get(
        `${backendUrl}/api/v1/getIncomingReassignmentRequests`,
        { headers: { id: user.staffId } }
      );
      
      // Count pending incoming reassignments
      const incomingPending = incomingResponse.data.filter(
        (reassignment: any) => reassignment.status === "PENDING"
      ).length;

      let handlePending = 0;
      // Only fetch subordinate requests if there's an active reassignment
      if (hasActiveReassignment) {
      // Fetch requests for temporary manager
      const handleResponse = await axios.get(
        `${backendUrl}/api/v1/getSubordinateRequestsForTempManager`,
        { headers: { id: user.staffId } }
      );
      
      // Count pending requests to handle
        handlePending = handleResponse.data.filter(
        (request: any) => request.status === "PENDING"
      ).length;
      }

      // Calculate and set the total pending count
      setTotalPendingCount(incomingPending + handlePending);
    } catch (error) {
      console.error("Error fetching reassignment counts:", error);
    }
  }, [user, hasActiveReassignment]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return { totalPendingCount, fetchCounts };
};
