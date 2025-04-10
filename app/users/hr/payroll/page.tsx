'use client';
import { useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';

export default function PayrollManagement() {
  const [activeTab, setActiveTab] = useState('current');

  // Sample data
  const employees = [
    { id: 1, name: 'John Doe', baseSalary: 5000, bonuses: 500, deductions: 200, loan: 1000 }
  ];

  return (
    <div className='dark:bg-gray-900 p-6'>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Payroll Management</h1>

      {/* Current Month Salary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Salary This Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="border rounded-lg p-4 dark:border-gray-700">
              <h3 className="font-medium dark:text-white">{emp.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm dark:text-gray-300">Base: ${emp.baseSalary}</p>
                <p className="text-sm dark:text-gray-300">+ Bonuses: ${emp.bonuses}</p>
                <p className="text-sm dark:text-gray-300">- Deductions: ${emp.deductions}</p>
                <p className="text-sm dark:text-gray-300">- Loan: ${emp.loan}</p>
                <p className="font-medium mt-2 dark:text-white">
                  Net Salary: ${emp.baseSalary + emp.bonuses - emp.deductions - emp.loan}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 ${activeTab === 'records' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}
        >
          <FiFileText className="inline mr-2" /> Salary Records
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 ${activeTab === 'calculator' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}
        >
          <FaCalculator className="inline mr-2" /> Salary Calculator
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
          {/* Salary records implementation */}
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
          {/* Salary calculator implementation */}
        </div>
      )}

      {/* Loan Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Loan Management</h2>
        {/* Loan management implementation */}
      </div>
    </div>
  );
}