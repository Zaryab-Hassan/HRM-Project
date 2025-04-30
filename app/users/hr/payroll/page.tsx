'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiAlertCircle } from 'react-icons/fi';
import SalaryRecord, { EmployeeSalary } from '../../../../components/payroll/SalaryRecord';

export default function HRPayroll() {
  // State for salary data from API
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [monthFilter, setMonthFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Fetch salary data from API
  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/payroll?month=${monthFilter}&search=${searchTerm}&department=${departmentFilter}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payroll data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform API data to match EmployeeSalary type
          const transformedData: EmployeeSalary[] = result.data.map((record: any) => ({
            id: record._id,
            name: record.name,
            position: record.position,
            baseSalary: record.baseSalary,
            bonuses: record.bonuses,
            deductions: record.deductions,
            netSalary: record.netSalary,
            status: record.status
          }));
          
          setSalaries(transformedData);
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching salary data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalaryData();
  }, [monthFilter, searchTerm, departmentFilter]);

  // Handle updating salary record in the database
  const handleSaveSalary = async (id: number, updates: { baseSalary: number, bonuses: number, deductions: number }) => {
    try {
      setError(null);
      
      const response = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...updates
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payroll record');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the local state with the updated record
        setSalaries(salaries.map(salary => {
          if (salary.id === id) {
            const updatedRecord = result.data;
            return {
              id: updatedRecord._id,
              name: updatedRecord.name,
              position: updatedRecord.position,
              baseSalary: updatedRecord.baseSalary,
              bonuses: updatedRecord.bonuses,
              deductions: updatedRecord.deductions,
              netSalary: updatedRecord.netSalary,
              status: updatedRecord.status
            };
          }
          return salary;
        }));
      } else {
        throw new Error(result.error || 'Failed to update record');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating salary:', err);
    }
  };

  // Handle changing salary status
  const handleChangeStatus = async (id: number, newStatus: 'Paid' | 'Pending' | 'Processing') => {
    try {
      setError(null);
      
      const response = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payroll status');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the local state with the updated status
        setSalaries(salaries.map(salary => {
          if (salary.id === id) {
            return {
              ...salary,
              status: newStatus
            };
          }
          return salary;
        }));
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating payroll status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Payroll Management</h1>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <FiFilter className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="All">All Months</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-100 dark:border-red-800">
            <span className="flex items-center">
              <FiAlertCircle className="mr-2" /> {error}
            </span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        ) : (
          <SalaryRecord 
            salaries={salaries}
            onSaveSalary={handleSaveSalary}
            onChangeStatus={handleChangeStatus}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  );
}