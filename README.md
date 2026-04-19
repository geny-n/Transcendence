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
  - Assigned role(s) :
    -  PO
    -  PM
    -  Teach Lead
    -  Developers
  - responsabilities
    
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
  - sdfsdf
  - sdfsdf
  - sdfsdf

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
| Content moderation AI | Minor | 1 | ngeny | To filter messages before broadcasting to ensure a safe chat environment without a manual moderation | Using HuggingFace multilingual-toxic-xlm-roberta, the backend sends each message to the model API. It calculates the toxicity score (0 to 1), the function returns true if the message exceeds 0.8 (toxic), then the message is deleted from the database and the user receives a warning message |
| Implement a complete web-based game where users can play against each other | Major | 2 | llabonde | Pong is the natural choice considering the ressources availables,and our (mine here) lack of experience in the matter. | The game is made of React objects, working as Pong shall. |
| Remote players — Enable two players on separate computers to play the same game in real-time | Major | 2 | llabonde | Having just a local mode would not be as cool as having another player play on his own pc. | A macthmaking system with Socket.IO allows players to do so. |

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
