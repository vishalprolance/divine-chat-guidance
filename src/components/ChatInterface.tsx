
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle } from 'lucide-react';
import { Button } from './ui/button';
import { queryGemini } from '../services/geminiService';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Male') || voice.name.includes('Google')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    setTranscript('');
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Enable multiple languages
      // Note: not all browsers support all languages
      // The browser will use the best match from this list
      recognition.lang = 'en-US'; // Default to English
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started');
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
