# Backend ft_transcendence - Documentation

## Aperçu
Serveur Express.js + Prisma (MySQL/MariaDB) suivant le pattern **routes → handlers → Prisma**.

**Endpoints principaux** :
- `POST /register`
- `POST /login`
- `GET /logout` (protégé)
- `POST /refresh`
- `GET /health`

## Installation & Démarrage
1. Copier `.env` → `.env`
2. `docker compose -f 'docker-compose.yml' up -d --build`

## Concepts clés & Explications

### Qu’est-ce que fait le backend ?
Le backend reçoit des requêtes HTTP, traite la requêtes, interagit avec la base de données et renvoie des réponses JSON.  
Contrairement au frontend (qui affiche des pages), le backend rend l’application **dynamique** : gestion des utilisateurs, authentification, stockage des données, etc.

### Comment les requêtes arrivent-elles ?
- Le serveur écoute sur un port (`app.listen(PORT)`)
- `app.use(express.json())` permet de recevoir des bodies au format JSON
- Les routes définissent les chemins (`/register`, `/login`, etc.)

### Pourquoi utiliser des tokens JWT ?
Pour savoir si un utilisateur est connecté sans stocker de session côté serveur.  
Quand l’utilisateur se connecte :
- On génère **deux tokens** :
  - **access_token** → durée courte (15 minutes) → utilisé pour toutes les requêtes authentifiées
  - **refresh_token** → durée longue (7 jours) → stocké en base (`User.refreshToken`) et dans un cookie httpOnly

**Pourquoi deux tokens ?**  
Un token unique long serait dangereux : s’il est volé, l’attaquant garde l’accès indéfiniment.  
Avec un access token court, même en cas de vol, l’accès expire rapidement. Le refresh token permet de renouveler l’access token sans forcer une nouvelle connexion.

### Flux de rafraîchissement
1. L’access_token expire après 15 min
2. Le frontend envoie le refresh_token au endpoint `/refresh`
3. Le serveur vérifie que le refresh_token correspond à celui stocké en base
4. Si valide → nouveau access_token renvoyé (cookie + body)
5. Si les deux tokens expirent → l’utilisateur doit se reconnecter

### Sécurité
- Cookies : `httpOnly: true`, `secure: true` (en production), `sameSite: lax`
- Mots de passe : hashés avec bcrypt (10 rounds)
- Validation des entrées : express-validator + schémas dédiés (`src/utils/validationSchema.ts`)
- Middleware d’authentification : `authenticateToken` vérifie le cookie `access_token`

## Endpoints & Exemples

### POST /register
Body :
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "StrongPass123!"
}
```
Réponse 201 :
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "...",
    "username": "...",
    "createdAt": "2026-01-26T..."
  }
}
```

### POST /login
Body : email + password  
Réponse 200 + cookies (access_token 15 min + refresh_token 7 jours) + body contenant le user et l’access_token.

### POST /refresh
Utilise le cookie refresh_token → renvoie un nouveau access_token.

### GET /logout (authentifié)
Vide les cookies et met `isOnline: false`.

### GET /health
```json
{ "status": "OK" }
```

## Architecture
- Routes : `src/routes/`
- Handlers (traitement des requêtes) : `src/handlers/`
- DTOs : `src/dtos/`
- Prisma : `lib/prisma.ts`, schema dans `src/prisma/schema.prisma`

## Erreurs courantes
- 400 → données invalides
- 401 → token manquant
- 403 → token invalide/expiré
- 409 → email ou username déjà pris
- 500 → erreur serveur