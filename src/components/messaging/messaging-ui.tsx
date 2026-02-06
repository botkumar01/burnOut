'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  MessageSquare, Send, Hash, User, Users, Megaphone, Plus, X
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'team' | 'announcement';
  participants: string[];
  lastMessageAt: string;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export function MessagingUI() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChannels = useCallback(async () => {
    if (!user) return;
    try {
      const [chRes, uRes] = await Promise.all([
        fetch(`/api/messages/channels?userId=${user.id}`),
        fetch('/api/workers'),
      ]);
      if (chRes.ok) {
        const data = await chRes.json();
        setChannels(data);
        if (!selectedChannel && data.length > 0) setSelectedChannel(data[0].id);
      }
      if (uRes.ok) setUsers(await uRes.json());
    } catch {}
  }, [user, selectedChannel]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChannel) return;
    try {
      const res = await fetch(`/api/messages?channelId=${selectedChannel}`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, [selectedChannel]);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!user || !selectedChannel || !newMessage.trim()) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel,
          senderId: user.id,
          content: newMessage.trim(),
        }),
      });
      setNewMessage('');
      fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startConversation = async (otherUser: UserInfo) => {
    if (!user || creatingChannel) return;

    // Check if a DM channel already exists between these two users
    const existingDM = channels.find(
      ch => ch.type === 'direct' &&
        ch.participants.includes(user.id) &&
        ch.participants.includes(otherUser.id)
    );

    if (existingDM) {
      setSelectedChannel(existingDM.id);
      setShowNewChat(false);
      return;
    }

    // Create new DM channel
    setCreatingChannel(true);
    try {
      const myName = users.find(u => u.id === user.id)?.name || user.name;
      const res = await fetch('/api/messages/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${myName} \u2194 ${otherUser.name}`,
          type: 'direct',
          participants: [user.id, otherUser.id],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newCh = data.channel;
        setChannels(prev => [...prev, newCh]);
        setSelectedChannel(newCh.id);
      }
    } catch {}
    setCreatingChannel(false);
    setShowNewChat(false);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getUserAvatar = (id: string) => users.find(u => u.id === id)?.avatar || '?';
  const channel = channels.find(c => c.id === selectedChannel);

  // Users available for new conversations (exclude self)
  const availableUsers = users.filter(u => u.id !== user?.id);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User size={14} />;
      case 'team': return <Hash size={14} />;
      case 'announcement': return <Megaphone size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-brand-400" />
        Messages
      </h1>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Channel List */}
        <div className="w-64 glass-card flex flex-col">
          <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channels</h3>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="New conversation"
            >
              {showNewChat ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {/* New Conversation Dropdown */}
          {showNewChat && (
            <div className="border-b border-slate-700/50 p-2 space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">Start a conversation</p>
              {availableUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u)}
                  disabled={creatingChannel}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all disabled:opacity-50"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    u.role === 'leader' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                  }`}>
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{u.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                  selectedChannel === ch.id
                    ? 'bg-brand-600/20 text-white border border-brand-500/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white border border-transparent'
                }`}
              >
                <span className={`${selectedChannel === ch.id ? 'text-brand-400' : 'text-slate-500'}`}>
                  {getChannelIcon(ch.type)}
                </span>
                <span className="text-sm truncate flex-1">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card flex flex-col">
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
            {channel && (
              <>
                <span className="text-slate-400">{getChannelIcon(channel.type)}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{channel.name}</h3>
                  <p className="text-xs text-slate-500">
                    {channel.type === 'direct' ? 'Direct message' :
                     channel.type === 'team' ? `${channel.participants.length} members` :
                     'Announcement channel'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;
              return (
                <div key={msg.id} className={`flex gap-3 ${!showAvatar ? 'ml-11' : ''}`}>
                  {showAvatar && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      isMe ? 'bg-gradient-to-br from-brand-500 to-purple-500' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                    }`}>
                      {getUserAvatar(msg.senderId)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white">{getUserName(msg.senderId)}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-slate-300 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 input-dark"
                placeholder={channel ? `Message ${channel.name}...` : 'Select a channel'}
                disabled={!selectedChannel}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
