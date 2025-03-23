
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle, Globe, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { queryGemini } from '../services/geminiService';
import MessageList from './MessageList';
import { useToast } from '@/hooks/use-toast';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default language
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // List of supported languages
  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'sa-IN', name: 'Sanskrit' },
  ];

  // Greeting messages in different languages
  const greetingMessages = {
    'en-US': 'Speak or type your question to receive guidance. Krishna\'s wisdom awaits your inquiry.',
    'hi-IN': 'मार्गदर्शन प्राप्त करने के लिए अपना प्रश्न बोलें या टाइप करें। कृष्ण का ज्ञान आपके प्रश्न की प्रतीक्षा कर रहा है।',
    'kn-IN': 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಲು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಕೃಷ್ಣನ ಜ್ಞಾನವು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ.',
    'sa-IN': 'मार्गदर्शनं प्राप्तुं प्रश्नं वदतु अथवा लिखतु। कृष्णस्य ज्ञानं भवतः प्रश्नस्य प्रतीक्षायां वर्तते।'
  };

  // Pre-load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // This ensures voices are loaded in Safari and other browsers
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
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
      toast({
        title: "Error",
        description: "I apologize, but I'm having trouble connecting to the wisdom right now. Please try again later.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "I apologize, but I'm having trouble connecting to the wisdom right now. Please try again later." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      
      // Set the language of the utterance to the currently selected language
      utterance.lang = language;
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a voice that matches the current language
      let preferredVoice = voices.find(voice => 
        voice.lang.startsWith(language.split('-')[0]) || 
        voice.name.includes(language.split('-')[0])
      );
      
      // Fallback to any available voice if no language match
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => 
          voice.name.includes('Male') || voice.name.includes('Google')
        );
      }
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
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
