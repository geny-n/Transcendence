# Transcendence
_This project has been created as part of the 42 curriculum by gtoure, gpaupher, llabonde, ngeny._

## Desciption
Our project named Pong is a videogame simulating table tennis matches.
It is a full-stack web application whose key features are : real-time multiplayer game (1 versus 1), user management system, a profile page with a friend list system, a real-time chat, a scoreboard to track match history and a leaderboard to rank players 

## Instruction
- git clone the project
- To build the project ``` make ```
- To clean the project ```make fclean```
- To clean and rebuild the project ```make re```
- To see the database ```make bd```  

## Ressources
- https://blog.stackademic.com/uploading-files-with-react-post-request-dd6c1eebe933
- https://medium.com/@denis.mutunga/uploading-images-to-the-backend-in-react-with-formdata-c8035ae64a0c
- https://blog.bitsrc.io/creating-a-multiple-instances-socket-react-context-library-a-step-by-step-guide-52443cd1d19a
- https://tailwindcss.com/
- https://react.dev/learn/updating-arrays-in-state
- https://socket.io/how-to/use-with-react
- https://huggingface.co/citizenlab/distilbert-base-multilingual-cased-toxicity?text=pute
- https://react-icons.github.io/react-icons/search/#q=info
- https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Array/push
- https://dev.to/nardin/real-time-notification-react-socket-io-5e76

## Additional secitons
### Team Information :
- PO
  - ewfef
- Project Manager (ngeny)
  - Responsibilities :
    - Meeting planning
    - Monitoring each member's progress
    - Cooperation in case of issues
    - Meeting reviews
  - Kickoff Meeting
    - Define game scope and modules
    - Create task list
    - Assign tasks to team members
    - Set up GitHub repository and code basic architecture
  - Tools & Process
    - Git + Discord
    - One branch per team member
    - Meetings : every 2 weeks at school (review + tasks for next meeting)
    - Sharing of new features -> merge to Main -> test (conflict resolution) -> push to Main bransh
    
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
