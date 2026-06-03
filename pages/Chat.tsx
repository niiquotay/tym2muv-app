import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getChats, fetchMessages, sendMessage, createChat, getUserProfile, mapMessage } from '../services/supabaseService';
import { Chat as ChatType, User, ChatMessage } from '../types';
import Icon from '../components/Icon';
import { sanitizeString } from '../services/security';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import SkeletonCard from '../components/SkeletonCard';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatType | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Resolve other participant details
  const [participants, setParticipants] = useState<Record<string, User>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    // Initialize Chats with real-time listener
    const unsubscribe = getChats(currentUser.id, (updatedChats) => {
      setChats(updatedChats);
      setIsLoadingChats(false);
      
      // Resolve Users for new participants
      const userIds = new Set<string>();
      updatedChats.forEach(c => c.participants.forEach(p => {
        if (p !== currentUser.id) userIds.add(p);
      }));

      userIds.forEach(async (uid) => {
        if (!participants[uid]) {
          const u = await getUserProfile(uid);
          if (u) setParticipants(prev => ({ ...prev, [uid]: u }));
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Handle URL params for starting a new chat
    const startWithUserId = searchParams.get('to');
    const listingId = searchParams.get('listingId') || undefined;

    if (startWithUserId && startWithUserId !== currentUser.id) {
      const startNewChat = async () => {
        try {
          const chatId = await createChat(currentUser.id, startWithUserId, listingId);
          setActiveChatId(chatId);
        } catch (error) {
          console.error("Error creating chat:", error);
          setError('Failed to start chat. Please try again.');
        }
      };
      startNewChat();
    }
  }, [searchParams, currentUser, retryKey]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setActiveChat(undefined);
      return;
    }

    const chat = chats.find(c => c.id === activeChatId);
    setActiveChat(chat);
    
    const loadMessages = async () => {
      const msgs = await fetchMessages(activeChatId);
      setMessages(msgs);
    };
    loadMessages();
  }, [activeChatId, chats]);

  // Handle new incoming messages via realtime subscription
  useRealtimeSubscription(
    {
      table: 'messages',
      event: 'INSERT',
      filter: `chat_id=eq.${activeChatId}`,
    },
    (payload) => {
      setMessages(prev => [...prev, mapMessage(payload.new)]);
    },
    !!activeChatId // Only enabled when an active chat is selected
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeChatId || !currentUser) return;

    const text = messageInput.trim();
    setMessageInput('');

    try {
      await sendMessage(activeChatId, currentUser.id, text);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageInput(text); // Restore input on error
    }
  };

  const getOtherParticipant = (chat: ChatType) => {
    const otherId = chat.participants.find(p => p !== currentUser?.id);
    return otherId ? participants[otherId] : undefined;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-4 h-[calc(100vh-5rem)] flex items-center justify-center">
        <ErrorBanner message={error} onRetry={() => setRetryKey(k => k + 1)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-4 h-[calc(100vh-5rem)]"> {/* Standardized padding with gap */}
       <div className="glass-card rounded-3xl shadow-lg border border-slate-200 h-full overflow-hidden flex">
          
          {/* Sidebar / Inbox List */}
          <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white/50`}>
             <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Messages</h2>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingChats ? (
                        <div className="p-4 space-y-4">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="messageCircle" size={32} className="mx-auto mb-2 text-slate-300" />
                            <p>No messages yet.</p>
                        </div>
                    ) : (
                        chats.map(chat => {
                            const otherUser = getOtherParticipant(chat);
                            const isUnread = chat.unreadCount > 0 && chat.lastSenderId !== currentUser?.id;
                            return (
                                <div 
                                    key={chat.id}
                                    onClick={() => setActiveChatId(chat.id)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeChatId === chat.id ? 'bg-brand-50/50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex gap-3">
                                        <img 
                                          src={otherUser?.avatar || 'https://via.placeholder.com/50'} 
                                          alt={otherUser?.name} 
                                          referrerPolicy="no-referrer"
                                          className="w-12 h-12 rounded-full object-cover bg-slate-200"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{otherUser?.name || 'User'}</h3>
                                                <span className="text-xs text-slate-400">{chat.lastMessageTime}</span>
                                            </div>
                                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
             </div>
          </div>

          {/* Chat Window */}
          <div className={`${!activeChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50/30`}>
              {activeChatId ? (
                  <>
                    {/* Header */}
                    <div className="p-4 bg-white/60 backdrop-blur-sm border-b border-slate-200 flex items-center gap-3 shadow-sm">
                        <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <Icon name="chevronRight" size={20} className="rotate-180" />
                        </button>
                        {(() => {
                            const otherUser = activeChat && getOtherParticipant(activeChat);
                            return otherUser ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={otherUser.avatar} alt={otherUser.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                                        {otherUser.verified && (
                                            <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white p-0.5 rounded-full border border-white">
                                                <Icon name="check" size={8} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{otherUser.name}</h3>
                                        <p className="text-xs text-brand-600 flex items-center gap-1">
                                            {activeChat?.listingId && <><Icon name="home" size={10} /> Property Inquiry</>}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg) => {
                            const isMe = msg.senderId === currentUser?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-5 py-3 rounded-2xl ${
                                        isMe 
                                        ? 'bg-brand-600 text-white rounded-tr-sm' 
                                        : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-sm'
                                    }`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>{msg.timestamp}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-slate-200">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <button type="button" className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors">
                                <Icon name="plus" size={24} />
                            </button>
                            <input 
                                type="text" 
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..." 
                                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <button 
                                type="submit" 
                                disabled={!messageInput.trim()}
                                className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20"
                            >
                                <Icon name="send" size={20} />
                            </button>
                        </form>
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Icon name="messageCircle" size={48} className="text-slate-300" />
                      </div>
                      <p className="text-lg">Select a conversation to start chatting</p>
                  </div>
              )}
          </div>
       </div>
    </div>
  );
};

export default Chat;