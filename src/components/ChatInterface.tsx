
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle, Globe, Trash2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { queryGemini } from '../services/geminiService';
import MessageList from './MessageList';
import { useToast } from '@/hooks/use-toast';

// Create a new SpeechService to handle text-to-speech functionality
import SpeechService from '../services/speechService';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default language
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechServiceRef = useRef<SpeechService>(new SpeechService());
  const { toast } = useToast();

  // List of supported languages
  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'sa-IN', name: 'Sanskrit' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
  ];

  // Greeting messages in different languages
  const greetingMessages = {
    'en-US': 'Speak or type your question to receive guidance. Krishna\'s wisdom awaits your inquiry.',
    'hi-IN': 'मार्गदर्शन प्राप्त करने के लिए अपना प्रश्न बोलें या टाइप करें। कृष्ण का ज्ञान आपके प्रश्न की प्रतीक्षा कर रहा है।',
    'kn-IN': 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಲು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಕೃಷ್ಣನ ಜ್ಞಾನವು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ.',
    'sa-IN': 'मार्गदर्शनं प्राप्तुं प्रश्नं वदतु अथवा लिखतु। कृष्णस्य ज्ञानं भवतः प्रश्नस्य प्रतीक्षायां वर्तते।',
    'mr-IN': 'मार्गदर्शन मिळवण्यासाठी आपला प्रश्न बोला किंवा टाइप करा. कृष्णाचे ज्ञान आपल्या प्रश्नाची प्रतीक्षा करत आहे.',
    'bn-IN': 'নির্দেশনা পেতে আপনার প্রশ্ন বলুন বা টাইপ করুন। কৃষ্ণের জ্ঞান আপনার প্রশ্নের অপেক্ষায় রয়েছে।'
  };

  // Initialize speech service and set up event listeners
  useEffect(() => {
    // Initialize the speech service
    speechServiceRef.current = new SpeechService();
    
    // Set up speech service event listeners
    const speechService = speechServiceRef.current;
    
    speechService.onSpeechStart = () => {
      setIsSpeaking(true);
    };
    
    speechService.onSpeechEnd = () => {
      setIsSpeaking(false);
    };
    
    speechService.onSpeechError = (error) => {
      console.error("Speech error:", error);
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "There was an error with the text-to-speech. Please try again.",
        variant: "destructive"
      });
    };
    
    // Clean up event listeners on component unmount
    return () => {
      speechService.cleanup();
    };
  }, [toast]);

  // Pre-load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Force voices to load
      speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log("Available voices loaded:", voices.map(v => `${v.name} (${v.lang})`));
      };
      
      // Try to trigger voice loading
      speechSynthesis.getVoices();
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setTranscript('');
    setIsProcessing(true);

    try {
      // Get response from Gemini LLM in the selected language
      const response = await queryGemini(text, language);
      
      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', text: response.text }]);
      
      // Speak the response in the selected language
      speakResponse(response.text);
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Get error message in the selected language
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
      
      // Speak the error message in the selected language
      speakResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    // Stop any ongoing speech first
    stopSpeaking();
    
    // Use the speech service to speak the text in the selected language
    speechServiceRef.current.speak(text, language);
  };

  const stopSpeaking = () => {
    // Stop any ongoing speech
    speechServiceRef.current.stop();
    setIsSpeaking(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    // Stop any ongoing speech
    stopSpeaking();
    
    // If currently recording, restart with new language
    if (isRecording) {
      stopRecording();
      // Short delay to ensure previous recognition is stopped
      setTimeout(() => {
        startRecording(newLanguage);
      }, 300);
    }
  };

  const clearChat = () => {
    // Stop any ongoing speech
    stopSpeaking();
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Clear messages and reset state
    setMessages([]);
    setInput('');
    setTranscript('');
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
      stopRecording();
    }
  };

  const startRecording = (selectedLanguage: string) => {
    setTranscript('');
    
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
        setTranscript(currentTranscript);
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
        if (isRecording) {
          // Only set to false if we manually stopped recording
          setIsRecording(false);
        }
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

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // If there's a transcript, send it as a message
      if (transcript.trim()) {
        handleSendMessage(transcript);
      }
    }
  };

  // Get the greeting message for the current language
  const greetingMessage = greetingMessages[language] || greetingMessages['en-US'];

  return (
    <div className="chat-container">
      <MessageList 
        messages={messages}
        isProcessing={isProcessing}
        transcript={transcript}
        isRecording={isRecording}
        greetingMessage={greetingMessage}
      />
      
      <div className="input-container">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <label htmlFor="language-select" className="flex items-center text-sm text-divine-blue/70 dark:text-divine-gold/70 mr-2">
              <Globe className="h-4 w-4 mr-1" />
              Language:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="text-sm rounded border-divine-gold/30 bg-white/70 dark:bg-divine-blue/50 dark:text-white focus:ring-divine-gold/50 focus:border-divine-gold/50"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <Button
                onClick={stopSpeaking}
                variant="ghost"
                size="sm"
                className="text-sm flex items-center gap-1 text-red-500 hover:bg-red-500/10"
                title="Stop Speaking"
              >
                <VolumeX className="h-4 w-4" />
                Stop Voice
              </Button>
            )}
            
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-sm flex items-center gap-1 text-divine-blue/70 dark:text-divine-gold/70 hover:bg-divine-blue/10 dark:hover:bg-divine-gold/20"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
          placeholder="Ask your question..."
          className="divine-input"
          disabled={isRecording || isProcessing}
        />
        <div className="flex gap-2 absolute right-6 bottom-6">
          <Button
            onClick={toggleRecording}
            variant="ghost"
            size="icon"
            className={`rounded-full ${isRecording ? 'animate-divine-pulse bg-red-500/20 dark:bg-red-500/40' : 'bg-divine-gold/20 dark:bg-divine-gold/30 hover:bg-divine-gold/30 dark:hover:bg-divine-gold/40'}`}
            disabled={isProcessing}
          >
            {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            onClick={() => handleSendMessage(input)}
            variant="ghost"
            size="icon"
            className="rounded-full bg-divine-gold/20 dark:bg-divine-gold/30 hover:bg-divine-gold/30 dark:hover:bg-divine-gold/40"
            disabled={!input.trim() || isRecording || isProcessing}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
