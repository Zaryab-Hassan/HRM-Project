"use client";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';

const LoginModal = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Extract and validate callback URL from query parameters
  const getCallbackUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawCallbackUrl = searchParams.get('callbackUrl');
    
    if (!rawCallbackUrl) return '';
    
    try {
      const decodedUrl = decodeURIComponent(rawCallbackUrl);
      
      // Basic URL validation
      const urlObj = new URL(decodedUrl, window.location.origin);
      const currentHost = window.location.hostname;
      
      // Only accept URLs from the same domain
      if (urlObj.hostname === currentHost || !urlObj.hostname) {
        return decodedUrl;
      }
      return ''; // Invalid domain
    } catch (e) {
      console.error('Invalid callback URL format:', rawCallbackUrl);
      return '';
    }
  }, []);
  
  // Function to determine redirect path based on user role
  const getRedirectPath = useCallback((userRole: string, callbackUrl: string) => {
    const rolePaths = {
      'hr': '/users/hr',
      'manager': '/users/manager',
      'employee': '/users/employee'
    };
    
    // Use callback URL if valid, otherwise use role-based path
    return callbackUrl || rolePaths[userRole as keyof typeof rolePaths] || '/users/employee';
  }, []);
  
  // Check if employee account is terminated
  const checkEmployeeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/employee/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.status === 'Terminated';
    } catch (error) {
      console.error('Error checking employee status:', error);
      return false;
    }
  }, []);
  
  // Handle redirect after successful login
  const handleRedirect = useCallback((url: string) => {
    // Direct URL navigation for most reliable cross-browser behavior
    window.location.href = url;
    
    // Backup redirect mechanism for edge cases
    setTimeout(() => {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.location.replace(url);
      }
    }, 1000);
  }, []);
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      const callbackUrl = getCallbackUrl();
      
      // Authenticate with credentials
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      // Handle authentication errors
      if (!result?.ok || result?.error) {
        throw new Error(result?.error || 'Authentication failed');
      }
      
      // Immediately fetch session to get user details
      const session = await getSession();
      
      if (!session?.user) {
        throw new Error('Failed to establish session');
      }
      
      // Get user role from session
      const userRole = session.user.role || 'employee';
      
      // Only check termination status for employees
      if (userRole === 'employee') {
        const isTerminated = await checkEmployeeStatus();
        
        if (isTerminated) {
          throw new Error('Your account has been terminated. Please contact HR for more information.');
        }
      }
      
      // Determine where to redirect the user
      const redirectTo = getRedirectPath(userRole, callbackUrl);
      
      console.log(`User authenticated as ${userRole}, redirecting to: ${redirectTo}`);
      
      // Reset loading state before redirection
      setIsLoading(false);
      
      // Perform the redirect
      handleRedirect(redirectTo);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen w-full bg-black bg-opacity-50 dark:bg-opacity-70 z-50">
      {/* Left side - Image */}
      <div className="hidden md:block w-2/3 relative">
        <div className="relative w-full h-full">
          <Image 
            src="/hr-background.jpg" 
            alt="HR Background" 
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-center items-start p-12">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to HRM System</h1>
            <p className="text-xl text-white/90">Manage your human resources efficiently</p>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full md:w-1/3 h-full flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-pink-900/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-pink-200 dark:bg-pink-800 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-200 dark:bg-pink-800 rounded-full translate-x-1/4 translate-y-1/4"></div>
          <div className="absolute top-1/4 right-0 w-20 h-20 bg-pink-300 dark:bg-pink-700 rounded-full translate-x-1/2"></div>
          <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-pink-300 dark:bg-pink-700 rounded-full -translate-x-1/2"></div>
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="w-full max-w-md mx-6 flex flex-col items-center relative z-10">
          <div className="w-full text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Login</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Enter your credentials to access your account</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 p-8 rounded-2xl shadow-xl w-full border border-white/50 dark:border-gray-700">
            {error && (
              <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 dark:ring-gray-600 dark:text-white dark:placeholder-gray-400 shadow-sm transition-all"
                    {...register("email", { required: true })}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <span className="text-sm text-red-500 dark:text-red-400 mt-1 block">Email is required</span>}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 dark:ring-gray-600 dark:text-white dark:placeholder-gray-400 shadow-sm transition-all"
                    {...register("password", { required: true })}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <span className="text-sm text-red-500 dark:text-red-400 mt-1 block">Password is required</span>}
              </div>

              <div className="flex items-center justify-between">
                
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 shadow-md flex items-center justify-center transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} HRM System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;