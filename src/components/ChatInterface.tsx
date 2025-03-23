
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { queryGemini } from '../services/geminiService';
import { Select } from './ui/select';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default language
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // List of supported languages
  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'sa-IN', name: 'Sanskrit' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Get response from Gemini LLM
      const response = await queryGemini(text);
      
      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', text: response.text }]);
      
      // Speak the response
      speakResponse(response.text);
    } catch (error) {
      console.error("Error processing message:", error);
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
      
      // Try to match the language of the utterance to the current speech recognition language
      utterance.lang = language;
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a voice that matches the current language
      let preferredVoice = voices.find(voice => 
        voice.lang.startsWith(language.split('-')[0]) || 
        voice.name.includes('Google')
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
    setLanguage(e.target.value);
    
    // If currently recording, restart with new language
    if (isRecording) {
      stopRecording();
      // Short delay to ensure previous recognition is stopped
      setTimeout(() => {
        startRecording(e.target.value);
      }, 300);
    }
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
      alert('Speech recognition is not supported in this browser. Please try using Chrome, Edge, or Safari.');
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

  return (
    <div className="chat-container">
      <div className="message-container">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-divine-blue/60 animate-divine-fade-in">
            <p className="text-center mb-4">Speak or type your question to receive guidance</p>
            <p className="text-sm text-center">Krishna's wisdom awaits your inquiry</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.text}
          </div>
        ))}
        
        {isProcessing && (
          <div className="message bot-message">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        {transcript && isRecording && (
          <div className="message user-message opacity-70">
            {transcript}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <div className="flex mb-2">
          <label htmlFor="language-select" className="flex items-center text-sm text-divine-blue/70 mr-2">
            <Globe className="h-4 w-4 mr-1" />
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="text-sm rounded border-divine-gold/30 bg-white/70 focus:ring-divine-gold/50 focus:border-divine-gold/50"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
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
            className={`rounded-full ${isRecording ? 'animate-divine-pulse bg-red-500/20' : 'bg-divine-gold/20 hover:bg-divine-gold/30'}`}
            disabled={isProcessing}
          >
            {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            onClick={() => handleSendMessage(input)}
            variant="ghost"
            size="icon"
            className="rounded-full bg-divine-gold/20 hover:bg-divine-gold/30"
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
