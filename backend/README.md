FORMAT: 1A
HOST: http://localhost:1443/api

## Aperçu
Serveur Express.js + Prisma (MySQL/MariaDB) suivant le pattern **routes → handlers → Prisma**.

## Concepts clés & Explications

### Qu’est-ce que fait le backend ?
Le backend reçoit des requêtes HTTP, traite les requêtes, interagit avec la base de données et renvoie des réponses JSON.
Le backend rend l’application **dynamique** : gestion des utilisateurs, authentification, stockage des données, etc.

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

## Register [/register]

### Inscription de l'utilisateur [POST]

Pour créer un compte utilisateur il faut fournir dans un objet JSON un nom d'utilisateur ainsi que son email et un mot de passe

+ Request (application/json)

        {
            "username": "user's username",
            "email": "user's email",
            "password": "user's password"
        }

+ Response 200 (application/json)

        {
            "success": true,
            "user": {
                "id": "user's id",
                "username": "user's username",
                "email": "user's email",
                "createdAt": "the date of creation of the user account"
            }
        }

## Login [/login]

### Connexion de l'utilisateur [POST]

Pour se connecter il faut fournir dans un objet JSON un email et un mot de passe.
ATTENTION cette procédure génère un access token

+ Request (application/json)

        {
            "email": "user's email",
            "password": "user's password"
        }

+ Response 200 (application/json)

        {
            "success": true,
            "user": {
                "id": "user's id",
                "username": "user's username",
                "email": "user's email",
                "createdAt": "the date of creation of the user account"
            },
            "accessToken": "user's unique access token"
        }

## Logout [/logout]

### Déconnexion de l'utilisateur [GET]

Pour se déconnecter.
ATTENTION cette procédure supprimera l'access token et le refresh token

+ Response 200 (application/json)

        {
            "success": true,
            "message": "Logged out successfully"
        }


## OAuth 2.0 [/auth/42]

### Connexion de l'utilisateur avec son compte 42 [GET]

Cette procédure redirigera l'utilisateur vers une page d'autorisation pour la connexion ; une fois acceptée, il sera redirigé vers la page d'accueil.
ATTENTION cette procédure générera l'access token et le refresh token

+ Response 302 (application/json)