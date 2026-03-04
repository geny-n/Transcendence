# 🎮 Pong Multijoueur - Configuration Socket.io

## ✅ Ce qui a été fait

### **Frontend**
1. ✅ Installation de `socket.io-client`
2. ✅ Activation de Socket.io dans [usePongSocket.ts](../frontend/src/hooks/usePongSocket.ts)
3. ✅ Tous les événements configurés et prêts

### **Backend**
1. ✅ Types TypeScript créés ([pong.types.ts](src/types/pong.types.ts))
2. ✅ Game Engine implémenté ([PongGameEngine.ts](src/game/PongGameEngine.ts))
3. ✅ Matchmaking Manager créé ([MatchmakingManager.ts](src/game/MatchmakingManager.ts))
4. ✅ Handlers Socket.io configurés ([pongHandlers.ts](src/socket/pongHandlers.ts))
5. ✅ Intégration dans le système Socket.io existant ([socket.ts](src/lib/socket.ts))
6. ✅ Installation de `uuid` pour les IDs de rooms

## 🔌 Événements Socket.io

### **Client → Serveur**
| Événement | Données | Description |
|-----------|---------|-------------|
| `join_queue` | - | Rejoindre la file d'attente |
| `leave_queue` | - | Quitter la file d'attente |
| `player_input` | `{ roomId, action }` | Envoyer un input (up/down/stop) |
| `disconnect` | - | Déconnexion du joueur |

### **Serveur → Client**
| Événement | Données | Description |
|-----------|---------|-------------|
| `game_start` | `{ roomId, side }` | Partie trouvée, attribution du côté |
| `game_state` | `GameState` | État du jeu (60 FPS) |
| `game_over` | `{ winner }` | Fin de partie |
| `opponent_disconnect` | - | Adversaire déconnecté |
| `error` | `string` | Message d'erreur |

## 🎯 Architecture

```
Client 1                      Serveur                     Client 2
   │                             │                            │
   ├──── join_queue ────────────►│                            │
   │                             │◄──── join_queue ───────────┤
   │                             │                            │
   │                      [Matchmaking]                       │
   │                    Crée une partie                       │
   │                             │                            │
   │◄─── game_start(left) ───────┤                            │
   │                             ├──── game_start(right) ─────►│
   │                             │                            │
   │                      [Game Loop 60 FPS]                  │
   │◄──── game_state ────────────┤                            │
   │                             ├──── game_state ────────────►│
   │                             │                            │
   ├──── player_input(up) ───────►│                            │
   │                             │◄─── player_input(down) ────┤
   │                             │                            │
   │                    [Check victoire]                      │
   │                             │                            │
   │◄──── game_over ─────────────┤                            │
   │                             ├──── game_over ─────────────►│
```

## 🚀 Prochaines étapes

### Pour tester :
1. **Démarrer le backend** :
   ```bash
   cd backend
   npm run dev
   ```

2. **Démarrer le frontend** :
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ouvrir deux navigateurs** (ou deux onglets en navigation privée)

4. **Dans chaque navigateur**, aller sur la page PongMulti et cliquer sur "Trouver une partie"

5. **La partie démarre automatiquement** quand 2 joueurs sont en attente !

### Configuration de l'URL serveur
Dans [PongMulti.tsx](../frontend/src/Pages/PongMulti.tsx), vérifier l'URL :
```typescript
const { ... } = usePongSocket('http://localhost:3000');
```

Adapter selon votre configuration backend.

## ⚙️ Configuration du jeu

Dans [PongGameEngine.ts](src/game/PongGameEngine.ts) :
```typescript
private config: GameConfig = {
  canvasWidth: 800,      // Largeur du terrain
  canvasHeight: 600,     // Hauteur du terrain
  ballSpeed: 5,          // Vitesse initiale de la balle
  paddleSpeed: 8,        // Vitesse des raquettes
  paddleHeight: 100,     // Hauteur des raquettes
  paddleWidth: 10,       // Largeur des raquettes
  ballRadius: 8,         // Rayon de la balle
  maxScore: 5,           // Score pour gagner
  fps: 60,               // Fréquence de mise à jour
};
```

## 🔧 Debugging

### Logs serveur
- Connexions/déconnexions
- File d'attente
- Création de parties
- Stats toutes les 30s

### Logs client (Console navigateur)
- Connexion Socket.io
- Événements reçus
- Inputs envoyés

## 📝 Notes importantes

- Le système fonctionne avec votre authentification existante (via `socketAuth` middleware)
- Les parties sont automatiquement nettoyées en cas de déconnexion
- La physique est entièrement côté serveur (pas de triche possible)
- Le client reçoit uniquement l'état à afficher
