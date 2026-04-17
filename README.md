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
  - sdfsdf
  - sdfsdf

### Features List :
  - User profile (ngeny)
    - The user can update their profile
    - Search other users and send a friend request
    - Can delete friends
    - Receive notifications to accept or denie friend request, notification for arriving messages
      
  - Realtime chat (ngeny)
    - User can send messages only to their friends
    - When the user receives a message, he is noticed and is redirected to the conversation by clicking on the notificaton button
    - When a user send a message the AI moderation system detecta and blocs it if it's toxic then the user will receive a waning message

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
| Game statistics and match history | Minor | 1 | llabonde | sss | sss |
| Implement remote authentication with OAuth 2.0 | Minor | 1 | gtoure, gpaupher | sss | sss |
| Advanced permissions system | Major | 2 | gtoure | sss | sss |
| Content moderation AI | Minor | 1 | ngeny | To filter messages before broadcasting to ensure a safe chat environment without a manual moderation | Using HuggingFace multilingual-toxic-xlm-roberta, the backend sends each message to the model API. It calculates the toxicity score (0 to 1), the function returns true if the message exceeds 0.8 (toxic), then the message is deleted from the database and the user receives a warning message |
| Implement a complete web-based game where users can play against each other | Major | 2 | llabonde | sss | sss |
| Remote players — Enable two players on separate computers to play the same game in real-time | Major | 2 | llabonde | sss | sss |

Total points : 21

### Individual Contributions :
   - gtoure
     - dsfdsf
   - gpaupher
     - dsdd
   - llabonde
     - sdff
   - ngeny
     -  sdfdsf
