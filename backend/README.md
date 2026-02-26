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

## Friends System [/friends]

### Envoyer une demande d'ami [POST /friends/requests]

Pour envoyer une demande d'ami à un utilisateur.
Require: authentification + token JWT valide

+ Request (application/json)

        {
            "receiverId": "user's id to send friend request to"
        }

+ Response 200 (application/json)

        {
            "success": true,
            "newRequest": {
                "id": "friendship request id",
                "senderId": "sender's id",
                "receiverId": "receiver's id",
                "status": "PENDING",
                "createdAt": "creation date",
                "updateAt": "update date",
                "receiver": {
                    "id": "receiver's id",
                    "username": "receiver's username"
                }
            }
        }


### Obtenir la liste des amis [GET /friends]

Pour récupérer la liste de tous les amis de l'utilisateur connecté.
Require: authentification + token JWT valide

+ Response 200 (application/json)

        {
            "success": true,
            "friends": [
                {
                    "id": "friendship id",
                    "user1Id": "user1's id",
                    "user2Id": "user2's id",
                    "createdAt": "date when friendship was accepted",
                    "user1": {
                        "id": "user1's id",
                        "username": "user1's username",
                        "isOnline": true,
                        "avatarUrl": "/avatars/user1.png"
                    },
                    "user2": {
                        "id": "user2's id",
                        "username": "user2's username",
                        "isOnline": false,
                        "avatarUrl": "/avatars/user2.png"
                    }
                }
            ]
        }

### Obtenir les demandes d'ami en attente [GET /friends/pending]

Pour récupérer les demandes d'ami en attente (reçues et envoyées).
Require: authentification + token JWT valide

+ Response 200 (application/json)

        {
            "success": true,
            "requests": [
                {
                    "id": "friendship request id",
                    "senderId": "sender's id",
                    "receiverId": "receiver's id (you)",
                    "status": "PENDING",
                    "createdAt": "request creation date",
                    "sender": {
                        "id": "sender's id",
                        "username": "sender's username"
                    }
                }
            ]
        }

### Gérer une demande d'ami [PATCH /friends/requests/{id}]

Pour accepter, rejeter, annuler ou bloquer une demande d'ami.
Require: authentification + token JWT valide

Actions possibles: `accept` | `reject` | `cancel` | `block`

+ Parameters
    + id (number) - ID de la requete d'ami

+ Request (application/json)

        {
            "action": "accept"
        }

+ Response 200 (application/json) - Accepter

        {
            "success": true,
            "action": "accept",
            "requestId": "friendship request id"
        }

+ Response 200 (application/json) - Rejeter

        {
            "success": true,
            "action": "reject",
            "requestId": "friendship request id"
        }

+ Response 200 (application/json) - Annuler (sender seulement)

        {
            "success": true,
            "action": "cancel",
            "requestId": "friendship request id"
        }

+ Response 200 (application/json) - Bloquer

        {
            "success": true,
            "action": "block",
            "requestId": "friendship request id"
        }


### Supprimer un ami [DELETE /friends/{id}]

Pour supprimer un ami (unfriend).
Require: authentification + token JWT valide

+ Parameters
    + id (number) - ID de l'utilisateur a retirer de la liste d'ami

+ Response 200 (application/json)

        {
            "success": true,
            "message": "Unfriended"
        }


### WebSocket Events

Événements émis en temps réel via WebSocket:

- `friend:request_received` → Notifie l'utilisateur qu'il a reçu une nouvelle demande d'ami
- `friend:request_accepted` → Notifie que une demande d'ami a été acceptée
- `friend:request_rejected` → Notifie que une demande d'ami a été rejetée
- `friend:request_cancel` → Notifie que une demande d'ami a been annulée
- `friend:block` → Notifie que l'utilisateur a été bloqué
- `friend:unfriended` → Notifie que l'utilisateur a été supprimé de la liste d'amis
