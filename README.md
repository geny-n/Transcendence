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
- React
  - https://blog.stackademic.com/uploading-files-with-react-post-request-dd6c1eebe933
  - https://medium.com/@denis.mutunga/uploading-images-to-the-backend-in-react-with-formdata-c8035ae64a0c
  - https://react.dev/learn/updating-arrays-in-state
  - https://react-icons.github.io/react-icons/search/#q=info
- Socket
  - https://blog.bitsrc.io/creating-a-multiple-instances-socket-react-context-library-a-step-by-step-guide-52443cd1d19a
  - https://socket.io/how-to/use-with-react
  - https://dev.to/nardin/real-time-notification-react-socket-io-5e76
- Tailwind
  - https://tailwindcss.com/
- Huggingface
  - https://huggingface.co/citizenlab/distilbert-base-multilingual-cased-toxicity?text=pute
- JS
  - https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Array/push
- Pong
  - https://gist.github.com/straker/81b59eecf70da93af396f963596dfdc5
  - https://indiegamedev.net/2020/02/09/making-your-first-game-pong-the-architecture/
    
- Express + TypeScript
  - https://www.youtube.com/watch?v=nH9E25nkk3I
  - https://www.youtube.com/watch?v=Be7X6QJusJA
- MariaDB + Prisma ORM
  - https://www.prisma.io/docs
- AI
  - AI was used to find relevant resources for the different modules. For example, it found two YouTube videos to introduce me to Express and TypeScript. It was also used for error messages, to test different features and to find bugs.

## Additional sections
### Team Information :
- Project Owner (gpaupher)
  - Feature definition
  	- Identifying and defining the core features required for the application
  	- Discussing additional feature to enhance the user experience
  	- Making decisions on features prioritization (what to keep, improve, or remove)
  	- Ensuring a smooth and intuitive user experience (UX)
  
  - User stories
   - The project was divided into user stories, focusing on user needs. It helped prioritize tasks and maintain a user-centered approach during development
   - As a user, I can create an account and log in
   - As a user, I can play Pong against another player online
   - As a user, I can view my match history and statistics
   - As a user, I can interact with other players through chat
	
  - Project monitoring
    - Helping organize the workflow to keep the team on track
    - Regularly testing and reviewing new versions of the application
    - Verifying that implemented features meet the project requirements and expectations
    
- Teach Lead Backend (gtoure)
  - Defines technical architecture :
    - Design the flow of information between each service
  - Makes technology stack decisions :
    - Choose the framework, ORM
    - Gathering information on development needs
    - Approves all additions of new extensions
  - Ensures code quality and best practices :
    - Design the backend file architecture
    - Review the changes made to the backend
    - Ensure that safety standards are met
  - Reviews critical code changes :
    - Leading the technical part in meeting
    - Ensure that new features using the backend function correctly
    - Listening to and evaluating suggestions for improving the backend
    - Helping in merge conflict

- Teach Lead Frontend (llabonde)
  - Defines technical architecture :
    - Design the flow of information between each service
  - Makes technology stack decisions :
    - Choose the framework
    - Gathering information on development needs
    - Approves all additions of new extensions
  - Ensures code quality and best practices :
    - Design the frontend file architecture
    - Review the changes made to the front
    - Ensure that safety standards are met
  - Reviews critical code changes :
    - Leading the technical part in meeting
    - Ensure that new features using the frontend function correctly
    - Listening to and evaluating suggestions for improving the frontend
    - Helping in merge conflict

-  Developers (all)
    - Every member contributed to code and build the project
    - Each one had a feature assigned to them
    - Helping each other to solve problems 
    - Testing other developpers code to see any flows
    - Each one documented their part, so that other developpers could see how it works
    

### Project Management :
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

### Technical Stack :
- Backend technologies and frameworks used :
  - Express : It requires to understand and configure basic concepts (like middlewares for parsing JSON) manually, which builds a much stronger foundational knowledge
  - TypeScript : TypeScript adds a static type system to JavaScript to catch errors before the code runs
  - Socket.io : if we use classic WebSockets for our application, we will stil eventually need to implement most of the features already included in Socket.io, such as automatic reconnection, acknowledgments, or event broadcasting
- Frontend technologies and frameworks used :
  - TailwindCSS : A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.
  - Vite : (Recommended by former studs) is a helpful tool to ease the development of the project. It saves a lot of time by allowing us to see our modifications in almost real-time.
  - React : (Recommended by former studs) React is a tool used to build user interfaces out of individual pieces called components. Which we used to create our pages and game.

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

  - PongGame (llabonde)
    - Each player control his own paddle, and try to prevent the ball from reaching their own edge of the board. Notice that the ball's speed increases each time it bouce off something.
    - The paddles are meant to be controlled by the up and down arrow keys on keyboard, but there is also buttons usable directly next to the board.
    - First to score 5 points, or most after 5min, wins the match.
    - Overtime if scores are equal after 5min, 2min are added to finish the match, as much time needed to have a clear winner at the end of timer.
    - Players can forfeit at anytime during the match, ending the match.
    - If a player is disconnected, a 1min timer is set to wait for his return.
    - At the end of the match, players have the opportunity to ask for a rematch, wich sents a notification to the opponent, if he agrees, the rematch begins.

  - Matchmaking (llabonde)
    - Players are put in a line, waiting for opponents to start a match.
  
  - ScoreBoard (llabonde)
    - Keep track of the match happening generally, displaying winner and loser, score, game duration, player stats.

  - LeaderBoard (llabonde)
    - Keep track of the most experienced players, and display their stats and progress.
    - Experience levels follow Fibonnacci sequence, and the max level is 12, after that, only total experience progresses.

  - The User and Authentication System (gtoure)
    - Classic Registration/Login: Endpoints to create an account and log in with email/password
    - JWT Generation and Validation: Create a token system (access_token, refresh_token) to maintain user sessions
    - OAuth 2.0: Manage the callback, check if the user exists, otherwise create it
    - User Profile Management: API to read and update the nickname, avatar, etc
    - Friends System: Logic for sending, accepting, rejecting, and deleting friend requests, manage the friend list and their online status
    - Basic Permissions: Check if a user is logged in (auth guard) and if they have the right to access a resource (for example, modify their own profile only).
   
  - Athentication forms (gpaupher)
	- Registration and login pages with their own logic and regex to register or login users into database using API.
	- Regex used to allow only certain combination of characters and forbid other characters to avoid breaches and conflicts with the database.
	- Checking the authentication process with the backend using API. Proceeds if the returned status is good or return an error to the UI.
	- Connect OAuth 2.0 to the front to allow login via Discord and 42.

  - Navigation (gpaupher)
	- Simple responsive navbar to allow seamless navigation within the app.
	- Protected routes to allow only certain type of users into certain pages (Profile page only accessible by a USER client).
	- Non-existent urls kept in check and redirected to an other page of our app to avoid strays.

### Modules :
| Modules | Typel | Points | Team members(s) | Justification | Implementation |
| :------ | :---- | :----  | :-------------- | :------------ | :------------- |
| Use a framework for both the frontend and backend | Major | 2 | All | The usage of frameworks provides reusable, generic functionality which our team can extend or customize to create complete solutions. For the front (React)  enables a component-based architecture, making the UI modular and maintainable. For the back (Express) it spares the struggle to recreate every feature for the basic HTTP transaction like webserv and to focus on business requirements  | Our architecture reflects our use of the frameworks. We declare them in the index files, which gives us a strong base to start implementing features. |
| Implement real-time features using WebSockets or similar technology | Major | 2 | All | Essential for live chat. Real-time updates of user profile | Socket.IO for bidirectional communicaiton |
| Allow users to interact with other users | Major | 2 | gtoure, ngeny | To have a user-friendly game platform where players can chat with friends and see all users profile | Complete user profiles (view, update, avatar, search). Advanced friend system: send/accept/reject requests, friends list with online status, real-time integration via Socket io (status notifications and friend requests), basic chat (send/receive messages) implemented by [ngneny]. |
| Use an ORM for the database | Minor | 1 | gtoure | We use Prisma as our ORM to benefit from a database schema, a fully-typed TypeScript client, simplified relationship management, and automated migrations. This allows us to accelerate development and reduce errors. | When the backend container starts (via Docker Compose), we run `npm run db:deploy` to apply the schema defined in `prisma/schema.prisma`, `prisma generate` to create the TypeScript client. All interactions with the database (users, friends, organizations, etc.) are then performed through this typed and secure client. |
| A complete notification system | Minor | 1 | ngeny | To notify if the user receives new messages or a friend request   | Using Socket.io, the backend emits events to the user's personal room when the user receives a friend request or a new message. The frontend listens to these events to display in the notification panel on the profile page |
| Support for multiple languages (at least 3 languages) | Minor | 1 | ngeny | Allow a wider community to access our platform (English, French, Spanish) | Implementation of the react-i18next library. The default langage is set to French. Each displayed text is replaced by a translation key, which returns the correct value based on the user's selected language. |
| Right-to-left (RTL) language support | Minor | 1 | ngeny | Allow a wider community to access our platform (Arabic) | The implementation is the same as above. To mirror the entire page layout, we use the HTML dir attribute |
| Support for additional browsers | Minor | 1 | gpaupher | Supporting multiple browsers ensures that all users can access the application regardless of their browsers preference. | The application was tested on Chrome (primary), Firefox and Brave. We used TailwindCSS to ensure a consistent theme across all tested browsers. |
| Standard user management and authentication | Major | 2 | gtoure, ngeny | To have a user-friendly game platform where players can chat with friends, scoreboard, leaderboard and see all users profile. Allow user to update their profile (avatar, username, email, password), add or delete friends, visualise personal match history | Creates backend endpoints that manage profile changes via a form sent to the associated endpoints. The avatar is handled by the Multer extension. A friends system has been implemented for adding friends and viewing their status; a variable that updates when a user logs in allows users to see their status. |
| Game statistics and match history | Minor | 1 | llabonde | A scoreboard keeping track of the games and a leaderboard keeping track of the most experienced players. | When a match ends, the record and stats is stored and displayed on the scoreboard(and the personal history in the profile), and you can check your progress towards top players in the leaderboard. |
| Implement remote authentication with OAuth 2.0 | Minor | 1 | gtoure, gpaupher | Offers an alternative to manual registration if the user does not want the hassle of creating an account. | Implemented using the Passport.js middleware, which allows the implementation of authentication strategies via API calls in the case of OAuth 2.0. |
| Advanced permissions system | Major | 2 | gtoure | The system controls access to sensitive features such as user management. This module enhances the overall security of the project and adheres to the principle of least privilege. | Implementation of a complete Role Based Access Control system with 2 roles (USER, ADMIN). Creation of reusable guards to protect HTTP routes. |
| Content moderation AI | Minor | 1 | ngeny | To filter messages before broadcasting to ensure a safe chat environment without a manual moderation | Using HuggingFace multilingual-toxic-xlm-roberta, the backend sends each message to the model API. It calculates the toxicity score (0 to 1), the function returns true if the message exceeds 0.5 (toxic), then the message is deleted from the database and the user receives a warning message. Model is warming up at server startup to eliminate latency. |
| Implement a complete web-based game where users can play against each other | Major | 2 | llabonde | Pong is the natural choice considering the ressources availables,and our (mine here) lack of experience in the matter. | The game is made of React objects, working as Pong shall. |
| Remote players — Enable two players on separate computers to play the same game in real-time | Major | 2 | llabonde | Having just a local mode would not be as cool as having another player play on his own pc. | A macthmaking system with Socket.IO allows players to do so. |

Total points : 21

### Individual Contributions :
   - gtoure
     - My role was to build and maintain the brain and memory of the application. I was responsible for everything that happens "under the hood": the logic, the data, and the real-time communication.
   - gpaupher
     - My work was mostly in the front end. I made sure that users could register or login the way they are intended to. Allowing users to seamlessly navigate within our single-page application.
   - llabonde
     - Most of my work was making the game as playable as possible, and make the systems behind it(game,matchmaking,revenge,dc timers,play flow).
   - ngeny
     -  My work was focused on the frontend. I built a real-time private chat between friends. I also developed the profile page which includes profile updating, friend management, notifications and user search
