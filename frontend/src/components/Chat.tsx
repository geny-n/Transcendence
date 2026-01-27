import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ========== TYPES ==========

// Type pour un message
interface Message {
    id: number;
    content: string;
    created_at: string;
    user_id: number;
    nickname: string;
    avatar?: string;
}

// Props du composant Chat
interface ChatProps {
    userId: number;
    nickname: string;
}

// ========== COMPOSANT CHAT ==========

export default function Chat({ userId, nickname }: ChatProps) {
    
    // ========== ÉTATS ==========
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    
    // ========== RÉFÉRENCES ==========
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);

    // ========== FONCTIONS ==========
    
    // Fonction pour scroller en bas automatiquement
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ========== EFFETS ==========
    
    // Scroller quand les messages changent
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Connexion Socket.IO au montage du composant
    useEffect(() => {
        console.log('🔌 Initialisation de la connexion Socket.IO...');
        
        // Créer la connexion Socket.IO
        const newSocket = io('https://localhost', {
            transports: ['websocket'],
            secure: true,
            rejectUnauthorized: false,
            path: '/socket.io/'
        });

        // Gérer la connexion
        newSocket.on('connect', () => {
            console.log('✅ Connecté à Socket.IO avec l\'ID:', newSocket.id);
            setIsConnected(true);
            
            // Se connecter en tant qu'utilisateur
            newSocket.emit('user:connect', { userId, nickname });
            console.log(`👤 Connecté en tant que ${nickname} (ID: ${userId})`);
        });

        // Gérer la déconnexion
        newSocket.on('disconnect', () => {
            console.log('❌ Déconnecté de Socket.IO');
            setIsConnected(false);
        });

        setSocket(newSocket);

        // Charger l'historique des messages
        console.log('📜 Chargement de l\'historique des messages...');
        fetch('https://localhost/api/messages')
            .then(res => res.json())
            .then(data => {
                console.log(`✅ ${data.length} messages chargés`);
                setMessages(data);
            })
            .catch(err => console.error('❌ Erreur chargement messages:', err));

        // Écouter les nouveaux messages
        newSocket.on('message:received', (message: Message) => {
            console.log('💬 Nouveau message reçu:', message);
            setMessages(prev => [...prev, message]);
        });

        // Écouter les utilisateurs qui tapent
        newSocket.on('user:typing', (data: { userId: number; nickname: string }) => {
            console.log(`⌨️  ${data.nickname} est en train d'écrire...`);
            setIsTyping(prev => {
                if (!prev.includes(data.nickname)) {
                    return [...prev, data.nickname];
                }
                return prev;
            });
        });

        // Écouter quand un utilisateur arrête d'écrire
        newSocket.on('user:stop-typing', (data: { userId: number }) => {
            setIsTyping(prev => prev.filter(n => n !== data.userId.toString()));
        });

        // Nettoyage à la déconnexion du composant
        return () => {
            console.log('👋 Déconnexion de Socket.IO');
            newSocket.disconnect();
        };
    }, [userId, nickname]);

    // ========== HANDLERS ==========
    
    // Gérer l'envoi de message
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !socket || !isConnected) {
            console.log('⚠️  Impossible d\'envoyer : message vide ou socket non connecté');
            return;
        }

        console.log(`📤 Envoi du message: "${newMessage}"`);
        
        socket.emit('message:send', {
            userId,
            content: newMessage
        });

        setNewMessage('');
        
        // Arrêter l'indicateur "en train d'écrire"
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        socket.emit('typing:stop');
    };

    // Gérer la frappe au clavier
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!socket || !isConnected) return;

        // Envoyer "en train d'écrire"
        socket.emit('typing:start');

        // Annuler le timeout précédent
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        // Arrêter après 1 seconde d'inactivité
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing:stop');
        }, 1000)as unknown as number;
    };

    // ========== RENDU ==========
    
    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-lg">
            
            {/* ========== EN-TÊTE ========== */}
            <div className="bg-blue-700 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">💬 Chat Global</h2>
                        <p className="text-sm opacity-75">Connecté en tant que {nickname}</p>
                    </div>
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm">{isConnected ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                </div>
            </div>

            {/* ========== ZONE DE MESSAGES ========== */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-lg">💭 Aucun message pour le moment</p>
                        <p className="text-sm mt-2">Soyez le premier à écrire ! 🚀</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                                    msg.user_id === userId
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-white'
                                }`}
                            >
                                {/* Nom de l'utilisateur */}
                                <div className="text-xs opacity-75 mb-1 font-semibold">
                                    {msg.user_id === userId ? 'Vous' : msg.nickname}
                                </div>
                                
                                {/* Contenu du message */}
                                <div className="break-all">{msg.content}</div>
                                
                                {/* Heure */}
                                <div className="text-xs opacity-50 mt-1">
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {/* Indicateur de frappe */}
                {isTyping.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm italic">
                            ⌨️ {isTyping.join(', ')} {isTyping.length === 1 ? 'est' : 'sont'} en train d'écrire...
                        </div>
                    </div>
                )}
                
                {/* Référence pour le scroll automatique */}
                <div ref={messagesEndRef} />
            </div>

            {/* ========== FORMULAIRE D'ENVOI ========== */}
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder={isConnected ? "Écrivez un message..." : "Connexion en cours..."}
                        disabled={!isConnected}
                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !isConnected}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        Envoyer
                    </button>
                </div>
                
                {/* Compteur de caractères */}
                <div className="text-xs text-gray-400 mt-2 text-right">
                    {newMessage.length} / 500 caractères
                </div>
            </form>
        </div>
    );
}