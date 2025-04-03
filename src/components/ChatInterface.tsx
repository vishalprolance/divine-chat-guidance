import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Send, 
  StopCircle, 
  Globe, 
  Trash2, 
  VolumeX,
  Settings,
  Volume2
} from 'lucide-react';
import { Button } from './ui/button';
import { queryGemini } from '../services/geminiService';
import MessageList from './MessageList';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import FontSizeSettings from './FontSizeSettings';
import SpeechService from '../services/speechService';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [showsSettings, setShowSettings] = useState(false);
  
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    stopSpeaking();
    
    if (isRecording) {
      stopRecording(false);
      
      setTimeout(() => {
        startRecording(newLanguage);
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
      stopRecording(false);
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
        setInput(temporaryTranscriptRef.current.trim());
      }
      
      setTranscript('');
    }
  };

  const greetingMessage = greetingMessages[language] || greetingMessages['en-US'];

  return (
    <div className="chat-container h-full flex flex-col">
      <ScrollArea className="message-container flex-grow overflow-hidden">
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
      </ScrollArea>
      
      <div className="input-container mt-auto">
        <div className="flex flex-wrap justify-between mb-2 gap-2">
          <div className="flex items-center">
            <label htmlFor="language-select" className="flex items-center text-sm text-white/90 dark:text-divine-gold/90 mr-2">
              <Globe className="h-4 w-4 mr-1" />
              Language:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="text-sm rounded border-divine-gold/30 bg-white/20 dark:bg-divine-blue/30 text-white dark:text-divine-gold focus:ring-divine-gold/50 focus:border-divine-gold/50"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover open={showsSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm flex items-center gap-1 text-white/90 dark:text-divine-gold/90 hover:bg-white/10 dark:hover:bg-divine-gold/20"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white/90 dark:bg-divine-blue/90 border border-divine-gold/20">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none mb-2 text-divine-blue dark:text-divine-gold">Display Settings</h4>
                  <FontSizeSettings 
                    fontSize={fontSize} 
                    onFontSizeChange={setFontSize} 
                  />
                </div>
              </PopoverContent>
            </Popover>
            
            {isSpeaking ? (
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
            ) : messages.length > 0 && messages[messages.length - 1].type === 'bot' && (
              <Button
                onClick={() => speakResponse(messages[messages.length - 1].text)}
                variant="ghost"
                size="sm"
                className="text-sm flex items-center gap-1 text-white/90 dark:text-divine-gold/90 hover:bg-white/10 dark:hover:bg-divine-gold/20"
              >
                <Volume2 className="h-4 w-4" />
                Speak
              </Button>
            )}
            
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-sm flex items-center gap-1 text-white/90 dark:text-divine-gold/90 hover:bg-white/10 dark:hover:bg-divine-gold/20"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Ask your question..."
            className="divine-input"
            disabled={isProcessing}
          />
          <div className="flex gap-2 absolute right-6 bottom-1/2 transform translate-y-1/2">
            <Button
              onClick={toggleRecording}
              variant="ghost"
              size="icon"
              className={`rounded-full ${isRecording ? 'animate-divine-pulse bg-red-500/20 dark:bg-red-500/40' : 'bg-divine-gold/20 dark:bg-divine-gold/30 hover:bg-divine-gold/30 dark:hover:bg-divine-gold/40'}`}
              disabled={isProcessing}
            >
              {isRecording ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-white dark:text-divine-gold" />}
            </Button>
            <Button
              onClick={() => handleSendMessage(input)}
              variant="ghost"
              size="icon"
              className="rounded-full bg-divine-gold/20 dark:bg-divine-gold/30 hover:bg-divine-gold/30 dark:hover:bg-divine-gold/40"
              disabled={!input.trim() || isProcessing}
            >
              <Send className="h-5 w-5 text-white dark:text-divine-gold" />
            </Button>
          </div>
        </div>
      </div>
      
      <style>
        {`
        .chat-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          border-radius: 1rem;
          background-color: rgba(26, 35, 126, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 215, 0, 0.2);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .message-container {
          flex-grow: 1;
          overflow-hidden;
          padding: 1.25rem;
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .message {
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          max-width: 85%;
          animation: fadeIn 0.3s ease-in-out;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: var(--message-font-size, 16px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .user-message {
          background-color: rgba(63, 81, 181, 0.15);
          border-left: 4px solid rgba(63, 81, 181, 0.6);
          margin-left: auto;
          border-top-right-radius: 0;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .bot-message {
          background-color: rgba(255, 215, 0, 0.1);
          border-left: 4px solid rgba(255, 215, 0, 0.5);
          margin-right: auto;
          border-top-left-radius: 0;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .input-container {
          padding: 1rem;
          background-color: rgba(26, 35, 126, 0.4);
          border-top: 1px solid rgba(255, 215, 0, 0.2);
          color: rgba(255, 255, 255, 0.95);
        }
        
        .divine-input {
          width: 100%;
          padding: 0.75rem 4.5rem 0.75rem 1rem;
          border-radius: 9999px;
          border: 2px solid rgba(255, 215, 0, 0.3);
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.95);
          transition: all 0.3s ease;
        }
        
        .divine-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .divine-input:focus {
          outline: none;
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }
        
        .divine-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .animate-divine-pulse {
          animation: divine-pulse 1.5s infinite;
        }
        
        @keyframes divine-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .animate-divine-fade-in {
          animation: divine-fade-in 1s ease-out;
        }
        
        @keyframes divine-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 640px) {
          .chat-container {
            border-radius: 0.5rem;
            max-width: 100%;
          }
          
          .message {
            max-width: 90%;
            font-size: calc(var(--message-font-size, 16px) - 1px);
          }
        }
        `}
      </style>
    </div>
  );
};

export default ChatInterface;
