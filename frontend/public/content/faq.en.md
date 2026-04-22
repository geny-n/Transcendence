### WHAT IS PONG ?

Pong is a groundbreaking electronic game created by Atari in 1972, often recognized as one of the first successful video games that helped launch the modern gaming industry. The game simulates a simplified version of table tennis, where players control paddles to hit a moving ball back and forth across the screen. Initially developed as a test project by programmer Al Alcorn, Pong quickly gained immense popularity and became a staple in bars, restaurants, and college campuses. Its success led to the production of home consoles in 1975 and a legal dispute with Magnavox over patent rights.

Pong's impact is significant, as it not only introduced many to the concept of video gaming but also established a lucrative market for arcade and home gaming systems. The game has been inducted into the Video Game Hall of Fame and is part of the Smithsonian Institution’s collection, highlighting its cultural significance. Despite its simple mechanics, Pong's legacy endures, influencing countless games and the development of more advanced gaming technologies.

**Authored By: Sheposh, Richard**
    
---

### HOW TO PLAY ?

There are exactly three moving parts in this design: Two paddles and a ball. Both paddles are controlled by humans. The paddles occupy space on the right and left hand side of the screen, and the ball is placed at the center. The ball will (sometimes randomly) be served towards one player or the other, and it is the player's objective to block the ball from moving off their end of the screen. If the player fails to intercept the ball, a point is scored for the opposing player. 

The ball typically moves at a given velocity along the x axis, and can have  more y-velocity applied depending on what part of a paddle the ball strikes, or in other versions, how much y velocity the paddle currently has.

The design, in it's simplicity, can be sort of brilliant. There are several details to watch for. Velocity as I've just said is paramount in this game. Be careful in your implementation of the input, as the first thing a player will notice is how responsive the controls are.

The input/output system you are creating is not just in code, it also resides between the keyboard and the chair. The main loop you are creating is always about balancing for the average reaction time and skill of the player. In Pong, this will mean balancing the speed of the game at the early stages for the slowest, least experienced reaction times, and adjusting for experienced players so they do not become bored. This is a difficult balance. I will reiterate: pay attention to how the input feels. There is only one control, and only one thing you spend time doing in this game, and that is moving a paddle up and down. It is a one dimensional control. Take the time to get it right.

All multiplayer games typically come down to a portion of the game that is higher level than the mechanics themselves, called yomi. The mechanics should always be designed with this in mind. 

---

### WHAT IS YOMI ?
	
Yomi is the Japanese word reading, as in reading the mind of the opponent. If you can condition your enemy to act in a certain way, you can then use his own instincts against him (a concept from the martial art of Judo). Paramount in the design of competitive games is the guarantee to the player that if he knows what his enemy will do, there is some way to counter it.

This is akin to the rock, paper, scissors design strategy, but is more reliant on human psychological games.