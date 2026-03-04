import { useState } from 'react';
import './style/Profile.css'

// ---- Types ----
type User = {
  id: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  email?: string;
  createdAt?: string;
};

type Match = {
  id: string;
  opponent: string;
  opponentAvatar: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
};

// ---- Données fictives ----
const ME: User = {
  id: '1',
  username: 'nnn',
  avatarUrl: '/pp/default.jpg',
  isOnline: true,
  email: 'nnn@example.com',
  createdAt: '2024-01-15',
};

const FRIENDS: User[] = [
  { id: '2', username: 'Alice',   avatarUrl: '/pp/default.jpg', isOnline: true  },
  { id: '3', username: 'Bob',     avatarUrl: '/pp/default.jpg', isOnline: false },
  { id: '4', username: 'Charlie', avatarUrl: '/pp/default.jpg', isOnline: true  },
  { id: '5', username: 'David',   avatarUrl: '/pp/default.jpg', isOnline: false },
  { id: '6', username: 'Eva',     avatarUrl: '/pp/default.jpg', isOnline: true  },
];

const MY_MATCHES: Match[] = [
  { id: '1', opponent: 'Alice',   opponentAvatar: '/pp/default.jpg', result: 'win',  score: '11 - 7',  date: '2024-03-01' },
  { id: '2', opponent: 'Bob',     opponentAvatar: '/pp/default.jpg', result: 'loss', score: '5 - 11',  date: '2024-02-28' },
  { id: '3', opponent: 'Charlie', opponentAvatar: '/pp/default.jpg', result: 'win',  score: '11 - 9',  date: '2024-02-25' },
  { id: '4', opponent: 'Eva',     opponentAvatar: '/pp/default.jpg', result: 'win',  score: '11 - 3',  date: '2024-02-20' },
  { id: '5', opponent: 'David',   opponentAvatar: '/pp/default.jpg', result: 'loss', score: '8 - 11',  date: '2024-02-15' },
];

const FRIEND_MATCHES: Record<string, Match[]> = {
  '2': [
    { id: 'a1', opponent: 'nnn',     opponentAvatar: '/pp/default.jpg', result: 'loss', score: '7 - 11',  date: '2024-03-01' },
    { id: 'a2', opponent: 'Charlie', opponentAvatar: '/pp/default.jpg', result: 'win',  score: '11 - 6',  date: '2024-02-22' },
  ],
  '3': [
    { id: 'b1', opponent: 'nnn',     opponentAvatar: '/pp/default.jpg', result: 'win',  score: '11 - 5',  date: '2024-02-28' },
    { id: 'b2', opponent: 'Eva',     opponentAvatar: '/pp/default.jpg', result: 'loss', score: '4 - 11',  date: '2024-02-18' },
  ],
  '4': [],
  '5': [],
  '6': [],
};

// ---- Composant principal ----
export default function Profile() {
  const [viewedUser, setViewedUser]   = useState<User>(ME);
  const [isMe, setIsMe]               = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const matches: Match[] = isMe ? MY_MATCHES : (FRIEND_MATCHES[viewedUser.id] ?? []);
  const wins  = matches.filter(m => m.result === 'win').length;
  const losses = matches.filter(m => m.result === 'loss').length;

  const handleFriendClick = (friend: User) => {
    setViewedUser(friend);
    setIsMe(false);
  };

  const handleMyProfile = () => {
    setViewedUser(ME);
    setIsMe(true);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    // TODO: envoyer le fichier au backend via axios
  };

  return (
    <div className="profile-screen">

      {/* ===== SIDEBAR AMIS ===== */}
      <aside className="profile-sidebar">
        <h2 className="sidebar-title">Amis</h2>
        <div className="friends-list">
          {/* Mon profil */}
          <div
            className={`friend-item ${isMe ? 'friend-selected' : ''}`}
            onClick={handleMyProfile}
          >
            <div className="relative">
              <img className="friend-avatar" src={avatarPreview ?? ME.avatarUrl} alt={ME.username} />
              <span className="friend-dot bg-emerald-400"></span>
            </div>
            <span className="friend-name">{ME.username} <span className="text-xs text-gray-400">(moi)</span></span>
          </div>

          {/* Liste des amis */}
          {FRIENDS.map(friend => (
            <div
              key={friend.id}
              className={`friend-item ${!isMe && viewedUser.id === friend.id ? 'friend-selected' : ''}`}
              onClick={() => handleFriendClick(friend)}
            >
              <div className="relative">
                <img className="friend-avatar" src={friend.avatarUrl} alt={friend.username} />
                <span className={`friend-dot ${friend.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
              </div>
              <span className="friend-name">{friend.username}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="profile-main">

        {/* Carte profil */}
        <div className="profile-card">
          <div className="profile-avatar-wrapper">
            <img
              className="profile-avatar"
              src={isMe ? (avatarPreview ?? viewedUser.avatarUrl) : viewedUser.avatarUrl}
              alt={viewedUser.username}
            />
            <span className={`profile-status-dot ${viewedUser.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>

            {/* Bouton changer photo — uniquement pour soi */}
            {isMe && (
              <label className="avatar-change-btn" title="Changer la photo">
                📷
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-username">{viewedUser.username}</h1>
            {isMe && viewedUser.email && (
              <p className="profile-email">{viewedUser.email}</p>
            )}
            {isMe && viewedUser.createdAt && (
              <p className="profile-date">Membre depuis le {new Date(viewedUser.createdAt).toLocaleDateString('fr-FR')}</p>
            )}
            <div className="profile-stats">
              <div className="stat-box stat-win">
                <span className="stat-number">{wins}</span>
                <span className="stat-label">Victoires</span>
              </div>
              <div className="stat-box stat-loss">
                <span className="stat-number">{losses}</span>
                <span className="stat-label">Défaites</span>
              </div>
              <div className="stat-box stat-total">
                <span className="stat-number">{matches.length}</span>
                <span className="stat-label">Matchs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des matchs */}
        <div className="matches-section">
          <h2 className="matches-title">Historique des matchs 1v1</h2>

          {matches.length === 0 ? (
            <p className="no-matches">Aucun match joué pour le moment.</p>
          ) : (
            <table className="matches-table">
              <thead>
                <tr>
                  <th>Adversaire</th>
                  <th>Résultat</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => (
                  <tr key={match.id} className={match.result === 'win' ? 'row-win' : 'row-loss'}>
                    <td className="flex items-center gap-2 py-2">
                      <img className="w-8 h-8 rounded-full" src={match.opponentAvatar} alt={match.opponent} />
                      {match.opponent}
                    </td>
                    <td>
                      <span className={`badge ${match.result === 'win' ? 'badge-win' : 'badge-loss'}`}>
                        {match.result === 'win' ? 'Victoire' : 'Défaite'}
                      </span>
                    </td>
                    <td className="font-mono">{match.score}</td>
                    <td className="text-gray-400 text-sm">
                      {new Date(match.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}