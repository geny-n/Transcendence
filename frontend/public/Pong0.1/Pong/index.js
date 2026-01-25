let gameState = 'start';
let paddle_1 = document.querySelector('.paddle_1');
let paddle_2 = document.querySelector('.paddle_2');
let board = document.querySelector('.board');
let initial_ball = document.querySelector('.ball');
let ball = document.querySelector('.ball');
let score_1 = document.querySelector('.player_1_score');
let score_2 = document.querySelector('.player_2_score');
let message = document.querySelector('.message');
let paddle_1_coord = paddle_1.getBoundingClientRect();
let paddle_2_coord = paddle_2.getBoundingClientRect();
let initial_ball_coord = ball.getBoundingClientRect();
let ball_coord = initial_ball_coord;
let board_coord = board.getBoundingClientRect();
let paddle_common =
	document.querySelector('.paddle').getBoundingClientRect();

// debug logging (throttled to avoid spamming console)
let DEBUG_LOG_INTERVAL = 300; // ms
let lastDebugLog = 0;

// key state for smooth paddle movement
let keyState = {};
const PADDLE_SPEED_FACTOR = 0.75; // 0.6 * 1.25 = 0.75 (25% faster)
// paddleSpeed will be initialized after we read board dimensions
let paddleSpeed = 0;
let lastPaddleTime = null;
let lastBallTime = null;

// velocity vector (px per second)
let vx = 0;
let vy = 0;

// ball position (local to board)
let ballLocalLeft = 0;
let ballLocalTop = 0;

// reduce per-hit acceleration and global speed for playability
const SPEED_MULTIPLIER = 1.0; // disable speed growth for now
// global scale removed — compute velocities directly in px/s
const GLOBAL_SPEED_SCALE = 1.0;
// MAX_SPEED and base speeds will be set relative to the board height
let MAX_SPEED = 12;
let BASE_MIN_SPEED = 3;
let BASE_MAX_SPEED = 7;

// initialize velocities after reading board dimensions below
let dx = 0; // legacy placeholder (not used directly)
let dy = 0;

function initSpeeds() {
	board_coord = board.getBoundingClientRect();
	const dir = Math.random() < 0.5 ? -1 : 1;
	vx = dir * 187.5; // 150 * 1.25 = 187.5 (25% faster)
	vy = (Math.random() - 0.5) * 50; // -25 to +25 px/s vertical
}

console.log('Pong index.js loaded (cache-buster test) - GLOBAL_SPEED_SCALE=', GLOBAL_SPEED_SCALE);

function segIntersectsSeg(x1,y1,x2,y2,x3,y3,x4,y4) {
    // check if segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) intersect
    const det = (x2-x1)*(y4-y3) - (y2-y1)*(x4-x3);
    if (Math.abs(det) < 1e-6) return false;
    const t = ((x3-x1)*(y4-y3) - (y3-y1)*(x4-x3)) / det;
    const u = ((x3-x1)*(y2-y1) - (y3-y1)*(x2-x1)) / det;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

board.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        gameState = gameState == 'start' ? 'play' : 'start';
        if (gameState == 'play') {
            message.innerHTML = 'Game Started';
            requestAnimationFrame(() => {
                // init speeds relative to board height
                initSpeeds();
                // position ball at center of board
                board_coord = board.getBoundingClientRect();
                // IMPORTANT: remove transform FIRST before measuring
                ball.style.transform = '';
                ball.style.left = '0px';
                ball.style.top = '0px';
                // Now measure ball after positioning
                const ballRect = ball.getBoundingClientRect();
                const ballW = ballRect.width;
                const ballH = ballRect.height;
                // Center in board coordinates
                const centerLeft = (board_coord.width / 2 - ballW / 2);
                const centerTop = (board_coord.height / 2 - ballH / 2);
                ball.style.left = centerLeft + 'px';
                ball.style.top = centerTop + 'px';
                // Store initial position in JS variables
                ballLocalLeft = centerLeft;
                ballLocalTop = centerTop;
                // Refresh paddle positions
                paddle_1_coord = paddle_1.getBoundingClientRect();
                paddle_2_coord = paddle_2.getBoundingClientRect();
                board_coord = board.getBoundingClientRect();
                // start the ball loop
                lastBallTime = null;
                requestAnimationFrame(moveBall);
            });
        }
    } else {
        // register key state for continuous movement
        keyState[e.key] = true;
    }
});

board.addEventListener('keyup', (e) => {
    keyState[e.key] = false;
});

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function paddleLoop(ts) {
    if (!lastPaddleTime) lastPaddleTime = ts;
    const dt = (ts - lastPaddleTime) / 1000;
    lastPaddleTime = ts;
    // update board dimensions and paddle speed (keeps proportions)
    board_coord = board.getBoundingClientRect();
    paddleSpeed = board_coord.height * PADDLE_SPEED_FACTOR;
    // refresh paddle_common in case CSS changed
    paddle_common = document.querySelector('.paddle').getBoundingClientRect();

    if (gameState === 'play') {
        const move = paddleSpeed * dt;

        if (keyState['w']) {
            // compute position relative to board and move locally
            const localTop = paddle_1_coord.top - board_coord.top;
            const nextLocal = clamp(localTop - move, 0, board_coord.height - paddle_common.height);
            paddle_1.style.top = nextLocal + 'px';
        }
        if (keyState['s']) {
            const localTop = paddle_1_coord.top - board_coord.top;
            const nextLocal = clamp(localTop + move, 0, board_coord.height - paddle_common.height);
            paddle_1.style.top = nextLocal + 'px';
        }

        if (keyState['ArrowUp']) {
            const localTop = paddle_2_coord.top - board_coord.top;
            const nextLocal = clamp(localTop - move, 0, board_coord.height - paddle_common.height);
            paddle_2.style.top = nextLocal + 'px';
        }
        if (keyState['ArrowDown']) {
            const localTop = paddle_2_coord.top - board_coord.top;
            const nextLocal = clamp(localTop + move, 0, board_coord.height - paddle_common.height);
            paddle_2.style.top = nextLocal + 'px';
        }

        // refresh bounding rects for collisions and next frame
        paddle_1_coord = paddle_1.getBoundingClientRect();
        paddle_2_coord = paddle_2.getBoundingClientRect();
    }

    requestAnimationFrame(paddleLoop);
}

// start the paddle update loop
requestAnimationFrame(paddleLoop);

function moveBall(ts) {
    if (gameState !== 'play') {
        lastBallTime = null;
        return;
    }
    if (!ts) ts = performance.now();
    if (!lastBallTime) lastBallTime = ts;
    const dt = (ts - lastBallTime) / 1000;
    lastBallTime = ts;

    // refresh geometry
    board_coord = board.getBoundingClientRect();
    paddle_1_coord = paddle_1.getBoundingClientRect();
    paddle_2_coord = paddle_2.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();
    const ballH = ballRect.height;
    const ballW = ballRect.width;

    // Use stored local position (don't read from DOM)
    const localTop = ballLocalTop;
    const localLeft = ballLocalLeft;

    // next local positions using vx/vy (px per second)
    let nextLocalTop = localTop + vy * dt;
    let nextLocalLeft = localLeft + vx * dt;

    const nextAbsTop = board_coord.top + nextLocalTop;
    const nextAbsLeft = board_coord.left + nextLocalLeft;
    const nextAbsRight = nextAbsLeft + ballW;
    const nextAbsBottom = nextAbsTop + ballH;

    // scoring: if ball goes past left or right bounds (check in LOCAL coordinates)
    if (nextLocalLeft <= 0 || (nextLocalLeft + ballW) >= board_coord.width) {
        if (nextLocalLeft <= 0) {
            score_2.innerHTML = +score_2.innerHTML + 1;
        } else {
            score_1.innerHTML = +score_1.innerHTML + 1;
        }
        // reset speeds and stop
        initSpeeds();
        gameState = 'start';
        ballLocalLeft = 0;
        ballLocalTop = 0;
        ball.style.top = '';
        ball.style.left = '';
        ball.style.transform = 'translate(-50%, -50%)';
        message.innerHTML = 'Press Enter to Play Pong';
        return;
    }

    // wall (top/bottom) collision: adjust for visual glow
    const maxTop = board_coord.height - ballH;
    let clampedTop = nextLocalTop;
    
    // Top wall: detect earlier (at 18px) because glow extends upward
    if (nextLocalTop <= 18 && vy < 0) {
        vy = -vy;
        clampedTop = 18;
    }
    // Bottom wall: detect when visual reaches wall, no repositioning (let velocity push it out)
    if (nextLocalTop >= maxTop + 20 && vy > 0) {
        vy = -vy;
        // No repositioning - velocity will naturally push ball away from wall
    }

    // paddle collisions (compensate for CSS glow)
    const g = 6; // glow offset
    const ballCenterY = nextAbsTop + ballH / 2;
    
    // left paddle
    if (vx < 0 && 
        nextAbsLeft + g >= paddle_1_coord.right - g &&
        nextAbsLeft + g <= paddle_1_coord.right - g + 30 &&
        nextAbsBottom - g >= paddle_1_coord.top + g &&
        nextAbsTop + g <= paddle_1_coord.bottom - g
    ) {
        vx = Math.abs(vx) * 1.05; // bounce right with 5% speed boost
        const relative = (ballCenterY - (paddle_1_coord.top + paddle_1_coord.height / 2)) / (paddle_1_coord.height / 2);
        vy = vy * 1.05 + relative * Math.abs(vx) * 0.3; // 5% speed boost on vy too
    }

    // right paddle
    if (vx > 0 && 
        nextAbsRight - g >= paddle_2_coord.left + g &&
        nextAbsRight - g <= paddle_2_coord.left + g + 8 &&
        nextAbsBottom - g >= paddle_2_coord.top + g &&
        nextAbsTop + g <= paddle_2_coord.bottom - g
    ) {
        vx = -Math.abs(vx) * 1.05; // bounce left with 5% speed boost
        const relative = (ballCenterY - (paddle_2_coord.top + paddle_2_coord.height / 2)) / (paddle_2_coord.height / 2);
        vy = vy * 1.05 + relative * Math.abs(vx) * 0.3; // 5% speed boost on vy too
    }

    // apply positions (clamp horizontal, allow vertical to exceed for visual collision)
    const finalLeft = Math.max(0, Math.min(nextLocalLeft, board_coord.width - ballW));
    const finalTop = clampedTop; // Use clampedTop directly, allow it to exceed board for visual effect
    // Update stored position
    ballLocalLeft = finalLeft;
    ballLocalTop = finalTop;
    // Apply to DOM
    ball.style.left = finalLeft + 'px';
    ball.style.top = finalTop + 'px';

    // schedule next frame
    requestAnimationFrame(moveBall);
}
