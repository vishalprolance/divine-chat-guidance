
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
        "उत्तर संक्षिप्त और विचारपूर्ण रखें। अंग्रेजी का प्रयोग बिलकुल न करें, केवल शुद्ध हिंदी का प्रयोग करें।";
    } else if (language === "kn-IN") {
      systemPrompt += "ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಬೇಕು, ಪ್ರಶ್ನೆ ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿದ್ದರೂ. " +
        "ಭಗವದ್ಗೀತೆಯ ಸಂಬಂಧಿತ ಶ್ಲೋಕಗಳು ಮತ್ತು ವಿವರಣೆಗಳೊಂದಿಗೆ ಉತ್ತರಿಸಿ ಅವುಗಳು ಭಗವಾನ್ ಕೃಷ್ಣನ ಬೋಧನೆಗಳನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತವೆ. " +
        "ಉತ್ತರಗಳನ್ನು ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಆಲೋಚನಾತ್ಮಕವಾಗಿರಿಸಿ. ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ, ಕೇವಲ ಶುದ್ಧ ಕನ್ನಡ ಮಾತ್ರ ಬಳಸಿ.";
    } else if (language === "sa-IN") {
      systemPrompt += "भवता संस्कृतभाषायामेव उत्तरं दातव्यम्, प्रश्नः कस्यामपि भाषायां स्यात्। " +
        "भगवद्गीतायाः संबद्धश्लोकैः व्याख्यानैः च उत्तरं ददातु, यानि श्रीकृष्णस्य उपदेशान् प्रतिबिम्बयन्ति। " +
        "उत्तरं संक्षिप्तं विचारपूर्णं च रक्षतु। आङ्ग्लभाषां मा प्रयुञ्जीत, केवलं शुद्धं संस्कृतभाषामेव प्रयुञ्जीत।";
    } else if (language === "mr-IN") {
      systemPrompt += "आपण मराठीमध्येच उत्तर द्यावे, प्रश्न कोणत्याही भाषेत असला तरी. " +
        "भगवद्गीतेतील संबंधित श्लोक आणि स्पष्टीकरणांसह उत्तर द्या जे भगवान कृष्णाच्या शिकवणीचे प्रतिबिंब दर्शवतात. " +
        "उत्तरे संक्षिप्त आणि विचारपूर्ण ठेवा. इंग्रजीचा वापर अजिबात करू नका, फक्त शुद्ध मराठीचा वापर करा.";
    } else if (language === "bn-IN") {
      systemPrompt += "আপনি শুধুমাত্র বাংলায় উত্তর দিন, প্রশ্ন যে কোনও ভাষায় হোক না কেন। " +
        "ভগবদ্গীতার প্রাসঙ্গিক শ্লোক এবং ব্যাখ্যা সহ উত্তর দিন যা ভগবান কৃষ্ণের শিক্ষাকে প্রতিফলিত করে। " +
        "উত্তরগুলি সংক্ষিপ্ত এবং চিন্তাশীল রাখুন। ইংরেজি ব্যবহার একদম করবেন না, শুধুমাত্র শুদ্ধ বাংলা ব্যবহার করুন।";
    }
    
    // Configure the chat with improved parameters for language handling
    const generationConfig = {
      temperature: 0.7,    // Slightly reduced for more consistent language use
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
        {
          role: "user",
          parts: [{ text: getLanguageInstructionPrompt(language) }],
        },
        {
          role: "model",
          parts: [{ text: getLanguageConfirmationMessage(language) }],
        },
      ],
    });
    
    // Add language instruction to the user's prompt
    let modifiedPrompt = prompt;
    
    if (language !== "en-US") {
      // Add a stronger language instruction at the end
      modifiedPrompt += " " + getLanguageSuffix(language);
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
      "mr-IN": "क्षमा करा, परंतु मी सध्या ज्ञानाशी जोडणी करण्यास असमर्थ आहे. कृपया नंतर पुन्हा प्रयत्न करा.",
      "bn-IN": "ক্ষমা করবেন, কিন্তু আমি এই মুহূর্তে জ্ঞানের সাথে সংযোগ করতে অক্ষম। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
    };
    
    return { 
      text: errorMessages[language] || errorMessages["en-US"]
    };
  }
}

// Add stronger language instructions as a separate message
function getLanguageInstructionPrompt(language: string): string {
  const instructions = {
    "hi-IN": "मुझे केवल हिंदी में जवाब दें, अंग्रेजी का प्रयोग न करें।",
    "kn-IN": "ದಯವಿಟ್ಟು ನನಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಿ, ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ.",
    "sa-IN": "कृपया संस्कृतभाषायामेव उत्तरं ददातु, आङ्ग्लभाषां मा प्रयुञ्जीत।",
    "mr-IN": "कृपया मला फक्त मराठीतच उत्तर द्या, इंग्रजीचा वापर करू नका.",
    "bn-IN": "অনুগ্রহ করে আমাকে শুধুমাত্র বাংলায় উত্তর দিন, ইংরেজি ব্যবহার করবেন না।",
    "en-US": "Please answer me in English only."
  };
  
  return instructions[language] || instructions["en-US"];
}

// Add confirmation of language understanding 
function getLanguageConfirmationMessage(language: string): string {
  const confirmations = {
    "hi-IN": "हां, मैं आपको केवल हिंदी में उत्तर दूंगा।",
    "kn-IN": "ಹೌದು, ನಾನು ನಿಮಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸುತ್ತೇನೆ.",
    "sa-IN": "आम्, अहं भवन्तं संस्कृतभाषायामेव उत्तरं दास्यामि।",
    "mr-IN": "होय, मी तुम्हाला फक्त मराठीतच उत्तर देईन.",
    "bn-IN": "হ্যাঁ, আমি আপনাকে শুধুমাত্র বাংলায় উত্তর দেব।",
    "en-US": "Yes, I will answer you in English only."
  };
  
  return confirmations[language] || confirmations["en-US"];
}

// Add language suffix to add to the end of each user prompt
function getLanguageSuffix(language: string): string {
  const suffixes = {
    "hi-IN": "कृपया अपना उत्तर केवल हिंदी में दें। अंग्रेजी का उपयोग न करें।",
    "kn-IN": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ನೀಡಿ. ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ.",
    "sa-IN": "कृपया उत्तरं संस्कृतभाषायां एव ददातु। आङ्ग्लभाषां मा प्रयुञ्जीत।",
    "mr-IN": "कृपया आपले उत्तर फक्त मराठीत द्या. इंग्रजीचा वापर करू नका.",
    "bn-IN": "অনুগ্রহ করে আপনার উত্তর শুধুমাত্র বাংলায় দিন। ইংরেজি ব্যবহার করবেন না।",
    "en-US": "Please provide your answer in English only."
  };
  
  return suffixes[language] || suffixes["en-US"];
}

function getLanguageDisplayName(languageCode: string): string {
  const languageMap = {
    "en-US": "English",
    "hi-IN": "Hindi",
    "kn-IN": "Kannada",
    "sa-IN": "Sanskrit",
    "mr-IN": "Marathi",
    "bn-IN": "Bengali"
  };
  
  return languageMap[languageCode] || "English";
}

function getWelcomeMessage(language: string): string {
  const messages = {
    "en-US": "I am here to share the wisdom of the Bhagavad Gita with you. How may I assist you on your spiritual journey?",
    "hi-IN": "मैं आपके साथ भगवद गीता का ज्ञान साझा करने के लिए यहां हूं। मैं आपकी आध्यात्मिक यात्रा में कैसे सहायता कर सकता हूं?",
    "kn-IN": "ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಭಗವದ್ಗೀತೆಯ ಜ್ಞಾನವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಇಲ್ಲಿದ್ದೇನೆ. ನಿಮ್ಮ ಆಧ್ಯಾತ್ಮಿಕ ಪ್ರಯಾಣದಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    "sa-IN": "अहं भवता सह भगवद्गीतायाः ज्ञानं विभाजयितुं अत्र उपस्थितः अस्मि। भवतः आध्यात्मिकयात्रायां अहं कथं साहाय्यं कर्तुं शक्नोमि?",
    "mr-IN": "मी आपल्याबरोबर भगवद गीतेचे ज्ञान सामायिक करण्यासाठी येथे आहे. मी आपल्या आध्यात्मिक प्रवासात आपली कशी मदत करू शकतो?",
    "bn-IN": "আমি আপনার সাথে ভগবদগীতার জ্ঞান ভাগ করে নিতে এখানে আছি। আমি আপনার আধ্যাত্মিক যাত্রায় কীভাবে সাহায্য করতে পারি?"
  };
  
  return messages[language] || messages["en-US"];
}
