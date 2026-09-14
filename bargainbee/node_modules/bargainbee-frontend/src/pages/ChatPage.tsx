import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { formatRelativeTime } from '../utils';
import api from '../api/client';
import { ChatMessage } from '../types';

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/rooms/${roomId}/messages`);
      return data.messages;
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io('/', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.emit('join_room', roomId);

    socket.on('message_received', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId, body: inputText });
    }
    setInputText('');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto py-4">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm font-semibold text-bee-gray hover:text-bee-black mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="card h-[70vh] flex flex-col overflow-hidden">
        {/* Anti-fraud safety header */}
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Safety Shield: Do NOT share raw phone numbers or transfer outside Escrow.</span>
          </div>
        </div>

        {/* Chat message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-bee-yellow text-bee-black font-medium rounded-br-none'
                      : 'bg-gray-100 text-bee-black rounded-bl-none'
                  }`}
                >
                  <p>{msg.body}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.sender?.name || 'User'} • {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="input-field flex-1"
          />
          <Button type="submit" variant="primary" icon={<Send className="w-4 h-4" />}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
