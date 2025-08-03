import React, { useContext, useState } from 'react';
import bg from '../assets/authBg.png';
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";

function SignUp() {
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        formData,
        { withCredentials: true }
      );

      setUserData(result.data);
      navigate("/customize");
    } catch (error) {
      setUserData(null);
      setErr(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-screen bg-cover flex justify-center items-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        onSubmit={handleSignUp}
        className="w-[90%] h-[700px] max-w-[600px] bg-[#00000062] 
        backdrop-blur shadow-lg shadow-black flex flex-col items-center
        justify-center gap-[20px] px-[20px]"
      >
        <h1 className="text-white text-[30px] font-semibold">
          Register to <span className="text-blue-400">Virtual Assistant</span>
        </h1>

        <input
          name="name"
          type="text"
          placeholder="Enter your Name"
          className="w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]"
          required
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />

        <div className="w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          {showPassword ? (
            <IoEyeOff
              className="absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <IoEye
              className="absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        {err && <p className="text-red-500 text-[17px]">*{err}</p>}

        <button
          type="submit"
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>

        <p
          className="text-white text-[18px] cursor-pointer"
          onClick={() => navigate("/signin")}
        >
          Already have an account?
          <span className="text-blue-400"> Sign In</span>
        </p>
      </form>
    </div>
  );
}

export default SignUp;
