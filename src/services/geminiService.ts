
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your key
const API_KEY = "AIzaSyCCy-dgtUA8ng8cLHQ9ZFs_-BURfDFT-kk";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define response interface
interface GeminiResponse {
  text: string;
}

// Get guidance from Bhagavad Gita based on user prompt
export async function queryGemini(prompt: string, language: string = "en-US"): Promise<GeminiResponse> {
  try {
    // Select the appropriate model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a system prompt for Bhagavad Gita guidance with stronger language instructions
    let systemPrompt = "You are a spiritual guide who provides wisdom from the Bhagavad Gita. ";
    
    // Strengthen the language instruction to ensure response in the selected language
    if (language === "en-US") {
      systemPrompt += "Answer questions with relevant verses and explanations that reflect the teachings of Lord Krishna. " +
        "Keep responses concise and thoughtful in English.";
    } else if (language === "hi-IN") {
      systemPrompt += "आपको हिंदी में ही उत्तर देना है, चाहे प्रश्न किसी भी भाषा में हो। " +
        "भगवद गीता के संबंधित श्लोकों और व्याख्याओं के साथ उत्तर दें जो भगवान कृष्ण की शिक्षाओं को दर्शाते हैं। " +
        "उत्तर संक्षिप्त और विचारपूर्ण रखें। अंग्रेजी का प्रयोग न करें, केवल हिंदी का प्रयोग करें।";
    } else if (language === "kn-IN") {
      systemPrompt += "ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಬೇಕು, ಪ್ರಶ್ನೆ ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿದ್ದರೂ. " +
        "ಭಗವದ್ಗೀತೆಯ ಸಂಬಂಧಿತ ಶ್ಲೋಕಗಳು ಮತ್ತು ವಿವರಣೆಗಳೊಂದಿಗೆ ಉತ್ತರಿಸಿ ಅವುಗಳು ಭಗವಾನ್ ಕೃಷ್ಣನ ಬೋಧನೆಗಳನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತವೆ. " +
        "ಉತ್ತರಗಳನ್ನು ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಆಲೋಚನಾತ್ಮಕವಾಗಿರಿಸಿ. ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ, ಕೇವಲ ಕನ್ನಡ ಮಾತ್ರ ಬಳಸಿ.";
    } else if (language === "sa-IN") {
      systemPrompt += "भवता संस्कृतभाषायामेव उत्तरं दातव्यम्, प्रश्नः कस्यामपि भाषायां स्यात्। " +
        "भगवद्गीतायाः संबद्धश्लोकैः व्याख्यानैः च उत्तरं ददातु, यानि श्रीकृष्णस्य उपदेशान् प्रतिबिम्बयन्ति। " +
        "उत्तरं संक्षिप्तं विचारपूर्णं च रक्षतु। आङ्ग्लभाषां मा प्रयुञ्जीत, केवलं संस्कृतभाषामेव प्रयुञ्जीत।";
    }
    
    // Configure the chat with improved parameters for language handling
    const generationConfig = {
      temperature: 0.8,    // Slightly increased to allow for more natural language responses
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 800,
    };
    
    // Create a chat session with stronger language instructions
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: "Please provide guidance based on Bhagavad Gita" }],
        },
        {
          role: "model",
          parts: [{ text: getWelcomeMessage(language) }],
        },
      ],
    });
    
    // Modify the prompt to ensure response in the chosen language
    let modifiedPrompt = prompt;
    
    // Add language instruction to the user's prompt
    if (language === "hi-IN") {
      modifiedPrompt += " कृपया हिंदी में उत्तर दें।";
    } else if (language === "kn-IN") {
      modifiedPrompt += " ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.";
    } else if (language === "sa-IN") {
      modifiedPrompt += " कृपया संस्कृते उत्तरं ददातु।";
    }
    
    // Send user's question and get response
    const result = await chat.sendMessage(modifiedPrompt);
    const response = result.response;
    const text = response.text();
    
    return { text };
  } catch (error) {
    console.error("Error querying Gemini:", error);
    
    // Error messages in different languages
    const errorMessages = {
      "en-US": "Forgive me, but I'm unable to connect with the wisdom at this moment. Please try again later.",
      "hi-IN": "क्षमा करें, लेकिन मैं इस समय ज्ञान से जुड़ने में असमर्थ हूं। कृपया बाद में पुनः प्रयास करें।",
      "kn-IN": "ಕ್ಷಮಿಸಿ, ಆದರೆ ನಾನು ಈ ಸಮಯದಲ್ಲಿ ಜ್ಞಾನದೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      "sa-IN": "क्षम्यतां, परन्तु अहं अस्मिन् समये ज्ञानेन सह संयोजयितुं असमर्थः अस्मि। कृपया पुनः प्रयत्नं कुर्वन्तु।",
    };
    
    return { 
      text: errorMessages[language] || errorMessages["en-US"]
    };
  }
}

function getLanguageDisplayName(languageCode: string): string {
  const languageMap = {
    "en-US": "English",
    "hi-IN": "Hindi",
    "kn-IN": "Kannada",
    "sa-IN": "Sanskrit"
  };
  
  return languageMap[languageCode] || "English";
}

function getWelcomeMessage(language: string): string {
  const messages = {
    "en-US": "I am here to share the wisdom of the Bhagavad Gita with you. How may I assist you on your spiritual journey?",
    "hi-IN": "मैं आपके साथ भगवद गीता का ज्ञान साझा करने के लिए यहां हूं। मैं आपकी आध्यात्मिक यात्रा में कैसे सहायता कर सकता हूं?",
    "kn-IN": "ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಭಗವದ್ಗೀತೆಯ ಜ್ಞಾನವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಇಲ್ಲಿದ್ದೇನೆ. ನಿಮ್ಮ ಆಧ್ಯಾತ್ಮಿಕ ಪ್ರಯಾಣದಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    "sa-IN": "अहं भवता सह भगवद्गीतायाः ज्ञानं विभाजयितुं अत्र उपस्थितः अस्मि। भवतः आध्यात्मिकयात्रायां अहं कथं साहाय्यं कर्तुं शक्नोमि?",
  };
  
  return messages[language] || messages["en-US"];
}
