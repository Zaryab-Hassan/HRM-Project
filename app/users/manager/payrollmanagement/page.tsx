// app/payroll-management/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiDollarSign, FiFilter, FiCheck, FiX, FiSearch, FiAlertCircle } from 'react-icons/fi';
import SalaryRecord, { EmployeeSalary } from '../../../../components/payroll/SalaryRecord';

type LoanApplication = {
  id: number;
  employeeName: string;
  amount: number;
  purpose: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  applicationDate: string;
};

export default function PayrollManagement() {
  // State for salary data from API
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sample loan data (unchanged)
  const [loans, setLoans] = useState<LoanApplication[]>([
    { id: 1, employeeName: 'John Doe', amount: 2000, purpose: 'Home renovation', status: 'Pending', applicationDate: '2023-06-10' },
    { id: 2, employeeName: 'Jane Smith', amount: 1500, purpose: 'Medical expenses', status: 'Approved', applicationDate: '2023-06-05' },
  ]);

  const [monthFilter, setMonthFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch salary data from API
  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/payroll?month=${monthFilter}&search=${searchTerm}`);
        
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
  }, [monthFilter, searchTerm]);

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

  const handleLoanAction = (id: number, action: 'approve' | 'reject') => {
    setLoans(loans.map(loan => 
      loan.id === id ? { ...loan, status: action === 'approve' ? 'Approved' : 'Rejected' } : loan
    ));
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

        {/* Loan Management (unchanged) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
              <FiDollarSign className="dark:text-gray-300" /> Loan Applications
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap dark:text-white">{loan.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{loan.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{loan.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{new Date(loan.applicationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${loan.status === 'Approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                          loan.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      {loan.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleLoanAction(loan.id, 'approve')}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          >
                            <FiCheck />
                          </button>
                          <button
                            onClick={() => handleLoanAction(loan.id, 'reject')}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}