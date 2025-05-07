// app/hr/registration/page.tsx
'use client';

import { useState } from 'react';
import { FiUser, FiCalendar, FiDollarSign, FiClock, FiBell } from 'react-icons/fi';

export default function HRRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    department: '',
    role: '',
    email: '',
    phone: '',
    emergencyContact: '',
    dob: '',
    initialSalary: '',
    currentSalary: '',
    shift: '',
    expiryDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = '';

      // Determine the endpoint based on role
      if (formData.role === 'admin') {
        endpoint = '/api/auth/register/admin';
      } else if (formData.role === 'manager') {
        endpoint = '/api/auth/register/manager';
      } else {
        endpoint = '/api/auth/register/employee';
      }

      // Create submission data with all required fields
      const submissionData = {
        ...formData,
        password: formData.cnic, // Set default password as CNIC
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Clear form on success
      setFormData({
        name: '',
        cnic: '',
        department: '',
        role: '',
        email: '',
        phone: '',
        emergencyContact: '',
        dob: '',
        initialSalary: '',
        currentSalary: '',
        shift: '',
        expiryDate: ''
      });

      alert('Registration successful! Default password is set to CNIC number.');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
    }
  }; return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Employee Registration</h1>

        <form onSubmit={handleSubmit} className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                <FiUser /> Personal Information
              </h2>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CNIC*</label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role*</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Department*</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Operations">Operations</option>
                  <option value="Operations">HR</option>
                  <option value="Operations">Sales</option>
                  <option value="Operations">Marketing</option>
                  <option value="Operations">Customer Support</option>
                </select>
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <FiBell /> Additional Information
            </h2>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Emergency Contact*</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date of Birth*</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Salary at Appointment (PKR)*</label>
                <input
                  type="number"
                  name="initialSalary"
                  value={formData.initialSalary}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current Salary (PKR)*</label>
                <input
                  type="number"
                  name="currentSalary"
                  value={formData.currentSalary}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shift*</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="Morning">Morning (9AM-5PM)</option>
                  <option value="Evening">Evening (2PM-10PM)</option>
                  <option value="Night">Night (10PM-6AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Expiry Date*</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}