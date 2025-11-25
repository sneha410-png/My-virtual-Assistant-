import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiUrl) throw new Error("❌ GEMINI_API_URL missing");
    if (!apiKey) throw new Error("❌ GEMINI_API_KEY missing");

    // ====== FULL COMMAND CLASSIFICATION PROMPT ======
    const prompt = `
You are a strict command classifier for a voice assistant named ${assistantName}, created by ${userName}.
You MUST respond ONLY in pure JSON. 
No markdown. No extra text. No phrases like "Here is your JSON".

VALID COMMAND TYPES:
- "google-search"
- "youtube-search"
- "youtube-play"
- "calculator-open"
- "weather-show"
- "instagram-open"
- "facebook-open"
- "maps-open"
- "linkedin-open"
- "github-open"
- "whatsapp-open"
- "snapchat-open"
- "spotify-open"
- "twitter-open"
- "general"

RESPONSE RULES:
- Action commands → short response: "Opening YouTube.", "Searching on Google.", etc.
- General questions → full helpful answer (ex: "What is JavaScript?")
- You MUST fill all three keys:

{
  "type": "<one-of-the-types>",
  "userInput": "${command}",
  "response": "<assistant's response>"
}

CLASSIFICATION RULES:

1) GOOGLE SEARCH:
   If user says:
   - "search"
   - "google"
   - "look up"
   - "tell me about X"
   - "who is", "what is", etc.
   Not related to opening an app → "google-search"

2) YOUTUBE:
   - "play", "youtube", "song", "music"
   If includes "play" → "youtube-play"
   If includes "search" + youtube → "youtube-search"

3) WEATHER:
   - "weather", "temperature", "barish", "rain", "climate"

4) CALCULATOR:
   - "calculator", "calc", "hisab", "math karo"

5) OPEN APP:
   "instagram", "facebook", "linkedin", "github", "maps", "whatsapp", "snapchat", "spotify", "twitter"

6) GENERAL:
   - chit-chat
   - simple questions
   - greetings
   - unknown commands
`;

    // SEND TO GEMINI
    const fullUrl = `${apiUrl}?key=${apiKey}`;
    const result = await axios.post(fullUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let text = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("🌐 Raw Gemini Reply:", text);

    // ====== CLEAN JSON auto-fix ======
    text = text.replace(/```json|```/g, "");  
    text = text.replace(/^[^{]*/, "");        
    text = text.replace(/}[^}]*$/, "}");      

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.log("❌ JSON Parse Failed → Cleaned:", text);
      return {
        type: "general",
        userInput: command,
        response: "Sorry, I could not understand your request."
      };
    }

    return json;

  } catch (err) {
    console.error("❌ Gemini API Error:", err.message);

    return {
      type: "general",
      userInput: command,
      response: "My system is facing issues. Please try again later."
    };
  }
};

export default geminiResponse;
