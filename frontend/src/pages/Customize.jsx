// ✅ Customize.jsx (frontend)
import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiImageAddLine } from 'react-icons/ri';
import { MdKeyboardBackspace } from 'react-icons/md';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';

// Images
import image1 from "../assets/image1.png";
import image2 from "../assets/image2.jpg";
import authBg from "../assets/authBg.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.jpeg";
import image7 from "../assets/image7.jpeg";

function Customize() {
  const {
    frontendImage,
    setFrontendImage,
    setBackendImage,
    setUserData,
    serverUrl,
  } = useContext(userDataContext);

  const navigate = useNavigate();
  const inputImage = useRef();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const defaultImages = [image1, image2, authBg, image4, image5, image6, image7];

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileURL = URL.createObjectURL(file);
    setBackendImage(file);
    setFrontendImage(fileURL);
    setSelectedImage(fileURL);
    setIsUploaded(true);
  };

  const handleNext = async () => {
    setUploading(true);
    setError("");
    try {
      let imageUrl = selectedImage;

      if (isUploaded) {
        const formData = new FormData();
        formData.append("assistantImage", inputImage.current.files[0]);

        const res = await axios.post(`${serverUrl}/api/user/update`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        imageUrl = res.data.assistantImage;
      } else {
        const res = await axios.post(`${serverUrl}/api/user/update`, {
          assistantImage: imageUrl,
        }, {
          withCredentials: true,
        });

        imageUrl = res.data.assistantImage;
      }

      const res2 = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
      setUserData(res2.data);
      navigate("/customize2");
    } catch (err) {
      console.error("Image save error:", err);
      setError("Failed to save assistant image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='w-full h-screen bg-gradient-to-t from-black to-[#030353] flex justify-center items-center flex-col p-[20px]'>
      <MdKeyboardBackspace
        className='absolute top-[30px] left-[30px] text-white w-[25px] h-[25px] cursor-pointer'
        onClick={() => navigate("/")}
      />

      <h1 className='text-white mb-[40px] text-[30px] text-center'>
        Select Your <span className='text-blue-200'>Assistant Image</span>
      </h1>

      <div className='w-full max-w-[900px] flex justify-center items-center flex-wrap gap-[15px]'>
        {defaultImages.map((img, index) => (
          <div
            key={index}
            onClick={() => {
              setFrontendImage(img);
              setSelectedImage(img);
              setIsUploaded(false);
            }}
            className={`w-[70px] h-[140px] lg:w-[140px] lg:h-[240px] bg-[#020220] border-2 border-[#0000ff66]
              rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer 
              hover:border-4 hover:border-white flex items-center justify-center 
              ${selectedImage === img ? "border-4 border-white shadow-2xl shadow-blue-950" : ""}`}
          >
            <img src={img} className='h-full object-cover' alt="assistant" />
          </div>
        ))}

        <div
          className={`w-[70px] h-[140px] lg:w-[140px] lg:h-[240px] bg-[#020220] border-2 border-[#0000ff66]
            rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer 
            hover:border-4 hover:border-white flex items-center justify-center 
            ${selectedImage === frontendImage && isUploaded ? "border-4 border-white shadow-2xl shadow-blue-950" : ""}`}
          onClick={() => inputImage.current.click()}
        >
          {!isUploaded ? (
            <RiImageAddLine className='text-white w-[25px] h-[25px]' />
          ) : (
            <img src={frontendImage} className='h-full object-cover' alt="uploaded assistant" />
          )}
        </div>

        <input
          type="file"
          accept='image/*'
          ref={inputImage}
          hidden
          onChange={handleImage}
        />
      </div>

      {error && <p className='text-red-500 mt-2'>{error}</p>}

      {selectedImage && (
        <button
          className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold 
          bg-white rounded-full text-[19px]'
          onClick={handleNext}
          disabled={uploading}
        >
          {uploading ? "Saving..." : "Next"}
        </button>
      )}
    </div>
  );
}

export default Customize;