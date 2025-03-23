
// This service handles interactions with the Gemini LLM API
// You'll need to provide your Gemini API key to use this service

interface GeminiResponse {
  text: string;
}

// Sample responses in different languages
const responses = {
  "en-US": [
    "As Lord Krishna teaches in the Bhagavad Gita, 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.' Focus on your efforts without attachment to outcomes.",
    "The Bhagavad Gita reminds us, 'For the soul there is never birth nor death. It is not slain when the body is slain.' Your true self is eternal and unchanging.",
    "Krishna advises, 'Whatever happened, happened for good. Whatever is happening, is happening for good. Whatever will happen, will also happen for good.' Trust in the divine plan.",
    "The Gita teaches us that 'The wise grieve neither for the living nor for the dead.' Focus on your eternal nature beyond temporary circumstances.",
    "Lord Krishna says, 'The one who sees inaction in action, and action in inaction, is intelligent among men.' Find peace in balanced action.",
  ],
  "hi-IN": [
    "जैसा कि भगवान कृष्ण भगवद गीता में सिखाते हैं, 'आपको अपने निर्धारित कर्तव्यों को करने का अधिकार है, लेकिन आप अपने कर्मों के फलों के हकदार नहीं हैं।' परिणामों से जुड़ाव के बिना अपने प्रयासों पर ध्यान केंद्रित करें।",
    "भगवद गीता हमें याद दिलाती है, 'आत्मा के लिए न कभी जन्म है और न ही मृत्यु। शरीर के नष्ट होने पर यह नष्ट नहीं होती।' आपका वास्तविक स्वरूप शाश्वत और अपरिवर्तनीय है।",
    "कृष्ण की सलाह है, 'जो हुआ, अच्छे के लिए हुआ। जो हो रहा है, अच्छे के लिए हो रहा है। जो होगा, वह भी अच्छे के लिए होगा।' ईश्वरीय योजना पर भरोसा रखें।",
    "गीता हमें सिखाती है कि 'बुद्धिमान न तो जीवितों के लिए शोक करते हैं और न ही मृतकों के लिए।' अस्थायी परिस्थितियों से परे अपने शाश्वत स्वभाव पर ध्यान केंद्रित करें।",
    "भगवान कृष्ण कहते हैं, 'जो कर्म में अकर्म और अकर्म में कर्म देखता है, वह मनुष्यों में बुद्धिमान है।' संतुलित कर्म में शांति पाएं।",
  ],
  "kn-IN": [
    "ಭಗವಾನ್ ಕೃಷ್ಣನು ಭಗವದ್ಗೀತೆಯಲ್ಲಿ ಹೇಳಿದಂತೆ, 'ನಿಮಗೆ ನಿಮ್ಮ ನಿಯಮಿತ ಕರ್ತವ್ಯಗಳನ್ನು ನಿರ್ವಹಿಸುವ ಹಕ್ಕಿದೆ, ಆದರೆ ನಿಮ್ಮ ಕ್ರಿಯೆಗಳ ಫಲಗಳಿಗೆ ನೀವು ಹಕ್ಕುದಾರರಲ್ಲ.' ಫಲಿತಾಂಶಗಳಿಗೆ ಅಂಟಿಕೊಳ್ಳದೆ ನಿಮ್ಮ ಪ್ರಯತ್ನಗಳ ಮೇಲೆ ಗಮನ ಕೇಂದ್ರೀಕರಿಸಿ.",
    "ಭಗವದ್ಗೀತೆಯು ನಮಗೆ ನೆನಪಿಸುತ್ತದೆ, 'ಆತ್ಮಕ್ಕೆ ಜನನವೂ ಇಲ್ಲ, ಮರಣವೂ ಇಲ್ಲ. ದೇಹವು ನಾಶವಾದಾಗ ಅದು ನಾಶವಾಗುವುದಿಲ್ಲ.' ನಿಮ್ಮ ನಿಜವಾದ ಸ್ವರೂಪವು ಶಾಶ್ವತ ಮತ್ತು ಬದಲಾಗದು.",
    "ಕೃಷ್ಣನು ಸಲಹೆ ನೀಡುತ್ತಾನೆ, 'ಆದದ್ದು ಒಳ್ಳೆಯದಕ್ಕಾಗಿ ಆಯಿತು. ಆಗುತ್ತಿರುವುದು ಒಳ್ಳೆಯದಕ್ಕಾಗಿ ಆಗುತ್ತಿದೆ. ಆಗಲಿರುವುದೂ ಒಳ್ಳೆಯದಕ್ಕಾಗಿಯೇ ಆಗುತ್ತದೆ.' ದೈವಿಕ ಯೋಜನೆಯಲ್ಲಿ ನಂಬಿಕೆ ಇಡಿ.",
    "ಗೀತೆಯು ನಮಗೆ ಕಲಿಸುವುದೇನೆಂದರೆ 'ಜ್ಞಾನಿಗಳು ಜೀವಿಸುವವರಿಗಾಗಿಯೂ ಮೃತರಿಗಾಗಿಯೂ ದುಃಖಿಸುವುದಿಲ್ಲ.' ತಾತ್ಕಾಲಿಕ ಸನ್ನಿವೇಶಗಳನ್ನು ಮೀರಿ ನಿಮ್ಮ ಶಾಶ್ವತ ಸ್ವಭಾವದ ಮೇಲೆ ಗಮನ ಕೇಂದ್ರೀಕರಿಸಿ.",
    "ಭಗವಾನ್ ಕೃಷ್ಣನು ಹೇಳುತ್ತಾನೆ, 'ಕರ್ಮದಲ್ಲಿ ಅಕರ್ಮವನ್ನು ಮತ್ತು ಅಕರ್ಮದಲ್ಲಿ ಕರ್ಮವನ್ನು ನೋಡುವವನು ಮನುಷ್ಯರಲ್ಲಿ ಬುದ್ಧಿವಂತ.' ಸಮತೋಲಿತ ಕ್ರಿಯೆಯಲ್ಲಿ ಶಾಂತಿಯನ್ನು ಕಂಡುಕೊಳ್ಳಿ.",
  ],
  "sa-IN": [
    "यथा भगवान् कृष्णः भगवद्गीतायां शिक्षयति, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।' फलासक्तिं विना स्वप्रयत्नेषु ध्यानं केन्द्रयत।",
    "भगवद्गीता स्मारयति, 'न जायते म्रियते वा कदाचित् नायं भूत्वा भविता वा न भूयः।' भवतः वास्तविकं स्वरूपं शाश्वतं अपरिवर्तनीयं च अस्ति।",
    "कृष्णः उपदिशति, 'यद् यद् भवति, तत् सर्वं शुभाय एव भवति। यद् भवति, तद् शुभाय एव भवति। यद् भविष्यति, तद् अपि शुभाय एव भविष्यति।' दैवी योजनायां विश्वासं कुरु।",
    "गीता शिक्षयति यत् 'धीराः न जीवतां न मृतानां च शोकं कुर्वन्ति।' अस्थायी परिस्थितीः अतिक्रम्य स्वस्य शाश्वतस्वभावे ध्यानं केन्द्रय।",
    "भगवान् कृष्णः वदति, 'कर्मणि अकर्म यः पश्येत् अकर्मणि च कर्म यः, स बुद्धिमान् मनुष्येषु।' सन्तुलित कर्मणि शान्तिं प्राप्नुहि।",
  ]
};

export async function queryGemini(prompt: string, language: string = "en-US"): Promise<GeminiResponse> {
  try {
    // This is a placeholder - replace with actual Gemini API integration
    console.log("Sending to Gemini LLM:", prompt);
    
    // Get responses for the selected language, fallback to English if language not available
    const languageResponses = responses[language] || responses["en-US"];
    
    // Return a random response in the selected language
    const randomResponse = languageResponses[Math.floor(Math.random() * languageResponses.length)];
    
    return { text: randomResponse };
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
