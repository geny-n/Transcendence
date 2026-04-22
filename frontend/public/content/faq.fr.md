### QU'EST-CE QUE PONG?

Pong est un jeu électronique révolutionnaire créé par Atari en 1972, souvent reconnu comme l’un des premiers jeux vidéo à succès ayant contribué au lancement de l’industrie moderne du jeu vidéo. Le jeu simule une version simplifiée du tennis de table, où les joueurs contrôlent des raquettes pour renvoyer une balle en mouvement d’un côté à l’autre de l’écran. Initialement développé comme un projet test par le programmeur Al Alcorn, Pong a rapidement gagné une immense popularité et est devenu un incontournable dans les bars, les restaurants et les campus universitaires. Son succès a conduit à la production de consoles domestiques en 1975 ainsi qu’à un litige juridique avec Magnavox concernant des droits de brevet.

L’impact de Pong est significatif, car il a non seulement initié de nombreuses personnes au concept de jeu vidéo, mais il a également établi un marché lucratif pour les systèmes de jeux d’arcade et domestiques. Le jeu a été intronisé au Video Game Hall of Fame et fait partie de la collection de la Smithsonian Institution, soulignant son importance culturelle. Malgré ses mécaniques simples, l’héritage de Pong perdure, influençant d’innombrables jeux et le développement de technologies de jeu plus avancées.

**Auteur : Sheposh, Richard**

---

### COMMENT JOUER ?

Il y a exactement trois éléments en mouvement dans cette conception : deux raquettes et une balle. Les deux raquettes sont contrôlées par des humains. Les raquettes occupent l’espace sur les côtés droit et gauche de l’écran, et la balle est placée au centre. La balle sera (parfois de manière aléatoire) servie vers l’un des joueurs, et l’objectif du joueur est d’empêcher la balle de sortir de son côté de l’écran. Si le joueur ne parvient pas à intercepter la balle, un point est marqué pour le joueur adverse.

La balle se déplace généralement à une vitesse donnée le long de l’axe x, et peut recevoir davantage de vitesse sur l’axe y selon la partie de la raquette qu’elle frappe, ou dans d’autres versions, en fonction de la vitesse actuelle de la raquette sur l’axe y.

La conception, dans sa simplicité, peut être en quelque sorte brillante. Il y a plusieurs détails auxquels il faut prêter attention. La vitesse, comme je viens de le dire, est primordiale dans ce jeu. Soyez attentif dans votre implémentation des entrées, car la première chose qu’un joueur remarquera est la réactivité des contrôles.

Le système d’entrée/sortie que vous créez ne se trouve pas seulement dans le code, il réside également entre le clavier et la chaise. La boucle principale que vous créez consiste toujours à équilibrer le temps de réaction moyen et le niveau de compétence du joueur. Dans Pong, cela signifie équilibrer la vitesse du jeu dans les premières phases pour les temps de réaction les plus lents et les joueurs les moins expérimentés, puis ajuster pour les joueurs expérimentés afin qu’ils ne s’ennuient pas. C’est un équilibre difficile. Je le répète : prêtez attention à la sensation des contrôles. Il n’y a qu’un seul contrôle, et une seule chose que vous faites dans ce jeu, à savoir déplacer une raquette de haut en bas. C’est un contrôle unidimensionnel. Prenez le temps de bien le faire.

Tous les jeux multijoueurs se résument généralement à une partie du jeu qui est d’un niveau supérieur aux mécaniques elles-mêmes, appelée yomi. Les mécaniques doivent toujours être conçues avec cela à l’esprit.

---

### QU'EST-CE QUE LE YOMI ?

Yomi est le mot japonais pour « lecture », comme dans lire l’esprit de l’adversaire. Si vous pouvez conditionner votre ennemi à agir d’une certaine manière, vous pouvez ensuite utiliser ses propres instincts contre lui (un concept issu de l’art martial du judo). Ce qui est primordial dans la conception de jeux compétitifs, c’est la garantie donnée au joueur que s’il sait ce que son adversaire va faire, il existe un moyen de le contrer.

Cela s’apparente à la stratégie pierre-feuille-ciseaux, mais repose davantage sur des jeux psychologiques humains.