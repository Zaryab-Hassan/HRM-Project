"use client";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

const LoginModal = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Fetch the session role
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      const userRole = session?.user?.role || 'employee';

      // Redirect based on role
      if (userRole === 'hr') {
        router.push('/users/hr');
      } else if (userRole === 'employee') {
        router.push('/users/employee');
      } else {
        router.push('/users/manager');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-96 relative z-50">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Login</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-4">Email</label>
            <input
              type="email"
              placeholder="Enter your Email"
              className="w-full p-2 shadow-lg border-0 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              {...register("email", { required: true })}
            />
            <br />
            {errors.email && <span className="text-sm text-red-500 dark:text-red-400">This field is required</span>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-4">Password</label>
            <input
              type="password"
              placeholder="Enter your Password"
              {...register("password", { required: true })}
              className="w-full p-2 shadow-lg border-0 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
            <br />
            {errors.password && <span className="text-sm text-red-500 dark:text-red-400">This field is required</span>}
          </div>
          <button
            type="submit"
            className="w-full bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 dark:hover:bg-pink-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;