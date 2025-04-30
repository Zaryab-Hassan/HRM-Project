'use client';

import { useState, useEffect } from 'react';
import { FiDollarSign, FiDownload, FiFilter, FiCalendar, FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi';

type PayrollRecord = {
  _id: string;
  name: string;
  position: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: number;
  status: string;
};

export default function EmployeePayroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employee payroll data
  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/employee/payroll?month=${selectedMonth}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payroll data');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setPayrollRecords(result.data);
        } else {
          throw new Error(result.error || 'Unknown error occurred');
        }
      } catch (err: any) {
        console.error('Error fetching payroll data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayrollData();
  }, [selectedMonth]);

  // Calculate salary statistics
  const totalEarned = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0);
  const totalBonuses = payrollRecords.reduce((sum, record) => sum + record.bonuses, 0);
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0);

  // Download pay slip for a record (dummy function)
  const handleDownloadPayslip = (record: PayrollRecord) => {
    if (record.status !== 'Paid') {
      alert('Payslip is only available for paid salaries.');
      return;
    }
    alert(`Downloading pay slip for ${record.month} ${record.year}`);
    // In a real application, this would generate and download a PDF
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">My Payroll</h1>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-100 dark:border-red-800">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Salary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Earned</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalEarned.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <FiDollarSign className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Bonuses</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">${totalBonuses.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <FiDollarSign className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Deductions</p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">${totalDeductions.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <FiDollarSign className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex mb-6">
          <div className="relative">
            <FiFilter className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            <select
              className="pl-10 pr-4 py-2 border rounded-lg appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
        
        {/* Payroll Records */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold dark:text-white">Salary History</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No payroll records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Base Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonuses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payrollRecords.map((record) => (<tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white flex items-center">
                        <FiCalendar className="mr-2 text-gray-400 dark:text-gray-500" />
                        {record.month} {record.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">${record.baseSalary}</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400">+${record.bonuses}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        <span className="text-red-600 dark:text-red-400">-${record.deductions}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold dark:text-white">${record.netSalary}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {record.status === 'Paid' ? (
                            <FiCheck className="text-green-500 text-lg" />
                          ) : (
                            <FiClock className="text-yellow-500 text-lg" />
                          )}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${record.status === 'Paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                              record.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                              'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          className={`flex items-center ${
                            record.status === 'Paid'
                              ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          }`}
                          onClick={() => handleDownloadPayslip(record)}
                          disabled={record.status !== 'Paid'}
                        >
                          <FiDownload className="mr-1" /> Payslip
                        </button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}