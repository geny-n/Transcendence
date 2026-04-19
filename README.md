# Transcendence
_This project has been created as part of the 42 curriculum by gtoure, gpaupher, llabonde, ngeny._

## Desciption
ddd

## Instruction
ddd

## Ressources
ddd

## Additional secitons
### Team Information :
- PO
  - ewfef
- Project Manager (ngeny)
  - For the first day we met at school to choose the game, modules and we separated tasks. We use Discord to communicate, to monitor each person's progress and to schedule meetings. We also used GitHub to push our work on separate branches. We plan meetings every 2 weeks at school to gather everything and test before pushing to the main branch. Finally we decided what each person will work on for next time.
    
-  Teach Lead
    - eefewf
-  Developers
    - wefewf
    
### Project Management :
  - sdfsdf
  - sdfsdf
  - sdfsdf
    
### Technical Stack :
  - sdfsdf
  - sdfsdf
  - sdfsdf
    
### Database Schema :
<img width="700" alt="Screenshot from 2026-04-18 23-17-34" src="https://github.com/user-attachments/assets/39d889ea-8e3a-4797-a82e-6b428027e3b2" />


### Features List :
  - User profile (ngeny)
    - Update their profile
    - View other user's profile
    - Search other users and send a friend request
    - Receive notifications for incoming friend requests and accept or decline friend requests
    - Get notified of incoming messages
    - Delete friends from his friend list
      
  - Realtime chat (ngeny)
    - Send messages only to friends
    - Incoming messages trigger a notification. Redirection to the conversation by clicking on the notification button
    - Messages are scanned by AI moderation system and blocked if toxic: a warning is sent to sender
    - Conversation includes message history with timestamp

### Modules :
| Modules | Typel | Points | Team members(s) | Justification | Implementation |
| :------ | :---- | :----  | :-------------- | :------------ | :------------- |
| Use a framework for both the frontend and backend | Major | 2 | All | sss | ssss |
| Implement real-time features using WebSockets or similar technology | Major | 2 | All | Essential for live chat, see updates in reel time of users profile | Socket.IO for bidirectional communicaiton |
| Allow users to interact with other users | Major | 2 | gtoure, ngeny | sss | sss |
| Use an ORM for the database | Minor | 1 | gtoure | sss | sss |
| Support for multiple languages (at least 3 languages) | Minor | 1 | All | sss | sss |
| Right-to-left (RTL) language support | Minor | 1 | All | sss | sss |
| Support for additional browsers | Minor | 1 | ???? | sss | sss |
| Standard user management and authentication | Major | 2 | gtoure, ngeny | sss | sss |
| Game statistics and match history | Minor | 1 | llabonde | A scoreboard keeping track of the games and a leaderboard keeping track of the most experienced players. | When a match ends, the record and stats is stored and displayed on the scoreboard(and the personal history in the profile), and you can check your progress towards top players in the leaderboard. |
| Implement remote authentication with OAuth 2.0 | Minor | 1 | gtoure, gpaupher | sss | sss |
| Advanced permissions system | Major | 2 | gtoure | sss | sss |
| Content moderation AI | Minor | 1 | ngeny | To filter messages before broadcasting to ensure a safe chat environment without a manual moderation | Using HuggingFace multilingual-toxic-xlm-roberta, the backend sends each message to the model API. It calculates the toxicity score (0 to 1), the function returns true if the message exceeds 0.5 (toxic), then the message is deleted from the database and the user receives a warning message. Model is warming up at server startup to eliminate latency. |
| Implement a complete web-based game where users can play against each other | Major | 2 | llabonde | sss | sss |
| Remote players — Enable two players on separate computers to play the same game in real-time | Major | 2 | llabonde | sss | sss |

Total points : 21

### Individual Contributions :
   - gtoure
     - dsfdsf
   - gpaupher
     - dsdd
   - llabonde
     - Most of my work was making the game as playable as possible, and make the systems behind it(game,matchmaking,revenge,dc timers,play flow).
   - ngeny
     -  sdfdsf
