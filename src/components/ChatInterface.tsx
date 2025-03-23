
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle } from 'lucide-react';
import { Button } from './ui/button';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // TODO: Integrate with LLM API for response
    // For now, we'll use a placeholder response
    const botResponse = "As Krishna teaches in the Bhagavad Gita, 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.' This wisdom reminds us to focus on our actions with pure intentions, without attachment to outcomes.";
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    }, 1000);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // TODO: Implement speech-to-text
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      setIsRecording(false);
      // TODO: Stop recording and process speech
    }
  };

  return (
    <div className="chat-container">
      <div className="message-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.text}
          </div>
        ))}
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
        />
        <div className="flex gap-2 absolute right-6 bottom-6">
          <Button
            onClick={toggleRecording}
            variant="ghost"
            size="icon"
            className={`rounded-full ${isRecording ? 'animate-divine-pulse bg-red-500/20' : 'bg-divine-gold/20 hover:bg-divine-gold/30'}`}
          >
            {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            onClick={() => handleSendMessage(input)}
            variant="ghost"
            size="icon"
            className="rounded-full bg-divine-gold/20 hover:bg-divine-gold/30"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
