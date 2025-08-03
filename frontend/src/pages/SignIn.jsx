import React, { useContext, useState } from 'react';
import bg from '../assets/authBg.png';
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"; // Ensure axios is installed: npm install axios

function SignIn() {
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  // Accessing context for server URL and user data
  const { serverUrl, setUserData } = useContext(userDataContext);
  // React Router hook for navigation
  const navigate = useNavigate();

  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // State for error messages
  const [err, setErr] = useState("");
  // State for loading indicator
  const [loading, setLoading] = useState(false);

  /**
   * Handles the sign-in form submission.
   * Sends user credentials to the backend and fetches user data upon successful login.
   * @param {Event} e - The form submission event.
   */
  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setErr(""); // Clear previous errors
    setLoading(true); // Set loading state to true

    try {
      // 1. Attempt to sign in the user by sending email and password to the backend.
      // `withCredentials: true` is crucial here for sending and receiving HTTP-only cookies.
      await axios.post(`${serverUrl}/api/auth/signin`, {
        email,
        password,
      }, {
        withCredentials: true, // This ensures cookies (like session tokens) are sent/received
      });

      // 2. If sign-in is successful, immediately fetch the current user's data.
      // This request also needs `withCredentials: true` to send the newly set authentication cookie.
      const userRes = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });

      // Set the user data in the context
      setUserData(userRes.data);
      setLoading(false); // Reset loading state
      navigate("/"); // Navigate to the home page or dashboard upon success

    } catch (error) {
      // Log the full error object for detailed debugging
      console.error("Sign-in error:", error);

      // Reset user data and loading state on error
      setUserData(null);
      setLoading(false);

      // Determine the error message to display to the user
      let errorMessage = "Something went wrong. Please try again.";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server responded with error status:", error.response.status);
        console.error("Server error data:", error.response.data);
        console.error("Server error headers:", error.response.headers);

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Bad Request: Please check your input.";
        } else if (error.response.status === 401) {
          errorMessage = "Unauthorized: Invalid credentials or session expired.";
        } else if (error.response.status === 500) {
          errorMessage = "Internal Server Error: Something went wrong on the server.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error("No response received from server:", error.request);
        errorMessage = "No response from server. Please check your internet connection or server status.";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message);
        errorMessage = "Request setup failed. Please try again.";
      }

      setErr(errorMessage); // Set the error message to display in the UI
    }
  };

  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center'
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        onSubmit={handleSignIn}
        className='w-[90%] h-[700px] max-w-[600px] bg-[#00000062]
        backdrop-blur shadow-lg shadow-black flex flex-col items-center
        justify-center gap-[20px] px-[20px] rounded-2xl' /* Added rounded-2xl for consistency */
      >
        <h1 className='text-white text-[30px] font-semibold text-center'>
          Sign In to <span className='text-blue-400'>Virtual Assistant</span>
        </h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder='Email'
          className='w-full h-[60px] outline-none
          border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px]
          rounded-full text-[18px]'
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        {/* Password Input with Toggle */}
        <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative'>
          <input
            type={showPassword ? "text" : "password"}
            placeholder='Password'
            className='w-full h-full rounded-full
            outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]'
            required
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          {showPassword ? (
            <IoEyeOff
              className='absolute top-1/2 -translate-y-1/2 right-[20px] w-[25px] h-[25px] text-white cursor-pointer' // Centered icon vertically
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <IoEye
              className='absolute top-1/2 -translate-y-1/2 right-[20px] w-[25px] h-[25px] text-white cursor-pointer' // Centered icon vertically
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        {/* Error Message Display */}
        {err && (
          <p className='text-red-500 text-[17px] text-center'>
            *{err}
          </p>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]
          hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed' // Added hover, transition, and disabled styles
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        {/* Link to Sign Up */}
        <p
          className='text-white text-[18px] cursor-pointer'
          onClick={() => navigate("/signup")}
        >
          Want to create a new account?
          <span className='text-blue-400 hover:underline'> Sign Up</span> {/* Added hover effect */}
        </p>
      </form>
    </div>
  );
}

export default SignIn;
