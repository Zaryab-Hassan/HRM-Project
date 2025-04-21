// app/payroll-management/page.tsx
'use client';

import { useState } from 'react';
import { FiDollarSign, FiFilter, FiEdit, FiCheck, FiX, FiSearch } from 'react-icons/fi';

type EmployeeSalary = {
  id: number;
  name: string;
  position: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Processing';
};

type LoanApplication = {
  id: number;
  employeeName: string;
  amount: number;
  purpose: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  applicationDate: string;
};

export default function PayrollManagement() {
  // Sample salary data
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([
    { id: 101, name: 'John Doe', position: 'Manager', baseSalary: 5000, bonuses: 500, deductions: 200, netSalary: 5300, status: 'Paid' },
    { id: 102, name: 'Jane Smith', position: 'Developer', baseSalary: 4000, bonuses: 300, deductions: 150, netSalary: 4150, status: 'Pending' },
    { id: 103, name: 'Alex Wong', position: 'Designer', baseSalary: 3500, bonuses: 200, deductions: 100, netSalary: 3600, status: 'Processing' },
  ]);

  // Sample loan data
  const [loans, setLoans] = useState<LoanApplication[]>([
    { id: 1, employeeName: 'John Doe', amount: 2000, purpose: 'Home renovation', status: 'Pending', applicationDate: '2023-06-10' },
    { id: 2, employeeName: 'Jane Smith', amount: 1500, purpose: 'Medical expenses', status: 'Approved', applicationDate: '2023-06-05' },
  ]);

  const [monthFilter, setMonthFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSalaryId, setEditingSalaryId] = useState<number | null>(null);
  const [tempSalary, setTempSalary] = useState<Partial<EmployeeSalary>>({});

  // Filtered salaries
  const filteredSalaries = salaries.filter(salary => {
    const matchesSearch = salary.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         salary.id.toString().includes(searchTerm);
    return matchesSearch;
  });

  const handleEditSalary = (salary: EmployeeSalary) => {
    setEditingSalaryId(salary.id);
    setTempSalary({
      baseSalary: salary.baseSalary,
      bonuses: salary.bonuses,
      deductions: salary.deductions
    });
  };

  const handleSaveSalary = (id: number) => {
    setSalaries(salaries.map(salary => {
      if (salary.id === id && tempSalary.baseSalary !== undefined) {
        const newBase = tempSalary.baseSalary;
        const newBonuses = tempSalary.bonuses || 0;
        const newDeductions = tempSalary.deductions || 0;
        return {
          ...salary,
          baseSalary: newBase,
          bonuses: newBonuses,
          deductions: newDeductions,
          netSalary: newBase + newBonuses - newDeductions
        };
      }
      return salary;
    }));
    setEditingSalaryId(null);
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
                <option value="June">June 2023</option>
                <option value="May">May 2023</option>
                <option value="April">April 2023</option>
              </select>
            </div>
          </div>
        </div>

        {/* Salary Records */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
              <FiDollarSign className="dark:text-gray-300" /> Salary Records
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Base Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonuses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSalaries.map(salary => (
                  <tr key={salary.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap dark:text-white">{salary.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{salary.position}</td>
                    
                    {/* Editable Salary Fields */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalaryId === salary.id ? (
                        <input
                          type="number"
                          className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={tempSalary.baseSalary}
                          onChange={(e) => setTempSalary({...tempSalary, baseSalary: Number(e.target.value)})}
                        />
                      ) : (
                        <span className="dark:text-white">{salary.baseSalary}</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalaryId === salary.id ? (
                        <input
                          type="number"
                          className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={tempSalary.bonuses}
                          onChange={(e) => setTempSalary({...tempSalary, bonuses: Number(e.target.value)})}
                        />
                      ) : (
                        <span className="dark:text-white">{salary.bonuses}</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalaryId === salary.id ? (
                        <input
                          type="number"
                          className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={tempSalary.deductions}
                          onChange={(e) => setTempSalary({...tempSalary, deductions: Number(e.target.value)})}
                        />
                      ) : (
                        <span className="dark:text-white">{salary.deductions}</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap font-semibold dark:text-white">
                      {salary.netSalary}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${salary.status === 'Paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                          salary.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                          'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                        {salary.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalaryId === salary.id ? (
                        <button
                          onClick={() => handleSaveSalary(salary.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        >
                          <FiCheck />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditSalary(salary)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <FiEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loan Management */}
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