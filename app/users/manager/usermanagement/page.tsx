"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import EmployeeManagement from "../../../../components/EmployeeManagement";

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: string; // Added role field
  status: string;
  joinDate: string;
}

export default function UserManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [terminatingEmployee, setTerminatingEmployee] = useState<string | null>(null);

  // Check authentication and authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role !== "manager") {
      // Redirect non-manager users
      router.push("/users/" + (session?.user?.role || "employee"));
    }
  }, [status, session, router]);

  // Don't render the page until we confirm the user is a manager
  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "manager")) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>;
  }

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/employee/profile/all");
        
        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await response.json();
        setEmployees(data.data || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching employees");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  // Handle terminate employee functionality
  const handleTerminateEmployee = async (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to employee details
    
    try {
      setTerminatingEmployee(employeeId);
      const response = await fetch('/api/employee/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, status: 'Terminated' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to terminate employee');
      }

      // Update the local state to reflect the termination
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp._id === employeeId ? { ...emp, status: 'Terminated' } : emp
        )
      );

      setError('');
      alert('Employee has been terminated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate employee');
    } finally {
      setTerminatingEmployee(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Employee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all employees in your department
          </p>
        </div>

        <EmployeeManagement 
          employees={employees}
          isLoading={isLoading}
          error={error}
          onTerminateEmployee={handleTerminateEmployee}
          terminatingEmployee={terminatingEmployee}
        />
      </div>
    </div>
  );
}