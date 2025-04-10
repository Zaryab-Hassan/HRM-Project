"use client";
import { useForm } from "react-hook-form";

const LoginModal = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-96 relative z-50">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Login</h2>
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