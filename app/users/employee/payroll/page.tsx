'use client';

import { useState, useEffect, useRef } from 'react';
import { FiCreditCard, FiDownload, FiFilter, FiCalendar, FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi';

// Update the PayrollRecord type to include the descriptions
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

export default function EmployeePayroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const tableRef = useRef<HTMLTableElement>(null);

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
          const formattedDate = new Date(payslipData.paymentDate).toLocaleDateString();
          
          payslipWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Payslip - ${payslipData.month} ${payslipData.year}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background-color: #f9f9f9; 
                }
                .payslip { 
                  max-width: 800px; 
                  margin: 0 auto; 
                  background-color: white; 
                  border: 1px solid #ddd; 
                  box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                  padding: 30px; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  padding-bottom: 20px; 
                  border-bottom: 2px solid #333; 
                }
                .company-name { 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-bottom: 5px; 
                }
                .payslip-title { 
                  font-size: 18px; 
                  color: #666; 
                }
                .employee-info { 
                  margin-bottom: 30px; 
                }
                .info-row { 
                  display: flex; 
                  margin-bottom: 10px; 
                }
                .info-label { 
                  width: 200px; 
                  font-weight: bold; 
                }
                .salary-details { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 30px; 
                }
                .salary-details th, .salary-details td { 
                  padding: 10px; 
                  text-align: left; 
                  border-bottom: 1px solid #ddd; 
                }
                .salary-details th { 
                  background-color: #f2f2f2; 
                  font-weight: bold; 
                }
                .description { 
                  font-style: italic; 
                  color: #666; 
                  font-size: 14px; 
                  padding-left: 20px; 
                }
                .total-row { 
                  font-weight: bold; 
                }
                .print-button { 
                  background-color: #4CAF50; 
                  color: white; 
                  padding: 10px 20px; 
                  border: none; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  font-size: 16px; 
                  margin-top: 20px; 
                }
                .note { 
                  font-size: 12px; 
                  color: #666; 
                  margin-top: 30px; 
                  padding-top: 20px; 
                  border-top: 1px solid #ddd; 
                }
                @media print {
                  .print-button { 
                    display: none; 
                  }
                  body { 
                    background-color: white; 
                    padding: 0; 
                  }
                  .payslip { 
                    box-shadow: none; 
                    border: none; 
                  }
                }
              </style>
            </head>
            <body>
              <div class="payslip">
                <div class="header">
                  <div class="company-name">HRM Company Ltd.</div>
                  <div class="payslip-title">PAYSLIP</div>
                </div>

                <div class="employee-info">
                  <div class="info-row">
                    <div class="info-label">Employee Name:</div>
                    <div>${payslipData.employeeName}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Position:</div>
                    <div>${payslipData.position}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Pay Period:</div>
                    <div>${payslipData.month} ${payslipData.year}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Payment Date:</div>
                    <div>${formattedDate}</div>
                  </div>
                </div>

                <table class="salary-details">
                  <tr>
                    <th>Earnings</th>
                    <th>Amount (PKR)</th>
                  </tr>
                  <tr>
                    <td>Base Salary</td>
                    <td>${payslipData.baseSalary.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Bonuses</td>
                    <td>${payslipData.bonuses.toLocaleString()}</td>
                  </tr>
                  ${payslipData.bonusDescription ? `<tr>
                    <td colspan="2" class="description">Bonus Details: ${payslipData.bonusDescription}</td>
                  </tr>` : ''}
                  <tr>
                    <td>Gross Pay</td>
                    <td>${(payslipData.baseSalary + payslipData.bonuses).toLocaleString()}</td>
                  </tr>
                  
                  <tr>
                    <th>Deductions</th>
                    <th>Amount (PKR)</th>
                  </tr>
                  <tr>
                    <td>Total Deductions</td>
                    <td>${payslipData.deductions.toLocaleString()}</td>
                  </tr>
                  ${payslipData.deductionDescription ? `<tr>
                    <td colspan="2" class="description">Deduction Details: ${payslipData.deductionDescription}</td>
                  </tr>` : ''}
                  
                  <tr class="total-row">
                    <td>Net Salary</td>
                    <td>${payslipData.netSalary.toLocaleString()}</td>
                  </tr>
                </table>

                <button class="print-button" onclick="window.print()">Print Payslip</button>
                
                <div class="note">
                  <p>This is a computer-generated document. No signature is required.</p>
                  <p>For any queries regarding this payslip, please contact HR department.</p>
                </div>
              </div>
            </body>
            </html>
          `);

          payslipWindow.document.close();
        } else {
          alert('Failed to open payslip. Please check if popup is blocked in your browser.');
        }
      } else {
        throw new Error('Failed to process payslip data');
      }
    } catch (err: any) {
      console.error('Error downloading payslip:', err);
      alert(`Error: ${err.message || 'Failed to download payslip'}`);
    }
  };

  // Check if button is near the bottom of the table to determine tooltip position
  const checkTooltipPosition = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (tableRef.current) {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const tableRect = tableRef.current.getBoundingClientRect();
      const distanceFromBottom = tableRect.bottom - buttonRect.bottom;
      
      // If button is within 150px of the table bottom, show tooltip above
      setTooltipPosition(distanceFromBottom < 150 ? 'top' : 'bottom');
    }
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
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {totalEarned.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <FiCreditCard className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Bonuses</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">PKR {totalBonuses.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <FiCreditCard className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Deductions</p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">PKR {totalDeductions.toLocaleString()}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <FiCreditCard className="text-red-600 dark:text-red-400" />
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
              <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">PKR {record.baseSalary}</td>
                      <td className="px-6 py-4 whitespace-normal dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="text-green-600 dark:text-green-400">
                            +PKR {record.bonuses}
                          </span>
                          {record.bonusDescription && (
                            <div className="relative">
                              <button 
                                className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:underline flex items-center"
                                onMouseEnter={(e) => {
                                  checkTooltipPosition(e);
                                  setActiveTooltip(`bonus-${record._id}`);
                                }}
                                onMouseLeave={() => setActiveTooltip(null)}
                              >
                                <FiAlertCircle className="mr-1" size={12} />
                                View details
                              </button>
                              {activeTooltip === `bonus-${record._id}` && (
                                <div className={`absolute z-10 w-64 p-2 text-xs rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                                  ${tooltipPosition === 'bottom' ? 'mt-1' : 'bottom-full mb-1'} max-h-[200px] overflow-y-auto whitespace-normal break-words`}>
                                  {record.bonusDescription}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="text-red-600 dark:text-red-400">
                            -PKR {record.deductions}
                          </span>
                          {record.deductionDescription && (
                            <div className="relative">
                              <button 
                                className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:underline flex items-center"
                                onMouseEnter={(e) => {
                                  checkTooltipPosition(e);
                                  setActiveTooltip(`deduction-${record._id}`);
                                }}
                                onMouseLeave={() => setActiveTooltip(null)}
                              >
                                <FiAlertCircle className="mr-1" size={12} />
                                View details
                              </button>
                              {activeTooltip === `deduction-${record._id}` && (
                                <div className={`absolute z-10 w-64 p-2 text-xs rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                                  ${tooltipPosition === 'bottom' ? 'mt-1' : 'bottom-full mb-1'} max-h-[200px] overflow-y-auto whitespace-normal break-words`}>
                                  {record.deductionDescription}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold dark:text-white">PKR {record.netSalary}</td>
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
                          onMouseEnter={(e) => {
                            setActiveTooltip(record._id);
                            checkTooltipPosition(e);
                          }}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <FiDownload className="mr-1" /> Payslip
                        </button>
                        {activeTooltip === record._id && (
                          <div className={`absolute z-10 p-2 text-sm text-white bg-black rounded-md 
                            ${tooltipPosition === 'top' ? '-translate-y-full mb-2' : 'translate-y-full mt-2'}`}>
                            {tooltipPosition === 'top' ? 'Download Payslip' : 'Click to Download'}
                          </div>
                        )}
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