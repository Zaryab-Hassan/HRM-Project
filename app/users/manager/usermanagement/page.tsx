"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiEdit, FiTrash2, FiEye, FiSearch } from "react-icons/fi";
import Link from "next/link";

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  joinDate: string;
}

export default function UserManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    return <div className="flex justify-center items-center min-h-screen">
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
        setFilteredEmployees(data.data || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching employees");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    if (searchTerm) {
      const filtered = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-6 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Employee Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all employees in your department
        </p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-100">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Employee
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Department
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Join Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr 
                      key={employee._id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => router.push(`/users/manager/usermanagement/${employee._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-pink-800 dark:text-pink-300 font-medium">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            employee.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : employee.status === "On Leave"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(employee.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md transition-colors dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 flex items-center gap-2"
                            title="Terminate Employee"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}