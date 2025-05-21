import { useState, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';
import { FaComments, FaTimes, FaRobot } from 'react-icons/fa'; // Import icons

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "I'm an AI assistant. How can I help you?", sender: 'bot' },
      ]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }]);
      setInput('');
      setLoading(true);

      try {
        const response = await fetch('http://127.0.0.1:5000/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: input }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let result = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: result, sender: 'bot' },
        ]);
      } catch (error) {
        console.error('Error:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `Error: ${error.message}`, sender: 'bot' },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <button className="chatbot-button" onClick={toggleChatbot}>
        <FaComments /> {/* Use chat icon */}
      </button>
      <div className={`chatbot ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <FaRobot className="chatbot-icon" /> {/* Chatbot icon */}
          <h2> Kriss Chatbot</h2>
          <FaTimes className="chatbot-close" onClick={toggleChatbot} /> {/* Close icon */}
        </div>
        <div className="chatbot-body">
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message ${
                  message.sender === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message bot-message">
                Kriss AI is thinking...
              </div>
            )}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress} // Handle Enter key press
              placeholder="Type a message..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
