
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryGemini } from '../services/geminiService';

export function useChatState() {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const handleSendMessage = async (text: string, language: string, speakResponse: (text: string, language: string) => void) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await queryGemini(text, language);
      
      setMessages(prev => [...prev, { type: 'bot', text: response.text }]);
      
      speakResponse(response.text, language);
    } catch (error) {
      console.error("Error processing message:", error);
      
      const errorMessages = {
        "en-US": "I apologize, but I'm having trouble connecting to the wisdom right now. Please try again later.",
        "hi-IN": "मैं क्षमा चाहता हूं, लेकिन मुझे इस समय ज्ञान से जुड़ने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें।",
        "kn-IN": "ನಾನು ಕ್ಷಮೆ ಕೇಳುತ್ತೇನೆ, ಆದರೆ ನನಗೆ ಈಗ ಜ್ಞಾನದೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ತೊಂದರೆಯಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
        "sa-IN": "अहं क्षमां प्रार्थये, परन्तु मम अधुना ज्ञानेन सह संयोजने समस्या अस्ति। कृपया पश्चात् पुनः प्रयत्नं कुर्वन्तु।",
        "mr-IN": "मी क्षमा मागतो, परंतु मला सध्या ज्ञानाशी जोडण्यात समस्या येत आहे. कृपया नंतर पुन्हा प्रयत्न करा.",
        "bn-IN": "আমি ক্ষমা চাই, কিন্তু আমি এখন জ্ঞানের সাথে সংযোগ করতে সমস্যা হচ্ছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
      };
      
      const errorMessage = errorMessages[language] || errorMessages["en-US"];
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: errorMessage
      }]);
      
      speakResponse(errorMessage, language);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = (stopSpeaking: () => void, isRecording: boolean, stopRecording: (sendTranscript: boolean) => string) => {
    stopSpeaking();
    
    if (isRecording) {
      stopRecording(false);
    }
    
    setMessages([]);
    setInput('');
    setIsProcessing(false);
    
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared.",
    });
  };

  return {
    messages,
    input,
    setInput,
    isProcessing,
    handleSendMessage,
    clearChat
  };
}
