'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { chatApi, doctorsApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, getInitials, timeAgo, formatDateTime } from '@/lib/utils';
import { MessageSquare, Search, Send, X, Plus, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  fileUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  sender?: ChatPerson & { role?: string };
}

interface ChatRoom {
  id: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  messages: Message[];
  patient?: { id: string; user: ChatPerson };
  doctor?: { id: string; user: ChatPerson; department?: { name: string } };
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = user?.role === 'DOCTOR';
  const myPersonId: string | undefined = isDoctor ? user?.doctor?.id : user?.patient?.id;

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const selectedRoomIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  const roomsQuery = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => chatApi.getRooms().then((r) => r.data as ChatRoom[]),
    enabled: !!myPersonId,
  });

  const rooms = roomsQuery.data || [];

  const counterpartOf = (room: ChatRoom): ChatPerson | undefined =>
    isDoctor ? room.patient?.user : room.doctor?.user;

  const filteredRooms = useMemo(() => {
    if (!roomSearch.trim()) return rooms;
    const q = roomSearch.toLowerCase();
    return rooms.filter((room) => {
      const person = counterpartOf(room);
      const name = `${person?.firstName || ''} ${person?.lastName || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [rooms, roomSearch, isDoctor]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', selectedRoomId],
    queryFn: () => chatApi.getMessages(selectedRoomId as string).then((r) => r.data as { messages: Message[] }),
    enabled: !!selectedRoomId,
  });

  useEffect(() => {
    setMessages(messagesQuery.data?.messages || []);
  }, [messagesQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket connection — set up once per user
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(`${SOCKET_URL}/chat`, { auth: { userId: user.id } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (message: Message) => {
      if (message.chatRoomId === selectedRoomIdRef.current) {
        setMessages((prev) => [...prev, message]);
        socket.emit('mark_read', { chatRoomId: message.chatRoomId, userId: user.id });
      }
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (prev) =>
        prev?.map((room) =>
          room.id === message.chatRoomId ? { ...room, messages: [message] } : room,
        ) ?? prev,
      );
    });

    socket.on('messages_read', ({ chatRoomId }: { chatRoomId: string }) => {
      if (chatRoomId === selectedRoomIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, readAt: m.readAt || new Date().toISOString() })));
      }
    });

    socket.on('error', (err: { message: string }) => {
      toast.error(err.message || 'Chat error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, queryClient]);

  // Join room + mark read when switching conversations
  useEffect(() => {
    if (!selectedRoomId || !socketRef.current || !user?.id) return;
    socketRef.current.emit('join_room', { roomId: selectedRoomId });
    socketRef.current.emit('mark_read', { chatRoomId: selectedRoomId, userId: user.id });
  }, [selectedRoomId, user?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !selectedRoomId || !socketRef.current || !user?.id) return;
    socketRef.current.emit('send_message', {
      chatRoomId: selectedRoomId,
      senderId: user.id,
      content,
    });
    setDraft('');
  };

  const createRoom = useMutation({
    mutationFn: (data: { patientId: string; doctorId: string }) =>
      chatApi.getOrCreateRoom(data).then((r) => r.data as ChatRoom),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      setSelectedRoomId(room.id);
      setShowNewChat(false);
    },
    onError: () => toast.error('Could not start conversation'),
  });

  if (!myPersonId) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Chat</h1>
          <p className="page-subtitle">Message your care team</p>
        </div>
        <div className="card text-center py-16">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chat isn&apos;t available for your account</p>
          <p className="text-slate-300 text-sm mt-1">Only doctors and patients can use messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex animate-fade-in">
      {/* Rooms list */}
      <aside className="w-80 shrink-0 border-r border-slate-100 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              placeholder="Search conversations"
              className="input pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsQuery.isLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="text-indigo-600 text-sm mt-2 hover:text-indigo-700">
                Start a new chat
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const person = counterpartOf(room);
              const lastMessage = room.messages?.[0];
              const isActive = room.id === selectedRoomId;
              const isUnread = !!lastMessage && lastMessage.senderId !== user?.id && !lastMessage.readAt;
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors',
                    isActive && 'bg-indigo-50 hover:bg-indigo-50',
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold shrink-0">
                    {person ? getInitials(person.firstName, person.lastName) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm truncate', isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                        {isDoctor ? '' : 'Dr. '}{person ? `${person.firstName} ${person.lastName}` : 'Unknown'}
                      </p>
                      {lastMessage && (
                        <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <p className={cn('text-xs truncate mt-0.5', isUnread ? 'text-slate-600 font-medium' : 'text-slate-400')}>
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </p>
                  </div>
                  {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <MessageSquare className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Select a conversation</p>
            <p className="text-slate-300 text-sm mt-1">Choose a chat from the list or start a new one</p>
          </div>
        ) : (
          <>
            <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
              {(() => {
                const person = counterpartOf(selectedRoom);
                return (
                  <>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                      {person ? getInitials(person.firstName, person.lastName) : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {isDoctor ? '' : 'Dr. '}{person ? `${person.firstName} ${person.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-green-500' : 'bg-slate-300')} />
                        {connected ? 'Connected' : 'Connecting…'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {messagesQuery.isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                    <div className="h-10 w-48 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-slate-400 text-sm font-medium">No messages yet</p>
                  <p className="text-slate-300 text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5', isMine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md')}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={cn('text-[10px] mt-1', isMine ? 'text-indigo-200' : 'text-slate-400')} title={formatDateTime(message.createdAt)}>
                          {timeAgo(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="px-6 py-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="input flex-1"
              />
              <button type="submit" disabled={!draft.trim() || !connected} className="btn-primary p-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </section>

      {showNewChat && (
        <NewChatModal
          isDoctor={isDoctor}
          myPersonId={myPersonId}
          existingRoomPersonIds={rooms.map((r) => (isDoctor ? r.patientId : r.doctorId))}
          onClose={() => setShowNewChat(false)}
          onSelect={(otherId) =>
            createRoom.mutate(
              isDoctor ? { patientId: otherId, doctorId: myPersonId } : { patientId: myPersonId, doctorId: otherId },
            )
          }
          submitting={createRoom.isPending}
        />
      )}
    </div>
  );
}

function NewChatModal({
  isDoctor,
  existingRoomPersonIds,
  onClose,
  onSelect,
  submitting,
}: {
  isDoctor: boolean;
  myPersonId: string;
  existingRoomPersonIds: string[];
  onClose: () => void;
  onSelect: (id: string) => void;
  submitting: boolean;
}) {
  const [search, setSearch] = useState('');

  const peopleQuery = useQuery({
    queryKey: isDoctor ? ['chat-new-patients'] : ['chat-new-doctors'],
    queryFn: () =>
      isDoctor
        ? patientsApi.getAll({ search: search || undefined }).then((r) => r.data.data)
        : doctorsApi.getAll().then((r) => r.data.data),
  });

  const people = peopleQuery.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          {isDoctor ? 'Message a Patient' : 'Message a Doctor'}
        </h3>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isDoctor ? 'Search patients…' : 'Search doctors…'}
          className="input mb-4"
        />

        <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2">
          {peopleQuery.isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)
          ) : people.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No results</p>
          ) : (
            people
              .filter((p: any) =>
                isDoctor
                  ? true
                  : `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p: any) => {
                const alreadyChatting = existingRoomPersonIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    disabled={submitting}
                    onClick={() => onSelect(p.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                      {getInitials(p.user.firstName, p.user.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {isDoctor ? '' : 'Dr. '}{p.user.firstName} {p.user.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {isDoctor ? p.patientCode : p.department?.name || p.specialization}
                      </p>
                    </div>
                    {alreadyChatting && <span className="text-[10px] text-indigo-500 font-medium shrink-0">Chatting</span>}
                  </button>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
