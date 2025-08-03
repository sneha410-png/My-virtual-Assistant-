import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import aiImg from "../assets/ai.gif"; // Assuming this is for AI speaking animation
import userImg from "../assets/user.gif"; // Assuming this is for User speaking animation
import { BiMenuAltRight } from 'react-icons/bi';
import { RxCross1 } from 'react-icons/rx';

function Home() {
  // Accessing user data and functions from context
  const {
    userData,
    serverUrl,
    setUserData,
    getGeminiResponse,
  } = useContext(userDataContext);

  const navigate = useNavigate(); // For navigation
  const [listening, setListening] = useState(false); // State for speech recognition listening status
  const [userText, setUserText] = useState(""); // State to store user's spoken text
  const [aiText, setAiText] = useState(""); // State to store AI's spoken text
  const isRecognizingRef = useRef(false); // Ref to track if speech recognition is active
  const isSpeakingRef = useRef(false); // Ref to track if speech synthesis is active
  const recognitionRef = useRef(null); // Ref for SpeechRecognition object
  const synth = window.speechSynthesis; // Web Speech API SpeechSynthesis object
  const [ham, setHam] = useState(false); // State for hamburger menu visibility
  const [isAssistantActive, setIsAssistantActive] = useState(false); // State for initial activation (via button click)
  const [isConversationModeActive, setIsConversationModeActive] = useState(false); // New state for continuous listening mode

  /**
   * Handles user logout.
   * Clears user data and navigates to sign-in page.
   */
  const handleLogOut = async () => {
    try {
      // Stop any ongoing recognition or speech before logging out
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synth.speaking) synth.cancel();

      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true, // Send cookies for logout
      });
      setUserData(null); // Clear user data from context
      setIsAssistantActive(false); // Reset assistant state
      setIsConversationModeActive(false); // Reset conversation mode
      navigate("/signin"); // Redirect to sign-in
    } catch (error) {
      console.error("Logout error:", error);
      setUserData(null); // Ensure user data is cleared even on error
    }
  };

  /**
   * Speaks the given text using Web Speech API, with a preference for Hindi female voice.
   * @param {string} text - The text to speak.
   * @param {function} [callback] - Optional callback function to execute after speaking ends.
   */
  const speak = (text, callback) => {
    if (!text) {
      console.log("Speak function called with empty text.");
      return; // Do nothing if no text is provided
    }

    // Cancel any ongoing speech before starting a new one
    if (synth.speaking) {
      synth.cancel();
      console.log("Cancelled ongoing speech.");
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Set language to Hindi (India)

    const assignVoiceAndSpeak = () => {
      const voices = synth.getVoices(); // Get all available voices
      console.log("Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));

      // Filter for Hindi voices
      const hindiVoices = voices.filter(v => v.lang === 'hi-IN');
      console.log("Filtered Hindi voices:", hindiVoices.map(v => v.name));

      let selectedVoice = null;

      // Keywords to look for in voice names to identify female voices
      const femaleVoiceKeywords = ['female', 'f', 'heera', 'zira', 'kajal', 'priya', 'kalpana'];
      
      // Try to find a Hindi female voice by name
      for (const keyword of femaleVoiceKeywords) {
        selectedVoice = hindiVoices.find(v => v.name.toLowerCase().includes(keyword.toLowerCase()));
        if (selectedVoice) {
          console.log(`Selected Hindi female voice by keyword '${keyword}':`, selectedVoice.name);
          break; // Found a match, stop searching
        }
      }

      // If no specific female voice found, pick the first available Hindi voice
      if (!selectedVoice && hindiVoices.length > 0) {
        selectedVoice = hindiVoices[0];
        console.log("Selected first available Hindi voice:", selectedVoice.name);
      }

      // Fallback to default voice if no Hindi voice is found at all
      utterance.voice = selectedVoice || voices[0];
      if (!utterance.voice) {
        console.error("No voices found on the system. Speech will not work.");
        return; // Cannot speak if no voice is available
      }
      console.log("Final voice assigned:", utterance.voice.name, utterance.voice.lang);


      isSpeakingRef.current = true; // Set speaking flag

      // Callback when speech starts (optional, for debugging)
      utterance.onstart = () => {
        console.log("Speech started for:", text);
      };

      // Callback when speech ends
      utterance.onend = () => {
        console.log("Speech ended for:", text);
        setAiText(""); // Clear AI text
        isSpeakingRef.current = false; // Reset speaking flag
        if (typeof callback === 'function') callback(); // Execute callback if provided
        // Only restart recognition if conversation mode is active
        if (isConversationModeActive) {
            safeRecognition();
        }
      };

      // Callback for speech errors
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error, event);
        isSpeakingRef.current = false;
        setAiText("");
        // Attempt to restart recognition if conversation mode is active
        if (isConversationModeActive) {
            safeRecognition();
        }
      };

      // Add a small delay before speaking to prevent 'interrupted' errors
      // This gives the browser's speech engine a moment to process synth.cancel()
      setTimeout(() => {
        synth.speak(utterance); // Start speaking
      }, 50); // 50ms delay
    };

    // If voices are not yet loaded, wait for them
    if (synth.getVoices().length === 0) {
      console.log("Voices not loaded yet, waiting for 'onvoiceschanged' event.");
      synth.onvoiceschanged = assignVoiceAndSpeak;
    } else {
      assignVoiceAndSpeak(); // Voices are already loaded, assign and speak immediately
    }
  };

  /**
   * Handles the command received from Gemini, speaks the response, and opens URLs.
   * @param {object} data - The response data from Gemini API.
   * @param {string} data.type - The type of command (e.g., 'google-search', 'general').
   * @param {string} data.userInput - The original user input related to the command.
   * @param {string} data.response - The AI's textual response.
   */
  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    const query = encodeURIComponent(userInput); // Encode user input for URL
    setAiText(response); // Display AI's text response

    speak(response, () => {
      // After AI finishes speaking, wait a bit and then open URL if applicable
      setTimeout(() => {
        let url = "";
        switch (type) {
          case 'google-search':
            url = `https://www.google.com/search?q=${query}`;
            break;
          case 'calculator-open':
            url = `https://www.google.com/search?q=calculator`;
            break;
          case 'instagram-open':
            url = `https://www.instagram.com/`;
            break;
          case 'facebook-open':
            url = `https://www.facebook.com/`;
            break;
          case 'weather-show':
            url = `https://www.google.com/search?q=weather`;
            break;
          case 'youtube-search':
          case 'youtube-play':
            url = `https://www.youtube.com/results?search_query=${query}`;
            break;
          case 'maps-open':
            url = `https://www.google.com/maps`;
            break;
          case 'linkedin-open':
            url = `https://www.linkedin.com`;
            break;
          case 'github-open':
            url = `https://www.github.com`;
            break;
          case 'whatsapp-open':
            url = `https://web.whatsapp.com`;
            break;
          case 'general':
            // No URL to open for general messages. The AI's response is spoken and displayed.
            console.log("🧠 General message only. No URL opened.");
            break;
          default:
            console.log("❌ No matching command to open for type:", type);
        }

        if (url) {
          const newTab = window.open(url, '_blank');
          if (!newTab) {
            console.warn("⚠️ Pop-ups blocked! Please allow pop-ups for this site to open links.");
          }
        }
      }, 500); // Small delay before opening URL
    });
  };

  /**
   * Safely starts speech recognition, ensuring it's not already recognizing or speaking.
   */
  const safeRecognition = () => {
    // Only start recognition if conversation mode is active
    if (!isSpeakingRef.current && !isRecognizingRef.current && isConversationModeActive) {
      try {
        recognitionRef.current.start();
        console.log("✅ Recognition started safely.");
      } catch (err) {
        if (err.name !== "InvalidStateError") {
          console.error("Start error:", err);
        }
      }
    }
  };

  /**
   * Handles the click event for the "Start Assistant" button.
   * This is the explicit user interaction needed to allow speech synthesis.
   */
  const handleStartAssistant = () => {
    setIsAssistantActive(true); // Set assistant active
    setIsConversationModeActive(true); // Enter continuous conversation mode
    // Speak a greeting immediately on user click
    const greeting = userData?.assistantName ? `Hello, I am ${userData.assistantName}. How can I help you?` : "Hello, how can I help you?";
    speak(greeting, () => {
      safeRecognition(); // After greeting, safely start recognition
    });
  };

  // useEffect for Speech Recognition setup and lifecycle management
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported in this browser.");
      speak("Sorry, speech recognition is not supported in your browser.", () => {});
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.lang = 'en-US'; // Set recognition language (can be changed to hi-IN for Hindi input)
    recognitionRef.current = recognition; // Store recognition object in ref

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
      console.log("Speech recognition started.");
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      console.log("Speech recognition ended.");
      // Restart recognition if conversation mode is active
      if (isConversationModeActive) {
        setTimeout(() => safeRecognition(), 1000);
      }
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      // Attempt to restart recognition if conversation mode is active
      if (event.error !== "aborted" && isConversationModeActive) {
        setTimeout(() => safeRecognition(), 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("🎙️ Heard:" + transcript);

      const assistantName = userData?.assistantName?.toLowerCase();
      const stopCommands = ["stop listening", "goodbye", "bas karo", "ruk jao", "chup ho jao"]; // Add more stop commands as needed

      // Check for stop commands first, regardless of conversation mode
      if (stopCommands.some(cmd => transcript.toLowerCase().includes(cmd))) {
        console.log("🛑 Stop command detected.");
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsConversationModeActive(false); // Exit conversation mode
        setIsAssistantActive(false); // Reset assistant active state
        setAiText("Goodbye! Have a great day.");
        speak("Goodbye! Have a great day.", () => {
            setUserText("");
            setAiText("");
        });
        return; // Stop further processing
      }

      // If not in conversation mode, require assistant's name to activate
      if (!isConversationModeActive) {
        if (assistantName && transcript.toLowerCase().includes(assistantName)) {
          console.log("Assistant name detected, entering conversation mode.");
          setIsConversationModeActive(true); // Enter conversation mode
          setUserText(transcript);
          setAiText("");
          if (recognitionRef.current) recognitionRef.current.stop(); // Stop current recognition to process command
          
          try {
            const responseData = await getGeminiResponse(transcript);
            if (responseData && responseData.type) {
              console.log("✅ Gemini result:", responseData);
              handleCommand(responseData);
            } else {
              console.warn("⚠️ Gemini did not return valid response:", responseData);
              speak("Sorry, I didn't understand that. Please try again.", () => {});
            }
          } catch (err) {
            console.error("❌ Error from Gemini API:", err);
            speak("There was a problem with my system. Please try again later.", () => {});
          }
        } else {
          // If assistant name not detected and not in conversation mode, just log and ignore
          console.log("Assistant name not heard, ignoring command outside conversation mode.");
          setUserText(transcript); // Still show what user said
        }
      } else {
        // If already in conversation mode, process any command
        setUserText(transcript);
        setAiText("");
        if (recognitionRef.current) recognitionRef.current.stop(); // Stop current recognition to process command

        try {
          const responseData = await getGeminiResponse(transcript);
          if (responseData && responseData.type) {
            console.log("✅ Gemini result:", responseData);
            handleCommand(responseData);
          } else {
            console.warn("⚠️ Gemini did not return valid response:", responseData);
            speak("Sorry, I didn't understand that. Please try again.", () => {});
          }
        } catch (err) {
          console.error("❌ Error from Gemini API:", err);
          speak("There was a problem with my system. Please try again later.", () => {});
        }
      }
    };

    // Fallback interval to ensure recognition restarts if it somehow stops
    const fallback = setInterval(() => {
      if (!isSpeakingRef.current && !isRecognizingRef.current && isConversationModeActive) {
        safeRecognition();
      }
    }, 10000); // Check every 10 seconds

    // Initial setup: recognition starts only via handleStartAssistant button click
    // Cleanup function for useEffect
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop(); // Stop recognition when component unmounts
      setListening(false);
      isRecognizingRef.current = false;
      clearInterval(fallback); // Clear the fallback interval
      if (synth.speaking) synth.cancel(); // Cancel any ongoing speech
    };
  }, [userData, getGeminiResponse, isAssistantActive, isConversationModeActive]); // Added isConversationModeActive to dependencies

  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden relative">

      {/* Hamburger Menu Icon (visible on small screens) */}
      <BiMenuAltRight
        className='lg:hidden text-white absolute top-[20px] right-[20px] w-[30px] h-[30px] cursor-pointer z-30'
        onClick={() => setHam(true)}
      />

      {/* Sidebar Menu */}
      <div className={`absolute top-0 left-0 w-full h-full bg-[#0000008f] backdrop-blur-lg p-[20px]
        flex flex-col gap-[20px] items-start transform ${ham ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 z-20`}>

        {/* Close Sidebar Icon */}
        <RxCross1
          className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer'
          onClick={() => setHam(false)}
        />

        {/* Logout Button */}
        <button className="min-w-[150px] h-[60px] mt-[60px] text-black font-semibold bg-white rounded-full text-[19px] hover:bg-gray-200 transition-colors duration-200" onClick={handleLogOut}>
          Logout
        </button>

        {/* Customize Assistant Button */}
        <button className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] hover:bg-gray-200 transition-colors duration-200" onClick={() => navigate("/customize")}>
          Customize Your Assistant
        </button>

        <div className='w-full h-[2px] bg-gray-400 my-4'></div> {/* Separator */}

        <h1 className='text-white font-semibold text-[19px]'>History</h1>

        {/* History Display Area */}
        <div className='w-full h-[60%] overflow-auto flex flex-col gap-[10px]'>
          {userData?.history?.length > 0 ? (
            userData.history.map((his, idx) => (
              <span key={idx} className='text-white text-[16px] truncate'>{his}</span>
            ))
          ) : (
            <span className='text-white'>No history yet</span>
          )}
        </div>
      </div>

      {/* Desktop Buttons (hidden on small screens) */}
      <button className="hidden lg:block min-w-[150px] h-[60px] text-black font-semibold bg-white absolute top-[20px] right-[20px] rounded-full text-[19px] hover:bg-gray-200 transition-colors duration-200" onClick={handleLogOut}>
        Logout
      </button>

      <button className="hidden lg:block min-w-[150px] h-[60px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full text-[19px] hover:bg-gray-200 transition-colors duration-200" onClick={() => navigate("/customize")}>
        Customize Your Assistant
      </button>

      {/* Assistant Image Display */}
      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-3xl shadow-lg shadow-black bg-white">
        {/* Fallback for image if userData?.assistantImage is not available */}
        {userData?.assistantImage ? (
          <img src={userData.assistantImage} alt="Assistant" className="h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
            No Assistant Image
          </div>
        )}
      </div>

      {/* Assistant Name Display */}
      <h1 className="text-white text-[22px] font-semibold mt-4">
        I'm <span className="text-blue-300">{userData?.assistantName || "Your Assistant"}</span>
      </h1>

      {/* Conditional "Start Assistant" button */}
      {!isAssistantActive && (
        <button
          className="min-w-[200px] h-[60px] text-black font-semibold bg-blue-400 rounded-full text-[19px] mt-4 hover:bg-blue-500 transition-colors duration-200"
          onClick={handleStartAssistant}
        >
          Start Assistant
        </button>
      )}

      {/* Speaking Indicator (User or AI) */}
      {!aiText && <img src={userImg} alt="User speaking" className="w-[200px]" />}
      {aiText && <img src={aiImg} alt="AI speaking" className="w-[200px]" />}

      {/* Response/Command Display */}
      <h1 className='text-white text-[20px] font-semibold text-wrap px-[20px] text-center'>
        {userText ? userText : aiText ? aiText : (isAssistantActive && listening) ? "Listening..." : "Click 'Start Assistant' to begin"}
      </h1>
    </div>
  );
}

export default Home;
