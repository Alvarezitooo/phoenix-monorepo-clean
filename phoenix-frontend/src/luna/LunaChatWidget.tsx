import { useState } from 'react';
import { sendChatMessage } from '../services/api';

interface Message {
  sender: 'user' | 'luna';
  text: string;
}

export default function LunaChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'luna', text: 'Bonjour ! Je suis Luna. Prêt à explorer ensemble votre avenir professionnel ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        user_id: 'user-123', // This will be dynamic in a real app
        message: input,
        persona: 'jeune_diplome'
      });
      const lunaMessage: Message = { sender: 'luna', text: response.luna_response };
      setMessages(prev => [...prev, lunaMessage]);
    } catch (error) {
      const errorMessage: Message = { 
        sender: 'luna', 
        text: 'Désolée, une erreur est survenue. Pouvez-vous réessayer ?' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col h-[600px]">
      <div className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="text-white">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="rounded-lg px-4 py-2 bg-gray-700">
              <p className="text-white">Luna réfléchit...</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-gray-700 text-white rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Écrivez votre message..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-purple-600 text-white rounded-r-lg px-4 hover:bg-purple-700 disabled:bg-purple-900"
          disabled={isLoading}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
