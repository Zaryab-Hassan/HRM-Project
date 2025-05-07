'use client';

import { useState, useEffect, useRef } from 'react';
import { FiCreditCard, FiDownload, FiFilter, FiCalendar, FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi';
import { useSession } from 'next-auth/react';

// Update the PayrollRecord type to include descriptions
type PayrollRecord = {
  _id: string;
  name: string;
  position: string;
  baseSalary: number;
  bonuses: number;
  bonusDescription?: string;
  deductions: number;
  deductionDescription?: string;
  netSalary: number;
  month: string;
  year: number;
  status: string;
};

export default function HRPayroll() {
  const { data: session, status } = useSession();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const tableRef = useRef<HTMLTableElement>(null);

  // Fetch HR payroll data using the employee endpoint
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
  const totalEarned = payrollRecords
    .filter(record => record.status === 'Paid')
    .reduce((sum, record) => sum + record.netSalary, 0);
  const totalBonuses = payrollRecords
    .filter(record => record.status === 'Paid')
    .reduce((sum, record) => sum + record.bonuses, 0);
  const totalDeductions = payrollRecords
    .filter(record => record.status === 'Paid')
    .reduce((sum, record) => sum + record.deductions, 0);

  // Download pay slip for a record
  const handleDownloadPayslip = async (record: PayrollRecord) => {
    if (record.status !== 'Paid') {
      alert('Payslip is only available for paid salaries.');
      return;
    }

    try {
      const response = await fetch('/api/employee/payroll/payslip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId: record._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payslip');
      }

      const result = await response.json();
      
      if (result.success) {
        // Create a printable version of the payslip
        const payslipData = result.data;
        
        // Open a new window with the formatted payslip
        const payslipWindow = window.open('', '_blank');
        if (payslipWindow) {
          payslipWindow.document.write(`
            <html>
            <head>
              <title>Payslip - ${payslipData.month} ${payslipData.year}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 40px; }
                .payslip { max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #ddd; }
                .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .title { font-size: 20px; margin-bottom: 20px; color: #444; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
                .info-group { margin-bottom: 25px; }
                .info-label { font-weight: bold; color: #555; }
                .info-value { }
                .salary-breakdown { margin: 30px 0; }
                .salary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .salary-total { font-weight: bold; padding: 15px 0; border-top: 2px solid #ddd; }
                .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #666; }
                .print-button { display: block; margin: 30px auto; padding: 10px 20px; background: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
              </style>
            </head>
            <body>
              <div class="payslip">
                <div class="header">
                  <div class="company-name">HRM System Inc.</div>
                  <div class="title">Payslip for ${payslipData.month} ${payslipData.year}</div>
                </div>
                
                <div class="info-group">
                  <div class="info-row">
                    <div>
                      <div class="info-label">Employee Name</div>
                      <div class="info-value">${payslipData.employeeName}</div>
                    </div>
                    <div>
                      <div class="info-label">Position</div>
                      <div class="info-value">${payslipData.position}</div>
                    </div>
                  </div>
                </div>
                
                <div class="salary-breakdown">
                  <div class="salary-item">
                    <div class="info-label">Base Salary</div>
                    <div>PKR ${payslipData.baseSalary.toLocaleString()}</div>
                  </div>
                  <div class="salary-item">
                    <div class="info-label">Bonuses${payslipData.bonusDescription ? ` (${payslipData.bonusDescription})` : ''}</div>
                    <div>PKR ${payslipData.bonuses.toLocaleString()}</div>
                  </div>
                  <div class="salary-item">
                    <div class="info-label">Deductions${payslipData.deductionDescription ? ` (${payslipData.deductionDescription})` : ''}</div>
                    <div>PKR ${payslipData.deductions.toLocaleString()}</div>
                  </div>
                  <div class="salary-item salary-total">
                    <div>Net Salary</div>
                    <div>PKR ${payslipData.netSalary.toLocaleString()}</div>
                  </div>
                </div>
                
                <div class="footer">
                  <p>Payment Date: ${new Date(payslipData.paymentDate).toLocaleDateString()}</p>
                  <p>This is a computer-generated document and requires no signature.</p>
                </div>
              </div>
              
              <button class="print-button" onclick="window.print(); return false;">Print Payslip</button>
            </body>
            </html>
          `);
          payslipWindow.document.close();
        } else {
          alert('Please allow pop-ups to view your payslip.');
        }
      } else {
        throw new Error('Failed to generate payslip');
      }
    } catch (err: any) {
      console.error('Error downloading payslip:', err);
      alert(err.message || 'Failed to download payslip');
    }
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Payroll</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center">
            <div className="mr-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              <FiCreditCard className="text-xl" />
            </div>
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Earnings</h3>
              <p className="text-2xl font-bold mt-1 dark:text-white">{formatCurrency(totalEarned)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paid salaries</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center">
            <div className="mr-4 p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
              <FiCheck className="text-xl" />
            </div>
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Bonuses</h3>
              <p className="text-2xl font-bold mt-1 dark:text-white">{formatCurrency(totalBonuses)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Additional earnings</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center">
            <div className="mr-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
              <FiAlertCircle className="text-xl" />
            </div>
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Deductions</h3>
              <p className="text-2xl font-bold mt-1 dark:text-white">{formatCurrency(totalDeductions)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tax, insurance, etc.</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white mb-4 md:mb-0">Salary History</h2>
            
            <div className="flex items-center">
              <div className="mr-2 text-gray-600 dark:text-gray-400">
                <FiFilter className="inline mr-1" /> Filter by Month:
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="ml-2 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200"
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

        {/* Salary Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          {isLoading ? (
            <div className="p-6 animate-pulse">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-600 dark:text-red-400">
              <p>Error: {error}</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              <p>No payroll records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Base Salary</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonuses</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deductions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Salary</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payrollRecords.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                            <FiCalendar />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{record.month}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{record.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(record.baseSalary)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <div 
                            className="text-sm text-gray-900 dark:text-white cursor-help"
                            onMouseEnter={() => {
                              setActiveTooltip(`bonus-${record._id}`);
                              // Determine tooltip position based on table scroll
                              if (tableRef.current) {
                                const tableHeight = tableRef.current.clientHeight;
                                const tableScrollTop = tableRef.current.scrollTop;
                                const rowPosition = tableRef.current.getBoundingClientRect().top;
                                setTooltipPosition(rowPosition < tableHeight / 2 ? 'bottom' : 'top');
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            {formatCurrency(record.bonuses)}
                            {record.bonusDescription && (
                              <div className={`absolute z-10 transform ${
                                tooltipPosition === 'top' 
                                  ? 'bottom-full mb-2 -translate-y-2' 
                                  : 'top-full mt-2 translate-y-2'
                              } left-0 px-3 py-2 bg-gray-800 text-white text-xs rounded w-48 pointer-events-none transition-opacity duration-200 ${
                                activeTooltip === `bonus-${record._id}` ? 'opacity-100' : 'opacity-0'
                              }`}>
                                {record.bonusDescription}
                                <div className={`absolute ${
                                  tooltipPosition === 'top' 
                                    ? 'bottom-0 -mb-1 transform rotate-45' 
                                    : 'top-0 -mt-1 transform rotate-45'
                                } left-5 w-2 h-2 bg-gray-800`}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <div 
                            className="text-sm text-gray-900 dark:text-white cursor-help"
                            onMouseEnter={() => {
                              setActiveTooltip(`deduction-${record._id}`);
                              // Determine tooltip position
                              if (tableRef.current) {
                                const tableHeight = tableRef.current.clientHeight;
                                const tableScrollTop = tableRef.current.scrollTop;
                                const rowPosition = tableRef.current.getBoundingClientRect().top;
                                setTooltipPosition(rowPosition < tableHeight / 2 ? 'bottom' : 'top');
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            {formatCurrency(record.deductions)}
                            {record.deductionDescription && (
                              <div className={`absolute z-10 transform ${
                                tooltipPosition === 'top' 
                                  ? 'bottom-full mb-2 -translate-y-2' 
                                  : 'top-full mt-2 translate-y-2'
                              } left-0 px-3 py-2 bg-gray-800 text-white text-xs rounded w-48 pointer-events-none transition-opacity duration-200 ${
                                activeTooltip === `deduction-${record._id}` ? 'opacity-100' : 'opacity-0'
                              }`}>
                                {record.deductionDescription}
                                <div className={`absolute ${
                                  tooltipPosition === 'top' 
                                    ? 'bottom-0 -mb-1 transform rotate-45' 
                                    : 'top-0 -mt-1 transform rotate-45'
                                } left-5 w-2 h-2 bg-gray-800`}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(record.netSalary)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : record.status === 'Processing' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.status === 'Paid' && (
                          <button 
                            onClick={() => handleDownloadPayslip(record)}
                            className="text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300"
                          >
                            <FiDownload className="mr-1 inline-block" /> Payslip
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}