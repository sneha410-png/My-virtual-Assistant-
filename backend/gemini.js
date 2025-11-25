import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiUrl) throw new Error("❌ GEMINI_API_URL missing");
    if (!apiKey) throw new Error("❌ GEMINI_API_KEY missing");

    const prompt = `
You are a strict command classifier for a voice assistant named ${assistantName}, created by ${userName}.
You MUST respond ONLY in pure JSON without any extra text.

{
  "type": "<one-of-the-types>",
  "userInput": "${command}",
  "response": "<assistant's response>"
}
`;

    const fullUrl = `${apiUrl}?key=${apiKey}`;
    const result = await axios.post(fullUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let text = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("🌐 Raw Gemini Reply:", text);

    // ====== SAFE JSON EXTRACTION ======
    let json = null;
    const match = text.match(/\{[\s\S]*\}/); // find first {...} block
    if (match) {
      try {
        json = JSON.parse(match[0]);
      } catch {
        console.warn("❌ JSON Parse Failed:", match[0]);
      }
    }

    // fallback if parsing failed
    if (!json) {
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
