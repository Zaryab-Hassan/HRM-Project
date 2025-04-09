"use client";
import { useForm } from "react-hook-form";
const LoginModal = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data : any) => {
    console.log(data); // Form data on successful submission
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative z-50">
        
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-4">Email</label>
            <input
              type="email"
              placeholder="Enter your Email"
              className="w-full p-2 shadow-lg border-0"
              {...register("email", { required: true })}
            />
            <br />
            {errors.email && <span className="text-sm text-red-500">This field is required</span>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-4">Password</label>
            <input
              type="password"
              placeholder="Enter your Password"
              {...register("password", { required: true })}
              className="w-full p-2 shadow-lg"
            />
            <br />
            {errors.password && <span className="text-sm text-red-500">This field is required</span>}
          </div>
          <button
            type="submit"
            className="w-full bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
