import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Hook to manage the global pending withdrawals count
export const usePendingWithdrawalsCount = () => {
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const { data: user } = useGetIdentity<EmployeeJWT>();

  // Function to fetch pending withdrawals from the backend
  const fetchPendingWithdrawals = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getSubordinatesWithdrawalRequests`,
        {
          headers: { id: user.staffId },
        }
      );

      if (Array.isArray(response.data)) {
        // Filter the withdrawals that are pending
        const pendingWithdrawals = response.data.filter(
          (withdrawal: { status: string }) => withdrawal.status === "PENDING"
        );
        setPendingWithdrawalsCount(pendingWithdrawals.length);
      } else {
        console.error(
          "Expected response.data to be an array, but got:",
          response.data
        );
        setPendingWithdrawalsCount(0);
      }
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingWithdrawals();
  }, [fetchPendingWithdrawals]);

  return { pendingWithdrawalsCount, fetchPendingWithdrawals };
};
