# 🏓 Pong Multijoueur - Guide de Test

## 🎯 Méthodes de test disponibles

### 1. **Test HTML Standalone (IMMÉDIAT - Aucune installation requise)**

Ouvrez directement dans votre navigateur :
```
frontend/public/PongMulti/test-mockup.html
```

**Avantages :**
- Aucune installation
- Aucun serveur requis
- Test visuel immédiat de l'apparence
- Simulation de jeu avec IA simple
- Contrôles fonctionnels (↑↓ ou WS)

**Ce qui est testé :**
- Apparence du terrain, raquettes, balle
- Score en temps réel
- Déplacement des raquettes
- Physique de base de la balle

---

### 2. **Test React avec données mockées**

Pour tester les composants React sans backend :

1. Créer un fichier de test React (fourni ci-dessous)
2. Lancer le dev server : `npm run dev`
3. Naviguer vers `/test-pong` dans votre navigateur

**Avantages :**
- Test des composants React réels
- Données de jeu simulées
- Voir le flow complet : Matchmaking → Jeu → Game Over
- Pas de backend nécessaire

---

## 📂 Structure des fichiers

```
frontend/
├── public/PongMulti/
│   ├── index.html          # Page d'accueil des tests
│   └── test-mockup.html    # Test HTML pur (recommandé)
│
├── src/
│   ├── Components/PongMulti/
│   │   ├── Ball.tsx
│   │   ├── Paddle.tsx
│   │   ├── Score.tsx
│   │   ├── GameCanvas.tsx
│   │   └── Matchmaking.tsx
│   │
│   ├── Pages/
│   │   ├── PongMulti.tsx        # Page principale
│   │   └── PongMultiTest.tsx    # Page de test (à créer)
│   │
│   ├── hooks/
│   │   └── usePongSocket.ts     # Hook Socket.io (mode mock)
│   │
│   └── types/
│       └── pong.types.ts        # Types TypeScript
```

---

## 🚀 Quick Start

### Option 1 : Test HTML (Le plus rapide)

```bash
# Dans votre navigateur, ouvrez :
file:///home/arka/Documents/Transcendence/Main.0/frontend/public/PongMulti/test-mockup.html
```

Ou utilisez un serveur HTTP simple :
```bash
cd frontend/public/PongMulti
python3 -m http.server 8080
# Puis ouvrez : http://localhost:8080/test-mockup.html
```

### Option 2 : Test React (Composants réels)

Voir le fichier `PongMultiTest.tsx` (à créer) pour un environnement de test React complet.

---

## 🎮 Contrôles

- **↑** ou **W** : Déplacer la raquette vers le haut
- **↓** ou **S** : Déplacer la raquette vers le bas

---

## 📝 TODO Backend

Quand vous serez prêt à connecter le backend :

1. Installer Socket.io client :
   ```bash
   npm install socket.io-client
   ```

2. Décommenter le code dans `usePongSocket.ts`

3. Implémenter côté serveur :
   - Game engine avec physique
   - Matchmaking system
   - Événements Socket.io
   - Gestion des rooms

4. Configurer l'URL du serveur dans `PongMulti.tsx`

---

## 🐛 Notes

- Le mode test utilise des données simulées
- Aucune connexion réseau requise
- Parfait pour tester l'UI/UX avant l'intégration backend
- Le HTML standalone inclut une IA simple pour l'adversaire
