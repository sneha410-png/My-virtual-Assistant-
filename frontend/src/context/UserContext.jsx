import React, { useEffect, useState, createContext } from 'react';
import axios from 'axios';

// Create a context for user data and related functions
export const userDataContext = createContext();

/**
 * UserContextProvider component provides user data and API interaction functions
 * to its children components via React Context.
 * It also handles initial user fetching on component mount.
 */
function UserContextProvider({ children }) {
  // Determine server URL based on environment.
  // In a production environment, you would typically use a different URL
  // or rely on a proxy setup. For local development, it's often localhost.
  // Make sure to set process.env.NODE_ENV appropriately in your build process.
  const serverUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-production-backend-url.com' // ⚠️ Replace with your actual production backend URL
    : 'http://localhost:8000'; // Development URL

  // State to store current user data
  const [userData, setUserData] = useState(undefined); // undefined initially, null if not logged in
  // States for image handling (assuming these are used elsewhere in your app)
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  /**
   * Fetches the currently logged-in user's data from the backend.
   * This function relies on cookies for authentication, so `withCredentials` is essential.
   */
  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true, // Ensures cookies are sent with the request
      });
      setUserData(result.data); // Set user data if fetch is successful
      console.log("✅ Fetched user:", result.data);
    } catch (error) {
      setUserData(null); // Set user data to null if fetching fails (e.g., not logged in)
      // Log a warning with more details for debugging
      console.warn(
        "❌ Failed to fetch user:",
        error?.response?.data?.message || error.message,
        error.response?.status ? `Status: ${error.response.status}` : ''
      );
    }
  };

  /**
   * Sends a voice command to the Gemini backend and retrieves a response.
   * @param {string} command - The voice command to send.
   * @returns {object|null} The parsed JSON response from Gemini, or null if an error occurs.
   */
  const getGeminiResponse = async (command) => {
    try {
      console.log("🎤 Sending command to Gemini API:", command);

      const result = await axios.post(
        `${serverUrl}/api/user/asktoassistant`,
        { command },
        { withCredentials: true } // Ensures cookies are sent
      );

      // Backend should return a parsed JSON object like:
      // { type, userInput, response }
      console.log("✅ Gemini API full response:", result.data);
      return result.data;
    } catch (error) {
      // Log the full error object for detailed debugging
      console.error("❌ Gemini API error (frontend):", error);
      // Return null or re-throw the error based on how you want to handle it upstream
      return null;
    }
  };

  // useEffect hook to fetch current user data when the component mounts
  useEffect(() => {
    handleCurrentUser();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    // Provide the context values to all children components
    <userDataContext.Provider
      value={{
        serverUrl,
        userData,
        setUserData,
        frontendImage,
        setFrontendImage,
        backendImage,
        setBackendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse,
      }}
    >
      {children} {/* Render child components */}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
