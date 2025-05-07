'use client';

import { FiCreditCard, FiEdit, FiCheck, FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { useState, useRef } from 'react';

export type EmployeeSalary = {
  id: number;
  name: string;
  position: string;
  baseSalary: number;
  bonuses: number;
  bonusDescription?: string;
  deductions: number;
  deductionDescription?: string;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Processing';
};

type SalaryRecordProps = {
  salaries: EmployeeSalary[];
  onSaveSalary: (id: number, updates: { 
    baseSalary: number, 
    bonuses: number, 
    bonusDescription?: string,
    deductions: number,
    deductionDescription?: string 
  }) => void;
  onChangeStatus?: (id: number, newStatus: 'Paid' | 'Pending' | 'Processing') => void;
  searchTerm: string;
};

export default function SalaryRecord({ salaries, onSaveSalary, onChangeStatus, searchTerm }: SalaryRecordProps) {
  const [editingSalaryId, setEditingSalaryId] = useState<number | null>(null);
  const [tempSalary, setTempSalary] = useState<Partial<EmployeeSalary>>({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const tableRef = useRef<HTMLDivElement>(null);

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
      bonusDescription: salary.bonusDescription || '',
      deductions: salary.deductions,
      deductionDescription: salary.deductionDescription || ''
    });
  };

  const handleSaveSalary = (id: number) => {
    if (tempSalary.baseSalary !== undefined) {
      onSaveSalary(id, {
        baseSalary: tempSalary.baseSalary,
        bonuses: tempSalary.bonuses || 0,
        bonusDescription: tempSalary.bonusDescription,
        deductions: tempSalary.deductions || 0,
        deductionDescription: tempSalary.deductionDescription
      });
    }
    setEditingSalaryId(null);
  };

  const handleStatusClick = (id: number) => {
    if (statusDropdownOpen === id) {
      setStatusDropdownOpen(null);
    } else {
      setStatusDropdownOpen(id);
    }
  };

  const handleStatusChange = (id: number, newStatus: 'Paid' | 'Pending' | 'Processing') => {
    const salary = salaries.find(s => s.id === id);
    
    // Only process if the status is different from the current one
    if (salary && salary.status !== newStatus && onChangeStatus) {
      onChangeStatus(id, newStatus);
    }
    
    setStatusDropdownOpen(null);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiCreditCard className="dark:text-gray-300" /> Salary Records
        </h2>
      </div>
      <div ref={tableRef} className="overflow-x-auto">
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
            {filteredSalaries.map((salary, index) => (
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
                    <div className="flex flex-col">
                      <input
                        type="number"
                        className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={tempSalary.bonuses}
                        onChange={(e) => setTempSalary({...tempSalary, bonuses: Number(e.target.value)})}
                      />
                      <textarea
                        placeholder="Bonus description"
                        className="w-32 mt-1 p-1 border rounded text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={tempSalary.bonusDescription}
                        onChange={(e) => setTempSalary({...tempSalary, bonusDescription: e.target.value})}
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-green-600 dark:text-green-400">
                        +{salary.bonuses}
                      </span>
                      {salary.bonusDescription && (
                        <div className="relative">
                          <button 
                            className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:underline flex items-center"
                            onMouseEnter={(e) => {
                              checkTooltipPosition(e);
                              setActiveTooltip(`bonus-${salary.id}`);
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <FiAlertCircle className="mr-1" size={12} />
                            View details
                          </button>
                          {activeTooltip === `bonus-${salary.id}` && (
                            <div className={`absolute z-10 w-64 p-2 text-xs rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                              ${tooltipPosition === 'bottom' ? 'mt-1' : 'bottom-full mb-1'} max-h-[200px] overflow-y-auto whitespace-normal break-words`}>
                              {salary.bonusDescription}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingSalaryId === salary.id ? (
                    <div className="flex flex-col">
                      <input
                        type="number"
                        className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={tempSalary.deductions}
                        onChange={(e) => setTempSalary({...tempSalary, deductions: Number(e.target.value)})}
                      />
                      <textarea
                        placeholder="Deduction description"
                        className="w-32 mt-1 p-1 border rounded text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={tempSalary.deductionDescription}
                        onChange={(e) => setTempSalary({...tempSalary, deductionDescription: e.target.value})}
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-red-600 dark:text-red-400">
                        -{salary.deductions}
                      </span>
                      {salary.deductionDescription && (
                        <div className="relative">
                          <button 
                            className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:underline flex items-center"
                            onMouseEnter={(e) => {
                              checkTooltipPosition(e);
                              setActiveTooltip(`deduction-${salary.id}`);
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <FiAlertCircle className="mr-1" size={12} />
                            View details
                          </button>
                          {activeTooltip === `deduction-${salary.id}` && (
                            <div className={`absolute z-10 w-64 p-2 text-xs rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                              ${tooltipPosition === 'bottom' ? 'mt-1' : 'bottom-full mb-1'} max-h-[200px] overflow-y-auto whitespace-normal break-words`}>
                              {salary.deductionDescription}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap font-semibold dark:text-white">
                  {salary.netSalary}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {onChangeStatus ? (
                    <div className="relative">
                      <button
                        onClick={() => handleStatusClick(salary.id)}
                        className={`px-2 flex items-center text-xs leading-5 font-semibold rounded-full 
                          ${salary.status === 'Paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                            salary.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}
                      >
                        {salary.status} <FiChevronDown className="ml-1" />
                      </button>
                      
                      {statusDropdownOpen === salary.id && (
                        <div className="absolute z-10 mt-1 w-36 bg-white dark:bg-gray-700 rounded-md shadow-lg">
                          <div className="py-1">
                            <button
                              onClick={() => handleStatusChange(salary.id, 'Paid')}
                              disabled={salary.status === 'Paid'}
                              className={`block w-full text-left px-4 py-2 text-sm 
                                ${salary.status === 'Paid' 
                                  ? 'bg-green-50 dark:bg-green-800 text-green-800 dark:text-green-200 cursor-not-allowed' 
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            >
                              {salary.status === 'Paid' ? 'Paid ✓' : 'Paid'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(salary.id, 'Pending')}
                              disabled={salary.status === 'Pending'}
                              className={`block w-full text-left px-4 py-2 text-sm 
                                ${salary.status === 'Pending' 
                                  ? 'bg-yellow-50 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 cursor-not-allowed' 
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            >
                              {salary.status === 'Pending' ? 'Pending ✓' : 'Pending'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(salary.id, 'Processing')}
                              disabled={salary.status === 'Processing'}
                              className={`block w-full text-left px-4 py-2 text-sm 
                                ${salary.status === 'Processing' 
                                  ? 'bg-blue-50 dark:bg-blue-800 text-blue-800 dark:text-blue-200 cursor-not-allowed' 
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            >
                              {salary.status === 'Processing' ? 'Processing ✓' : 'Processing'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${salary.status === 'Paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                        salary.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                        'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                      {salary.status}
                    </span>
                  )}
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
  );
}