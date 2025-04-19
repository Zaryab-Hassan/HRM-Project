"use client";
import React, { useState } from 'react';
import { FiDownload, FiDollarSign, FiCalendar, FiTrendingUp, FiX } from 'react-icons/fi';

type PayrollData = {
  currentSalary: number;
  nextPayDay: string;
  daysUntilPayday: number;
  ytdEarnings: number;
  payslips: Payslip[];
};

type Payslip = {
  payPeriod: string;
  paymentDate: string;
  netPay: number;
  status: 'Paid' | 'Pending';
  paymentMethod: string;
  earnings: PayslipItem[];
  deductions: PayslipItem[];
};

type PayslipItem = {
  description: string;
  amount: number;
};

const PayrollPage = () => {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Generate month options for filter
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (current year and previous year)
  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];
  
  // Sample payroll data
  const payrollData: PayrollData = {
    currentSalary: 5000,
    nextPayDay: 'March 31, 2025',
    daysUntilPayday: 15,
    ytdEarnings: 15000,
    payslips: [
      {
        payPeriod: 'March 1 - March 31, 2025',
        paymentDate: 'March 31, 2025',
        netPay: 4500,
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
        earnings: [
          { description: 'Basic Salary', amount: 4000 },
          { description: 'Housing Allowance', amount: 500 },
          { description: 'Transport Allowance', amount: 300 },
          { description: 'Other Allowances', amount: 200 },
        ],
        deductions: [
          { description: 'Tax', amount: 400 },
          { description: 'Health Insurance', amount: 100 },
        ],
      },
      {
        payPeriod: 'February 1 - February 28, 2025',
        paymentDate: 'February 28, 2025',
        netPay: 4600,
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
        earnings: [
          { description: 'Basic Salary', amount: 4100 },
          { description: 'Housing Allowance', amount: 500 },
          { description: 'Transport Allowance', amount: 300 },
          { description: 'Other Allowances', amount: 200 },
        ],
        deductions: [
          { description: 'Tax', amount: 450 },
          { description: 'Health Insurance', amount: 100 },
        ],
      },
    ],
  };

  const { currentSalary, nextPayDay, daysUntilPayday, ytdEarnings, payslips } = payrollData;

  // Calculate Year-to-Date earnings
  const calculateYTDEarnings = () => {
    return payslips.reduce((total, payslip) => total + payslip.netPay, 0);
  };

  // Filter payslips by selected month and year
  const filteredPayslips = payslips.filter(payslip => {
    const payslipDate = new Date(payslip.paymentDate);
    return payslipDate.getMonth() === selectedMonth && 
           payslipDate.getFullYear() === selectedYear;
  });

  // Handle viewing payslip details
  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  // Handle downloading payslip
  const handleDownloadPayslip = (payslip: Payslip) => {
    console.log(`Downloading payslip for ${payslip.payPeriod}`);
    // Logic to download payslip
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Payroll</h1>

        {/* Salary Overview Box */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white mb-4">
                <FiDollarSign className="mr-2 text-green-500" /> Current Salary
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                ${currentSalary.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gross Monthly Salary
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white mb-4">
                <FiCalendar className="mr-2 text-blue-500" /> Next Payday
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {nextPayDay}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {daysUntilPayday} days remaining
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white mb-4">
                <FiTrendingUp className="mr-2 text-purple-500" /> Year-to-Date
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                ${calculateYTDEarnings().toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total earnings in {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* Payslips Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Payslips</h2>
          </div>
          
          <div className="p-6">
            {/* Month and Year Filter */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center">
                <label htmlFor="month-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Month:</label>
                <select
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <label htmlFor="year-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                <select
                  id="year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => {
                  setSelectedMonth(currentDate.getMonth());
                  setSelectedYear(currentDate.getFullYear());
                }}
                className="text-sm py-1 px-3 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Current Month
              </button>
            </div>
            
            {filteredPayslips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-xs uppercase text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">Pay Period</th>
                      <th className="px-6 py-3 text-left">Payment Date</th>
                      <th className="px-6 py-3 text-left">Net Pay</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayslips.map((payslip, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-gray-800 dark:text-white">
                          {payslip.payPeriod}
                        </td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">
                          {payslip.paymentDate}
                        </td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">
                          ${payslip.netPay.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payslip.status === 'Paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {payslip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewPayslip(payslip)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>No payslips available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payslip Modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Payslip Details - {selectedPayslip.payPeriod}
                </h3>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              
              {/* Modal body */}
              <div className="p-6">
                {/* Pay Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Pay Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pay Period</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedPayslip.payPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Date</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedPayslip.paymentDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedPayslip.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedPayslip.status}</p>
                    </div>
                  </div>
                </div>
                
                {/* Earnings */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Earnings</h4>
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedPayslip.earnings.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-800 dark:text-white">{item.description}</td>
                          <td className="px-4 py-3 text-right text-gray-800 dark:text-white">${item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="px-4 py-3 text-gray-800 dark:text-white">Total Earnings</td>
                        <td className="px-4 py-3 text-right text-gray-800 dark:text-white">
                          ${selectedPayslip.earnings.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Deductions */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Deductions</h4>
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedPayslip.deductions.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-800 dark:text-white">{item.description}</td>
                          <td className="px-4 py-3 text-right text-gray-800 dark:text-white">${item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="px-4 py-3 text-gray-800 dark:text-white">Total Deductions</td>
                        <td className="px-4 py-3 text-right text-gray-800 dark:text-white">
                          ${selectedPayslip.deductions.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Net Pay */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">Net Pay</h4>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">${selectedPayslip.netPay.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Modal footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayslip)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  <FiDownload className="mr-2" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollPage;