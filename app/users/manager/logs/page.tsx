'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { 
  Card, Text, Title, Badge, Divider, Table, 
  TextInput, Select, DateRangePicker 
} from '@/components/ui/ActivityLogsComponents';
import { exportActivityLogs } from '@/lib/exportLogs';
import LogInitializer from '@/components/LogInitializer';
import LogsTester from '@/components/LogsTester';

// Define activity log type
interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export default function LogsPage() {  const { data: session } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const logsPerPage = 20;

  // Fetch activity logs from API
  const fetchActivityLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        limit: logsPerPage.toString(),
        page: pageNum.toString()
      });
      
      if (filterRole !== 'all') {
        queryParams.append('userRole', filterRole);
      }
      
      if (filterModule !== 'all') {
        queryParams.append('module', filterModule);
      }
      
      if (dateRange[0] && dateRange[1]) {
        queryParams.append('startDate', dateRange[0].toISOString());        queryParams.append('endDate', dateRange[1].toISOString());
      }
      
      // Try to fetch from API
      const response = await fetch(`/api/activity-logs?${queryParams.toString()}`);
      
      // If API request successful, use real data
      if (response.ok) {
        const data = await response.json();
        
        if (data.logs && data.logs.length > 0) {
          // Format timestamps as Date objects
          const formattedLogs = data.logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          
          setLogs(formattedLogs);
          setTotalLogs(data.pagination.total);
          setTotalPages(data.pagination.pages);
        } else {
          // No logs found
          setLogs([]);
          setTotalLogs(0);
          setTotalPages(0);
          console.log('No activity logs found in the database.');
        }
        setLoading(false);
        return;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch logs');
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      setError(error.message || 'Failed to load activity logs');
    } finally {      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchActivityLogs(page);
  }, [page, filterRole, filterModule, dateRange]);
  
  // Add click-away listener for the export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('export-dropdown');
      const exportButton = document.getElementById('export-button');
      
      if (dropdown && !dropdown.classList.contains('hidden') && 
          exportButton && !exportButton.contains(event.target as Node) && 
          !dropdown.contains(event.target as Node)) {
        dropdown.classList.add('hidden');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || log.userRole === filterRole;
    const matchesModule = filterModule === 'all' || log.module === filterModule;
    
    // Date filter
    const matchesDate = !dateRange[0] || !dateRange[1] || 
      (log.timestamp >= dateRange[0] && log.timestamp <= dateRange[1]);
    
    return matchesSearch && matchesRole && matchesModule && matchesDate;
  });

  // Get unique modules for filter
  const modules = Array.from(new Set(logs.map(log => log.module)));

  // Format timestamp to readable format
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(date));
  };

  // Get badge color based on action type
  const getBadgeColor = (action: string): string => {    switch (action.toLowerCase()) {
      case 'login':
        return 'blue';
      case 'logout':
        return 'gray';
      case 'create':
        return 'green';
      case 'update':
        return 'yellow';
      case 'delete':
        return 'red';
      case 'view':
        return 'indigo';
      case 'download':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  // We now use real data from the database, no mock data needed
  return (
    <div className="p-6">
      {/* Add LogInitializer to create a sample log if none exist */}      <LogInitializer />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Title>System Activity Logs</Title>
          <Text>Monitor all user activities and system changes in real-time</Text>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <div className="relative inline-block">            <button
              id="export-button"
              onClick={() => {
                const dropdown = document.getElementById('export-dropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
              className="flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => exportActivityLogs(logs, 'csv', { filterRole, filterModule, dateRange })}
                className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </button>
              <button
                onClick={() => exportActivityLogs(logs, 'pdf', { filterRole, filterModule, dateRange })}
                className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">            <TextInput 
              icon={Search} 
              placeholder="Search by user, action or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">            <Select 
              icon={Filter}
              placeholder="Filter by role"
              value={filterRole}
              onValueChange={setFilterRole}
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </Select>
              <Select
              icon={Filter}
              placeholder="Filter by module"
              value={filterModule}
              onValueChange={setFilterModule}
            >
              <option value="all">All Modules</option>
              {modules.map((module) => (
                <option key={module} value={module}>{module.charAt(0).toUpperCase() + module.slice(1)}</option>
              ))}
            </Select>
            
            <DateRangePicker
              className="max-w-md mx-auto"
              value={dateRange}
              onValueChange={setDateRange}
              placeholder="Filter by date range"
              selectPlaceholder="Select"
              color="rose"
            />
          </div>
        </div>
          <Divider />
        
        {error && (
          <div className="my-4 p-4 border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <div className="flex">
              <div className="flex-shrink-0">
                {/* Error icon */}
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchActivityLogs(page);
                  }}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
          {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-center p-6 max-w-sm mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No activity logs found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No activity logs match your current filters. Try adjusting your filters or create new activities in the system.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => fetchActivityLogs(1)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Action</th>
                    <th className="p-3 text-left">Module</th>
                    <th className="p-3 text-left">Details</th>
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-left">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3">
                        <div>
                          <Text className="font-medium">{log.userName}</Text>
                          <Text className="text-xs text-gray-500">{log.userRole}</Text>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge color={getBadgeColor(log.action)} size="sm">
                          {log.action.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Text>{log.module.charAt(0).toUpperCase() + log.module.slice(1)}</Text>
                      </td>
                      <td className="p-3">
                        <Text>{log.details}</Text>
                      </td>
                      <td className="p-3">
                        <Text>{formatDate(log.timestamp)}</Text>
                      </td>
                      <td className="p-3">
                        <Text>{log.ipAddress}</Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
              <div className="mt-4 flex justify-between items-center">
              <div className="text-gray-500 text-sm">
                Showing {filteredLogs.length} of {totalLogs} logs
              </div>
              
              {/* Pagination controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                  className={`px-3 py-1 rounded ${
                    page === 1 || loading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || loading}
                  className={`px-3 py-1 rounded ${
                    page === totalPages || loading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}      </Card>
      
      {/* Add LogsTester for debugging */}
      <div className="mb-6">
        <LogsTester />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Title>Login Activity</Title>
          <Text>Most recent login sessions</Text>
          <Divider />
          <div className="space-y-4 mt-4">
            {logs
              .filter(log => log.action.toLowerCase() === 'login')
              .slice(0, 5)
              .map(log => (
                <div key={log.id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-2">
                  <div>
                    <Text className="font-medium">{log.userName}</Text>
                    <Text className="text-xs text-gray-500">{formatDate(log.timestamp)}</Text>
                  </div>
                  <Badge color="blue" size="sm">LOGIN</Badge>
                </div>
              ))
            }
          </div>
        </Card>
        
        <Card>
          <Title>Critical Activities</Title>
          <Text>Delete and modification events</Text>
          <Divider />
          <div className="space-y-4 mt-4">
            {logs
              .filter(log => ['delete', 'update'].includes(log.action.toLowerCase()))
              .slice(0, 5)
              .map(log => (
                <div key={log.id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-2">
                  <div>
                    <Text className="font-medium">{log.details}</Text>
                    <Text className="text-xs text-gray-500">{log.userName} - {formatDate(log.timestamp)}</Text>
                  </div>
                  <Badge color={log.action.toLowerCase() === 'delete' ? 'red' : 'yellow'} size="sm">
                    {log.action.toUpperCase()}
                  </Badge>
                </div>
              ))
            }
          </div>
        </Card>
        
        <Card>
          <Title>Activity By Module</Title>
          <Text>Where users are most active</Text>
          <Divider />
          <div className="space-y-4 mt-4">
            {modules.slice(0, 5).map(module => {
              const count = logs.filter(log => log.module === module).length;
              const percentage = Math.round((count / logs.length) * 100);
              
              return (
                <div key={module} className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <Text>{module.charAt(0).toUpperCase() + module.slice(1)}</Text>
                    <Text className="text-sm">{count} activities ({percentage}%)</Text>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div 
                      className="bg-pink-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}