import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdKeyboardBackspace } from 'react-icons/md';
import axios from 'axios';
import { userDataContext } from '../context/UserContext';

function Customize2() {
  const [assistantName, setAssistantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const { serverUrl, setUserData } = useContext(userDataContext);

  const handleSubmit = async () => {
    if (!assistantName.trim()) return;
    setLoading(true);
    setErr("");

    try {
      const res = await axios.post(
        `${serverUrl}/api/user/update`,
        { assistantName },
        { withCredentials: true }
      );

      setUserData(res.data); // ✅ update user context
      navigate("/"); // ✅ go to Home
    } catch (error) {
      setErr("❌ Failed to save assistant name. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full h-screen bg-gradient-to-t from-black to-[#030353] flex justify-center items-center flex-col p-[20px]'>

      <MdKeyboardBackspace
        className='absolute top-[30px] left-[30px] text-white w-[25px] h-[25px] cursor-pointer'
        onClick={() => navigate("/customize")}
      />

      <h1 className='text-white mb-[40px] text-[30px] text-center'>
        Enter Your <span className='text-blue-200'>Assistant Name</span>
      </h1>

      <input
        type="text"
        placeholder='e.g., Shifra'
        onChange={(e) => setAssistantName(e.target.value)}
        value={assistantName}
        className='w-full max-w-[600px] h-[60px] outline-none
        border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px]
        rounded-full text-[18px]'
        required
        disabled={loading}
      />

      {err && <p className='text-red-500 mt-2'>{err}</p>}

      {assistantName && (
        <button
          className='min-w-[300px] h-[60px] mt-[30px] text-black font-semibold 
          bg-white rounded-full text-[19px]'
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Create Your Assistant"}
        </button>
      )}
    </div>
  );
}

export default Customize2;
