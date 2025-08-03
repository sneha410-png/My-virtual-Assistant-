import axios from "axios";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables

/**
 * Interacts with the Gemini API to get a response based on user command.
 * It instructs Gemini to classify the command type and provide an appropriate response,
 * including detailed answers for direct questions.
 *
 * @param {string} command - The user's voice command/query.
 * @param {string} assistantName - The name of the assistant.
 * @param {string} userName - The name of the user.
 * @returns {Promise<object|null>} A JSON object containing type, userInput, and response, or null if an error occurs.
 */
const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;

    // Validate environment variables
    if (!apiUrl) throw new Error("❌ GEMINI_API_URL is missing in .env");
    if (!apiKey) throw new Error("❌ GEMINI_API_KEY is missing in .env");

    // Construct the prompt for Gemini
    // This prompt guides Gemini to understand the intent and respond accordingly.
    // It explicitly asks for a detailed response for knowledge-based questions.
    const prompt = `
You are a helpful and knowledgeable assistant named ${assistantName}, created by ${userName}.
Your goal is to provide accurate and helpful responses.

Based on the user's input, determine if it's a direct knowledge-based question or an action/search command.

Respond ONLY in **valid JSON** format as below:

{
  "type": "<command-type>",
  "userInput": "${command}",
  "response": "<Your spoken response>"
}

Available command types:
- "google-search" → for general search queries (e.g., "search Python tutorials", "who is the president of France?")
- "youtube-search" → to search on YouTube (e.g., "search cat videos on YouTube")
- "youtube-play" → to play specific videos (e.g., "play latest song on YouTube")
- "calculator-open" → to open calculator (e.g., "open calculator")
- "weather-show" → to show weather (e.g., "show me the weather")
- "instagram-open" → to open Instagram (e.g., "open Instagram")
- "facebook-open" → to open Facebook (e.g., "open Facebook")
- "maps-open" → to open Google Maps (e.g., "open maps")
- "linkedin-open" → to open LinkedIn (e.g., "open LinkedIn")
- "github-open" → to open GitHub (e.g., "open GitHub")
- "whatsapp-open" → to open WhatsApp (e.g., "open WhatsApp")
- "general" → for direct knowledge-based questions that can be answered comprehensively, or general conversation.

**Important Rules for "response" field:**
1.  If the 'type' is 'general' and the question is knowledge-based (e.g., "What is JavaScript?", "Tell me about the history of India?"), provide a **detailed and comprehensive answer** in the 'response' field. The response should be informative and can be longer.
2.  If the 'type' is an action/search command (e.g., "google-search", "youtube-play"), provide a **short and concise confirmation** in the 'response' field (e.g., "Searching for JavaScript definition.", "Opening YouTube.").

Examples:
- Input: "JavaScript kya hai?"
  Output: { "type": "general", "userInput": "JavaScript kya hai?", "response": "JavaScript ek lightweight, interpreted, ya just-in-time compiled programming language hai jo web pages ko interactive banane ke liye use hoti hai. Yeh web development ka ek core technology hai, HTML aur CSS ke saath. Iska upyog front-end, back-end (Node.js ke saath), aur mobile apps (React Native jaise frameworks ke saath) mein hota hai." }

- Input: "search latest news"
  Output: { "type": "google-search", "userInput": "search latest news", "response": "Searching for the latest news." }

- Input: "open calculator"
  Output: { "type": "calculator-open", "userInput": "open calculator", "response": "Opening calculator." }

- Input: "Bharat ki rajdhani kya hai?"
  Output: { "type": "general", "userInput": "Bharat ki rajdhani kya hai?", "response": "Bharat ki rajdhani New Delhi hai. Yeh desh ke uttar mein sthit ek mahanagar hai aur Bharat Sarkar ki seat hai. New Delhi apne aitihasik smarakon, sanskritik virasat aur aadhunik infrastructure ke liye jaana jaata hai." }

Don't include any markdown, explanation, or extra characters outside the JSON.
`.trim();

    const fullUrl = `${apiUrl}?key=${apiKey}`;

    console.log("🌐 Calling Gemini API URL:", fullUrl);
    // console.log("📨 Sending prompt:", prompt); // Keep this commented unless deep debugging prompt content

    // Make the API call to Gemini
    const result = await axios.post(fullUrl, {
      contents: [{ parts: [{ text: prompt }] }],
      // Optionally, add generationConfig here if you want to enforce JSON schema
      // However, the prompt itself is usually sufficient for simple JSON output
      // generationConfig: {
      //   responseMimeType: "application/json",
      //   responseSchema: {
      //     type: "OBJECT",
      //     properties: {
      //       type: { type: "STRING" },
      //       userInput: { type: "STRING" },
      //       response: { type: "STRING" }
      //     }
      //   }
      // }
    });

    const responseText = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("❌ Gemini response is empty or undefined.");
    }

    console.log("✅ Raw Gemini response:", responseText);

    let parsed;
    try {
      // Clean and parse the JSON response from Gemini
      // Gemini might sometimes include markdown backticks (```json) around the JSON.
      // We remove them to ensure valid JSON parsing.
      parsed = JSON.parse(responseText.replace(/```json|```/g, "").trim());
      console.log("✅ Parsed Gemini JSON:", parsed);
    } catch (e) {
      console.error("❌ Failed to parse Gemini response as JSON:", e.message);
      // If parsing fails, return a default error response
      return {
        type: 'general',
        userInput: command,
        response: "मुझे आपके अनुरोध को समझने में समस्या हुई। कृपया पुनः प्रयास करें।"
      };
    }

    return parsed; // Return the parsed JSON object
  } catch (error) {
    console.error("❌ Gemini API Error:");
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    // Return a default error response in case of any API call failure
    return {
      type: 'general',
      userInput: command,
      response: "मेरे सिस्टम में कुछ समस्या आ गई है। कृपया थोड़ी देर बाद फिर से कोशिश करें।"
    };
  }
};

export default geminiResponse;
