import { useState, useEffect } from 'react';
import './style/Chat.css'

interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export default function Chat() {
  // Simuler Charlie comme utilisateur connecté
  const currentUser = {
    id: 'e0da5aac-0583-11f1-a3b2-5ac2d7fec62a', // ID de Charlie depuis votre BDD
    username: 'charlie',
    email: 'charlie@test.com',
    avatarUrl: 'avatar3.png',
    isOnline: true,
  };

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Récupérer les amis de Charlie
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Pour l'instant, on simule les amis en dur
        // Plus tard, vous pourrez faire : fetch(`http://localhost:3100/api/friends/${currentUser.id}`)
        
        const mockFriends: Friend[] = [
          {
            id: 'e0da4c74-0583-11f1-a3b2-5ac2d7fec62a',
            username: 'alice',
            avatarUrl: 'avatar1.png',
            isOnline: true,
          },
          {
            id: 'e0da4ebf-0583-11f1-a3b2-5ac2d7fec62a',
            username: 'bob',
            avatarUrl: 'avatar2.png',
            isOnline: false,
          },
        ];
        
        setFriends(mockFriends);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchFriends();
  }, []);

  return (
    <div className="all_screan">
      <div className="chat_screen">
        
        {/* PARTIE GAUCHE - 33% */}
        <div className="flex flex-col w-1/3 bg-gray-800">
          
          {/* Header avec profil de Charlie */}
          <div className="bg-amber-700 h-16 flex items-center px-4 gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <p className="text-white font-semibold">{currentUser.username}</p>
              <p className="text-xs text-green-300">En ligne</p>
            </div>
          </div>

          {/* Liste des amis */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-white text-sm font-semibold mb-3">
              Mes amis ({friends.length})
            </h3>
            
            {friends.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun ami</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2 transition ${
                    selectedFriend?.id === friend.id
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{friend.username}</p>
                    <p className="text-xs">
                      {friend.isOnline ? (
                        <span className="text-green-400">🟢 En ligne</span>
                      ) : (
                        <span className="text-gray-400">⚫ Hors ligne</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PARTIE DROITE - 67% */}
        <div className="flex flex-col w-2/3 bg-gray-900">
          
          {/* Header ami sélectionné */}
          <div className="bg-gray-800 h-16 flex items-center px-4 border-b border-gray-700">
            {selectedFriend ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedFriend.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{selectedFriend.username}</p>
                  <p className="text-xs">
                    {selectedFriend.isOnline ? (
                      <span className="text-green-400">En ligne</span>
                    ) : (
                      <span className="text-gray-400">Hors ligne</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Sélectionnez un ami</p>
            )}
          </div>
          
          {/* Zone de messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedFriend ? (
              <div>
                <p className="text-gray-500 text-center text-sm mb-4">
                  Début de la conversation avec {selectedFriend.username}
                </p>
                
                {/* Messages simulés */}
                <div className="flex mb-3">
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-lg max-w-xs">
                    Salut Charlie !
                  </div>
                </div>
                
                <div className="flex justify-end mb-3">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                    Salut {selectedFriend.username} ! Ça va ?
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-lg">
                  Sélectionnez une conversation pour commencer
                </p>
              </div>
            )}
          </div>
          
          {/* Barre de saisie */}
          <div className="bg-gray-800 h-20 p-4 flex items-center gap-3 border-t border-gray-700">
            <input
              type="text"
              placeholder={
                selectedFriend
                  ? `Message à ${selectedFriend.username}...`
                  : 'Sélectionnez un ami'
              }
              disabled={!selectedFriend}
              className="flex-1 px-4 py-2 rounded bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              disabled={!selectedFriend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}