"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiCreditCard, FiClock, FiCheck, FiX, FiCalendar } from 'react-icons/fi';

type LoanStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';
type LoanType = 'personal' | 'education' | 'medical' | 'housing' | 'emergency';

interface LoanApplication {
  _id: string;
  createdAt: string;
  employeeId: string;
  loanType: LoanType;
  amount: number;
  reason: string;
  durationMonths: number;
  monthlyInstallment: number;
  status: LoanStatus;
  approvedAt?: string;
  startDate?: string;
  endDate?: string;
}

// Simple calculator to estimate monthly payment
const calculateMonthlyInstallment = (amount: number, durationMonths: number): number => {
  // Simply divide the amount by duration with no interest
  return amount / durationMonths;
};

const LoanApplicationPage: React.FC = () => {
  const { data: session } = useSession();
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Mock loan balance for demonstration
  const [loanBalance, setLoanBalance] = useState({
    totalOutstanding: 12000,
    totalApproved: 15000,
    totalPaid: 3000
  });

  const [newLoan, setNewLoan] = useState<Omit<LoanApplication, '_id' | 'createdAt' | 'employeeId' | 'status' | 'approvedAt' | 'monthlyInstallment'>>({
    loanType: 'personal',
    amount: 0,
    reason: '',
    durationMonths: 12,
    startDate: undefined,
    endDate: undefined
  });

  const [estimatedPayment, setEstimatedPayment] = useState<number>(0);

  useEffect(() => {
    // Calculate estimated monthly payment when loan details change
    if (newLoan.amount > 0 && newLoan.durationMonths > 0) {
      setEstimatedPayment(
        calculateMonthlyInstallment(newLoan.amount, newLoan.durationMonths)
      );
    } else {
      setEstimatedPayment(0);
    }
  }, [newLoan.amount, newLoan.durationMonths]);

  useEffect(() => {
    const fetchLoanApplications = async () => {
      try {
        setIsLoading(true);
        // Call the actual API endpoint with year filter
        const response = await fetch(`/api/employee/loans?year=${selectedYear}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch loan applications');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setLoanApplications(result.data);
          
          // Update loan balance if available
          if (result.balance) {
            setLoanBalance({
              totalOutstanding: result.balance.totalOutstanding || 0,
              totalApproved: result.balance.totalApproved || 0,
              totalPaid: result.balance.totalPaid || 0
            });
          }
        } else {
          throw new Error(result.error || 'Failed to fetch loan applications');
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch loan applications');
        setIsLoading(false);
      }
    };

    fetchLoanApplications();
  }, [selectedYear]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setNewLoan(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'durationMonths' ? Number(value) : value
    }));
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!session?.user) {
      setSubmitError('User session not found. Please log in again.');
      return;
    }

    if (newLoan.amount <= 0) {
      setSubmitError('Loan amount must be greater than zero.');
      return;
    }

    if (newLoan.durationMonths <= 0) {
      setSubmitError('Loan duration must be greater than zero.');
      return;
    }

    try {
      // Call the actual API endpoint
      const response = await fetch('/api/employee/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLoan,
          monthlyInstallment: estimatedPayment
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit loan application');
      }
      
      // Add the new loan to the list
      setLoanApplications(prev => [result.data, ...prev]);
      
      // Reset the form
      setNewLoan({
        loanType: 'personal',
        amount: 0,
        reason: '',
        durationMonths: 12,
        startDate: undefined,
        endDate: undefined
      });
      
      alert('Loan application submitted successfully!');
    } catch (error) {
      console.error('Error submitting loan application:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit loan application');
    }
  };

  const handleDeleteApplication = async (id: string) => {
    // Find the application to check its status
    const application = loanApplications.find(app => app._id === id);
    
    if (!application) {
      alert('Loan application not found');
      return;
    }
    
    // Only allow deleting pending applications
    if (application.status !== 'Pending') {
      alert('Only pending loan applications can be deleted');
      return;
    }
    
    try {
      // Call the actual API endpoint
      const response = await fetch(`/api/employee/loans?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete loan application');
      }
      
      // Remove the deleted loan from the list
      setLoanApplications(prev => prev.filter(app => app._id !== id));
      alert('Loan application deleted successfully!');
    } catch (error) {
      console.error('Error deleting loan application:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete loan application');
    }
  };

  const getStatusBadge = (status: LoanStatus) => {
    const statusClasses = {
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>
        {status}
      </span>
    );
  };

  // Generate year options for filtering
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Loan Management</h1>
        
        {/* Loan Balance Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Loan Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Outstanding Balance</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">PKR {loanBalance.totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                  <FiCreditCard className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Total Approved</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {loanBalance.totalApproved.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <FiCreditCard className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Total Paid</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">PKR {loanBalance.totalPaid.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <FiCreditCard className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Apply for Loan Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Apply for a Loan</h2>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded dark:bg-red-900 dark:border-red-800 dark:text-red-200">
                {submitError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="loanType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loan Type
                </label>
                <select
                  id="loanType"
                  name="loanType"
                  value={newLoan.loanType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="personal">Personal Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="medical">Medical Loan</option>
                  <option value="housing">Housing Loan</option>
                  <option value="emergency">Emergency Loan</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loan Amount (PKR)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0"
                  step="100"
                  value={newLoan.amount || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="durationMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  id="durationMonths"
                  name="durationMonths"
                  min="1"
                  max="60"
                  value={newLoan.durationMonths}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Loan
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  value={newLoan.reason}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            
            {/* Loan Summary Box */}
            {estimatedPayment > 0 && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600">
                <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Principal Amount:</p>
                    <p className="text-md font-semibold text-gray-800 dark:text-white">PKR {newLoan.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration:</p>
                    <p className="text-md font-semibold text-gray-800 dark:text-white">{newLoan.durationMonths} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Payment:</p>
                    <p className="text-md font-semibold text-green-600 dark:text-green-400">PKR {estimatedPayment.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Submit Application
            </button>
          </form>
        </div>
        
        {/* Loan Applications Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">My Loan Applications</h2>
            
            {/* Year Filter */}
            <div className="flex items-center">
              <label htmlFor="year-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : loanApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                You haven't made any loan applications yet. Use the form above to submit your first application.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Application Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Loan Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Monthly Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {loanApplications.map(application => (
                    <tr key={application._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <FiCalendar className="mr-2 text-gray-400 dark:text-gray-500" />
                          {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {application.loanType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        PKR {application.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {application.durationMonths} months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">
                        PKR {application.monthlyInstallment.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          {application.status === 'Approved' ? (
                            <FiCheck className="text-green-500 text-lg" />
                          ) : application.status === 'Rejected' ? (
                            <FiX className="text-red-500 text-lg" />
                          ) : application.status === 'Paid' ? (
                            <FiCreditCard className="text-blue-500 text-lg" />
                          ) : (
                            <FiClock className="text-yellow-500 text-lg" />
                          )}
                          {getStatusBadge(application.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {application.status === 'Pending' && (
                          <button
                            onClick={() => handleDeleteApplication(application._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                        {application.status === 'Approved' && (
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => alert('Payment details would be shown here')}
                          >
                            View Details
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
};

export default LoanApplicationPage;