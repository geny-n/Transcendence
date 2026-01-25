import { useState, useEffect } from 'react'
import './App.css'
import Chat from './components/Chat'  

// Type pour stocker les infos utilisateur
interface User {
    userId: number;
    nickname: string;
}

function App() {
  const [showPong, setShowPong] = useState(false);
  const [user, setUser] = useState<User | null>(null);        // ← NOUVEAU : infos utilisateur
  const [showChat, setShowChat] = useState(false);            // ← NOUVEAU : afficher le chat
  const [showLogin, setShowLogin] = useState(false);          // ← NOUVEAU : afficher formulaire connexion
  const [showRegister, setShowRegister] = useState(false);    // ← NOUVEAU : afficher formulaire inscription
  // Bloque le scroll du body uniquement quand le jeu est affiché
  useEffect(() => {
    if (showPong) {
      document.body.style.overflow = 'hidden';
      // Force focus sur l'iframe quand elle apparaît
      setTimeout(() => {
        const iframe = document.querySelector('iframe[title="Pong Game"]');
        if (iframe && 'focus' in iframe) {
          (iframe as HTMLIFrameElement).focus();
        }
      }, 500);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPong]);

// Fonction de connexion
const handleLogin = async (email: string, password: string) => {
    try {
        const response = await fetch('https://localhost/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setUser({ userId: data.userId, nickname: data.nickname });
            setShowLogin(false);
            console.log(`✅ Connecté en tant que ${data.nickname}`);
        } else {
            alert(data.error || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('❌ Erreur login:', error);
        alert('Erreur de connexion au serveur');
    }
};

// Fonction d'inscription
const handleRegister = async (name: string, nickname: string, email: string, password: string) => {
    try {
        const response = await fetch('https://localhost/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, nickname, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setUser({ userId: data.userId, nickname: data.nickname });
            setShowRegister(false);
            console.log(`✅ Compte créé ! Bienvenue ${data.nickname}`);
        } else {
            alert(data.error || 'Erreur d\'inscription');
        }
    } catch (error) {
        console.error('❌ Erreur register:', error);
        alert('Erreur d\'inscription au serveur');
    }
};

  //Edit <code>src/App.tsx</code> and save to test HMR
  return (
    <>
        <div className="relative flex flex-col items-center min-h-screen w-full">
            {/* ========== EN-TÊTE ========== */}
            <header className="absolute top-0 left-0 w-full flex flex-col items-center" style={{ top: '8vh' }}>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg" style={{ color: '#fff', textShadow: '0 2px 16px #000' }}>
                    Transcendence Pong
                </h1>
                <p className="mt-2 text-2xl font-semibold text-white" style={{ color: '#fff', textShadow: '0 2px 16px #000' }}>
                    {user ? `Bienvenue ${user.nickname} !` : 'Bienvenue sur notre site Transcendence!'}
                </p>
            </header>

            {/* ========== BOUTONS PRINCIPAUX ========== */}
            <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: '100vh' }}>
                <div className="flex flex-row items-center justify-center w-full gap-8" 
                     style={{ 
                         pointerEvents: showPong ? 'none' : 'auto', 
                         opacity: showPong ? 0.3 : 1, 
                         transition: 'opacity 0.3s' 
                     }}>
                    
                    {/* Bouton Play Pong */}
                    <button
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition text-lg shadow"
                        onClick={() => setShowPong(true)}
                    >
                        Play Pong
                    </button>
                    
                    {/* Si connecté : bouton Chat */}
                    {user ? (
                        <button
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition text-lg shadow"
                            onClick={() => setShowChat(true)}
                        >
                            💬 Chat
                        </button>
                    ) : (
                        <>
                            {/* Si non connecté : boutons Inscription et Connexion */}
                            <button
                                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition text-lg shadow"
                                onClick={() => setShowRegister(true)}
                            >
                                S'inscrire
                            </button>
                            
                            <button
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition text-lg shadow"
                                onClick={() => setShowLogin(true)}
                            >
                                Se connecter
                            </button>
                        </>
                    )}
                    
                    {/* Si connecté : bouton Déconnexion */}
                    {user && (
                        <button
                            className="px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition text-lg shadow"
                            onClick={() => setUser(null)}
                        >
                            Déconnexion
                        </button>
                    )}
                </div>
            </div>

            {/* ========== MODAL CHAT ========== */}
            {showChat && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="w-full max-w-4xl h-4/5 m-4 flex flex-col">
                        <Chat userId={user.userId} nickname={user.nickname} />
                        <button
                            className="mt-4 px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition"
                            onClick={() => setShowChat(false)}
                        >
                            Fermer le Chat
                        </button>
                    </div>
                </div>
            )}

            {/* ========== MODAL CONNEXION ========== */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">Se connecter</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleLogin(
                                formData.get('email') as string,
                                formData.get('password') as string
                            );
                        }}>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="w-full px-4 py-2 mb-4 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Mot de passe"
                                required
                                className="w-full px-4 py-2 mb-6 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
                                >
                                    Connexion
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLogin(false)}
                                    className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded hover:bg-gray-700 transition"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MODAL INSCRIPTION ========== */}
            {showRegister && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">S'inscrire</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleRegister(
                                formData.get('name') as string,
                                formData.get('nickname') as string,
                                formData.get('email') as string,
                                formData.get('password') as string
                            );
                        }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Nom complet"
                                required
                                className="w-full px-4 py-2 mb-4 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                                type="text"
                                name="nickname"
                                placeholder="Pseudo"
                                required
                                className="w-full px-4 py-2 mb-4 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="w-full px-4 py-2 mb-4 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Mot de passe"
                                required
                                className="w-full px-4 py-2 mb-6 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition"
                                >
                                    S'inscrire
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRegister(false)}
                                    className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded hover:bg-gray-700 transition"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MODAL PONG (votre code existant) ========== */}
            {showPong && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
                    <div className="flex flex-col items-center justify-center" style={{ height: '110vh', justifyContent: 'center' }}>
                        <iframe
                            src="/Pong0.1/Pong/index.html"
                            title="Pong Game"
                            className="rounded shadow-lg"
                            style={{ width: '80vw', height: '80vh', background: 'white', border: 'none' }}
                            allowFullScreen
                        ></iframe>
                        <div style={{ height: '2.5rem' }}></div>
                        <button
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition text-lg shadow"
                            onClick={() => setShowPong(false)}
                        >
                            Retour
                        </button>
                    </div>
                </div>
            )}
        </div>
    </>
)
}

export default App
