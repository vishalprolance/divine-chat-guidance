
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SpeechService from '../services/speechService';
import { queryGemini } from '../services/geminiService';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import LanguageSelector from './LanguageSelector';
import ChatActions from './ChatActions';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default language
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechServiceRef = useRef<SpeechService>(new SpeechService());
  const temporaryTranscriptRef = useRef<string>('');
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'sa-IN', name: 'Sanskrit' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
  ];

  const greetingMessages = {
    'en-US': 'Speak or type your question to receive guidance. Krishna\'s wisdom awaits your inquiry.',
    'hi-IN': 'मार्गदर्शन प्राप्त करने के लिए अपना प्रश्न बोलें या टाइप करें। कृष्ण का ज्ञान आपके प्रश्न की प्रतीक्षा कर रहा है।',
    'kn-IN': 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಲು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಕೃಷ್ಣನ ಜ್ಞಾನವು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ.',
    'sa-IN': 'मार्गदर्शनं प्राप्तुं प्रश्नं वदतु अथवा लिखतु। कृष्णस्य ज्ञानं भवतः प्रश्नस्य प्रतीक्षायां वर्तते।',
    'mr-IN': 'मार्गदर्शन मिळवण्यासाठी आपला प्रश्न बोला किंवा टाइप करा. कृष्णाचे ज्ञान आपल्या प्रश्नाची प्रतीक्षा करत आहे.',
    'bn-IN': 'নির্দেশনা পেতে আপনার প্রশ্ন বলুন বা টাইপ করুন। কৃষ্ণের জ্ঞান আপনার প্রশ্নের অপেক্ষায় রয়েছে।'
  };

  useEffect(() => {
    speechServiceRef.current = new SpeechService();
    
    const speechService = speechServiceRef.current;
    
    speechService.onSpeechStart = () => {
      setIsSpeaking(true);
    };
    
    speechService.onSpeechEnd = () => {
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
    };
    
    speechService.onSpeechError = (error) => {
      console.error("Speech error:", error);
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
      
      toast({
        title: "Speech Error",
        description: "There was an error with the text-to-speech. Please try again.",
        variant: "destructive"
      });
    };
    
    speechService.onTextHighlight = (text, index) => {
      setHighlightedWordIndex(index);
      setCurrentSpeakingMessage(text);
    };
    
    return () => {
      speechService.cleanup();
    };
  }, [toast]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log("Available voices loaded:", voices.map(v => `${v.name} (${v.lang})`));
      };
      
      speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
  }, [fontSize]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setTranscript('');
    temporaryTranscriptRef.current = '';
    setIsProcessing(true);

    try {
      const response = await queryGemini(text, language);
      
      setMessages(prev => [...prev, { type: 'bot', text: response.text }]);
      
      speakResponse(response.text);
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
      
      speakResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    stopSpeaking();
    
    speechServiceRef.current.speak(text, language);
  };

  const stopSpeaking = () => {
    speechServiceRef.current.stop();
    setIsSpeaking(false);
    setHighlightedWordIndex(null);
    setCurrentSpeakingMessage(null);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    
    stopSpeaking();
    
    if (isRecording) {
      stopRecording(false);
      
      setTimeout(() => {
        startRecording(value);
      }, 300);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    
    if (isRecording) {
      stopRecording(false);
    }
    
    setMessages([]);
    setInput('');
    setTranscript('');
    temporaryTranscriptRef.current = '';
    setIsProcessing(false);
    
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared.",
    });
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      startRecording(language);
    } else {
      stopRecording(true);
    }
  };

  const startRecording = (selectedLanguage: string) => {
    setTranscript('');
    temporaryTranscriptRef.current = '';
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started in language:', selectedLanguage);
      };
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        temporaryTranscriptRef.current = currentTranscript;
        
        setInput(currentTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported in this browser');
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser. Please try using Chrome, Edge, or Safari.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = (sendTranscript: boolean = false) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      if (temporaryTranscriptRef.current.trim() && sendTranscript) {
        handleSendMessage(temporaryTranscriptRef.current.trim());
      }
      
      setTranscript('');
    }
  };

  const speakLastMessage = () => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'bot') {
      speakResponse(messages[messages.length - 1].text);
    }
  };

  const greetingMessage = greetingMessages[language] || greetingMessages['en-US'];

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <LanguageSelector 
          language={language}
          onChange={handleLanguageChange}
          languages={languages}
        />
        
        <ChatActions 
          messages={messages}
          isSpeaking={isSpeaking}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClearChat={clearChat}
          onStopSpeaking={stopSpeaking}
          onSpeakLastMessage={speakLastMessage}
        />
      </div>
      
      <div className="flex-grow overflow-hidden relative">
        <MessageList 
          messages={messages}
          isProcessing={isProcessing}
          transcript={transcript}
          isRecording={isRecording}
          greetingMessage={greetingMessage}
          fontSize={fontSize}
          highlightedWordIndex={highlightedWordIndex}
          currentSpeakingMessage={currentSpeakingMessage}
        />
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <ChatInput 
          input={input}
          setInput={setInput}
          isRecording={isRecording}
          isProcessing={isProcessing}
          toggleRecording={toggleRecording}
          handleSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
