### ¿QUÉ ES PONG?

Pong es un juego electrónico revolucionario creado por Atari en 1972, a menudo reconocido como uno de los primeros videojuegos exitosos que ayudaron a lanzar la industria moderna de los videojuegos. El juego simula una versión simplificada del tenis de mesa, donde los jugadores controlan paletas para golpear una pelota en movimiento de un lado a otro de la pantalla. Inicialmente desarrollado como un proyecto de prueba por el programador Al Alcorn, Pong rápidamente ganó una inmensa popularidad y se convirtió en un elemento habitual en bares, restaurantes y campus universitarios. Su éxito llevó a la producción de consolas domésticas en 1975 y a una disputa legal con Magnavox sobre los derechos de patente.

El impacto de Pong es significativo, ya que no solo introdujo a muchas personas al concepto de los videojuegos, sino que también estableció un mercado lucrativo para los sistemas de juego arcade y domésticos. El juego ha sido incluido en el Video Game Hall of Fame y forma parte de la colección de la Smithsonian Institution, lo que destaca su importancia cultural. A pesar de sus mecánicas simples, el legado de Pong perdura, influyendo en innumerables juegos y en el desarrollo de tecnologías de juego más avanzadas.

**Autor: Sheposh, Richard**

---

### ¿CÓMO JUGAR?

Hay exactamente tres elementos en movimiento en este diseño: dos paletas y una pelota. Ambas paletas son controladas por humanos. Las paletas ocupan espacio en los lados derecho e izquierdo de la pantalla, y la pelota se coloca en el centro. La pelota será (a veces de manera aleatoria) servida hacia uno de los jugadores, y el objetivo del jugador es impedir que la pelota salga por su lado de la pantalla. Si el jugador no logra interceptar la pelota, se anota un punto para el jugador contrario.

La pelota normalmente se mueve a una velocidad determinada a lo largo del eje x, y puede tener más velocidad en el eje y dependiendo de qué parte de la paleta golpee, o en otras versiones, según cuánta velocidad en y tenga actualmente la paleta.

El diseño, en su simplicidad, puede ser en cierto modo brillante. Hay varios detalles a tener en cuenta. La velocidad, como acabo de decir, es fundamental en este juego. Ten cuidado en tu implementación de la entrada, ya que lo primero que un jugador notará es la capacidad de respuesta de los controles.

El sistema de entrada/salida que estás creando no solo está en el código, también reside entre el teclado y la silla. El bucle principal que estás creando siempre trata de equilibrar el tiempo de reacción promedio y la habilidad del jugador. En Pong, esto significa equilibrar la velocidad del juego en las primeras etapas para los tiempos de reacción más lentos y los jugadores menos experimentados, y ajustarla para los jugadores experimentados para que no se aburran. Este es un equilibrio difícil. Lo reitero: presta atención a cómo se sienten los controles. Solo hay un control, y solo hay una cosa que haces en este juego, que es mover una paleta hacia arriba y hacia abajo. Es un control unidimensional. Tómate el tiempo para hacerlo bien.

Todos los juegos multijugador suelen reducirse a una parte del juego que está a un nivel superior a las mecánicas en sí mismas, llamada yomi. Las mecánicas siempre deben diseñarse teniendo esto en cuenta.

---

### ¿QUÉ ES YOMI?

Yomi es la palabra japonesa para “lectura”, como en leer la mente del oponente. Si puedes condicionar a tu enemigo para que actúe de cierta manera, entonces puedes usar sus propios instintos en su contra (un concepto del arte marcial del judo). Lo primordial en el diseño de juegos competitivos es garantizar al jugador que, si sabe lo que su enemigo va a hacer, existe alguna forma de contrarrestarlo.

Esto es similar a la estrategia de piedra, papel o tijeras, pero depende más de juegos psicológicos humanos.