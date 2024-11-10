const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score'); // Access the score display element

// Setting canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Rules Display
const rulesButton = document.getElementById('rulesButton');
const rulesOverlay = document.getElementById('rulesOverlay');
const closeRules = document.getElementById('closeRules');
const gameTitle = document.getElementById('gameTitle');

// Show rules overlay when 'Rules' button is clicked
rulesButton.addEventListener('click', () => {
    rulesOverlay.style.display = 'flex';
});

// Hide rules overlay when 'Close' button is clicked
closeRules.addEventListener('click', () => {
    rulesOverlay.style.display = 'none';
});

// Game variables
let player = {
    x: canvas.width / 4.5, // Center horizontally
    y: canvas.height / 2, // Center vertically
    width: 100,
    height: 70,
    speed: 3, // Constant forward speed
    dy: 0 // Vertical speed initialized to 0
};
let scrollOffset = 0;
const groundHeight = 0; // Height of the ground on top and bottom
let isGameStarted = false; // Control when the game starts
let isGameOver = false; // Track game over state
let score = 0; // Score variable
let scoreIncrementRate = 1; // How fast the score increases (changeable)

//Questions
const questions = [
    { question: "Oh no! A BAT appeared. Defeat it!", options: ["Gorgio", "Flipendo", "Riddikulus"], correct: 1, characterImage: './Assets/bat.png' },
    { question: "A RED CAP! Make it go away!", options: ["Lumos", "Riddikulus", "Spongify"], correct: 2, characterImage: './Assets/redcap.png' },
    { question: "What a Giant GRINDYLOW! Jinx it!", options: ["Relashio", "Expelliarmus", "Obliviate"], correct: 0, characterImage: './Assets/grindylow.png' },
    { question: "A DEMENTOR! Don't let it kiss you! ", options: ["Alohomora", "Expecto Patronum", "Expelliarmus"], correct: 1, characterImage: './Assets/dementor.png' },
    { question: "Ehh, a BOWTRUCKLE! Fire it away!", options: ["Accio", "Incendio", "Ascendio"], correct: 1, characterImage: './Assets/bowtruckle.png' },
    { question: "A wicked PIXIE appeared! Make it go!", options: ["Spongify", "Expecto Patronum", "Incendio"], correct: 2, characterImage: './Assets/pixie.png' },
    { question: "What a creepy GIANT SPIDER! Destroy it!", options: ["Petrificus Totalus", "Episkey", "Descendo"], correct: 0, characterImage: './Assets/spider.png' }
];

// Pipe variables
let pipes = []; // Array to hold pipe objects
const PIPE_WIDTH = 50; // Width of the pipe (rod)
const PIPE_GAP = 150; // Space between the top and bottom pipes (hoop)
const PIPE_FREQUENCY = 150; // How frequently pipes spawn (in frames)
let frameCount = 0; // Frame counter for pipe generation

// Variable to keep track of the last speed increase
let lastSpeedIncrease = 0;

// Load custom rod and hoop and character images
const rodImage = new Image();
rodImage.src = './Assets/rod.png'; // Replace with the actual path to your rod image
const hoopImage = new Image();
hoopImage.src = './Assets/hoop.png'; // Replace with the actual path to your hoop image
const characterImage = new Image();
characterImage.src = './Assets/harry.png'; // Path to your character image


// Start button event listener
startButton.addEventListener('click', startGame);

// Keyboard events for vertical movement (Arrow keys and W/S keys)
document.addEventListener('keydown', (e) => {
    if (isGameStarted && !isGameOver) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') player.dy = -player.speed;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') player.dy = player.speed;

        // Horizontal movement
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.x -= player.speed;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.x += player.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (isGameStarted && !isGameOver) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
            player.dy = 0;
        }
    }
});

let nextBlockScore = 50; // Starting score for the first block appearance
let initialSpeed=3;

// Function to start the game
function startGame() {
    document.body.classList.remove('new-background');
    document.body.classList.remove('night-background');
    document.body.classList.add('background');
    // Hide the rules overlay (if open) when the game starts
    rulesButton.style.display = 'none';
    gameTitle.style.display = 'none';
    // Hide the start screen and start the game logic
    isGameStarted = true;
    isGameOver = false;
    startButton.style.display = 'none'; // Hide the start button
    score = 0; // Reset score
    player.y = canvas.height / 2; // Reset player position
    player.dy = 0; // Reset vertical speed to 0
    player.speed = initialSpeed
    scrollOffset = 0; // Reset scroll offset
    pipes = []; // Reset pipes
    frameCount = 0; // Reset frame count
    nextBlockScore = 80;
    lastSpeedIncrease = 0;
    update(); // Start the game loop
}

// Function to handle game over
function gameOver() {
    isGameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Display game over screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Oh no! Game Over", canvas.width / 2, canvas.height / 2 - 100);
    ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("Press Start to Play Again", canvas.width / 2, canvas.height / 2 + 70);
    
    startButton.style.display = 'block'; // Show the start button again
}

const BLOCK_INTERVAL = [60, 200]; // Range of scores before the next block appears
const QUESTION_TIME_LIMIT = 5000; // 5 seconds to answer the question

function generateQuestion() {
    return questions[Math.floor(Math.random() * questions.length)]; // Randomly select a question
}

// Function to display the question overlay (for illustration)
function displayQuestionOverlay(questionData) {
    const overlay = document.createElement("div");
    overlay.classList.add("question-overlay");
    overlay.innerHTML = `
        <img src="${questionData.characterImage}" alt="Character" class="character-image" />
        <p>${questionData.question}</p>
        ${questionData.options.map((opt, i) => `<button class="answer-option" data-correct="${i === questionData.correct}">${opt}</button>`).join('')}
    `;
    document.body.appendChild(overlay);
}

// Function to show the question overlay
function showQuestion() {
    // Pause game
    isGameStarted = false;

    // Generate a random question
    const questionData = generateQuestion();
    displayQuestionOverlay(questionData);

    // Start the timer for the question
    const timer = setTimeout(() => {
        // If time runs out without answering, end the game
        removeQuestionOverlay();
        gameOver();
    }, QUESTION_TIME_LIMIT);

    // Set up event listener for answer submission
    document.querySelectorAll('.answer-option').forEach(option => {
        const newOption = option.cloneNode(true); // Clone the option to remove old listeners
        option.parentNode.replaceChild(newOption, option);
    
        newOption.addEventListener('click', (e) => {
            clearTimeout(timer); // Clear timer on answer
            removeQuestionOverlay();
            if (e.target.dataset.correct === "true") {
                resumeGame(); // Resume game on correct answer
            } else {
                gameOver(); // Game over on incorrect answer
            }
        });
    });
    
}

function removeQuestionOverlay() {
    const overlay = document.querySelector(".question-overlay");
    if (overlay) {
        overlay.remove();
    }
}

// Function to resume game after correct answer
function resumeGame() {
    isGameStarted = true;
    nextBlockScore += Math.floor(Math.random() * (BLOCK_INTERVAL[1] - BLOCK_INTERVAL[0] + 1)) + BLOCK_INTERVAL[0];
    update(); // Resume the game loop
}

const MAX_VERTICAL_DIFFERENCE = 250; // Maximum vertical distance between consecutive hoops
let lastPipeY = canvas.height / 2;

// Update player position, background, and score
function update() {
    if (!isGameStarted || isGameOver) return; // Prevent the game loop from running if the game isn't started or it's game over

    player.y += player.dy;
    scrollOffset += player.speed; // Constant forward movement

    // Update the score continuously
    score += scoreIncrementRate / 20; // Increment score (assuming 60 frames per second)
    scoreDisplay.innerText = Math.floor(score); // Display the integer value of score

    // Check if score has reached 200 and change the background
    if (score >= 130 && document.body.className !== 'new-background') {
        document.body.classList.add('new-background'); // Add new background class to body
    }
    if (score >= 320 && document.body.className !== 'night-background') {
        document.body.classList.add('night-background'); // Add new background class to body
    }

    if (score >= nextBlockScore) {
        showQuestion(); // Show question and block player
        return; // Stop update until question is answered
    }

    // Pipe generation logic
    frameCount++;
    if (frameCount % PIPE_FREQUENCY === 0) {
        // Calculate new pipe height within the maximum vertical difference
        const minY = Math.max(groundHeight, lastPipeY - MAX_VERTICAL_DIFFERENCE);
        const maxY = Math.min(canvas.height - PIPE_GAP - groundHeight, lastPipeY + MAX_VERTICAL_DIFFERENCE);
        const pipeHeight = Math.random() * (maxY - minY) + minY;

        // Add new pipe to pipes array
        pipes.push({ x: canvas.width, y: pipeHeight });

        lastPipeY = pipeHeight; //update lastPipeY for next pipe
    }

    // Move pipes to the left
    pipes.forEach(pipe => {
        pipe.x -= player.speed; // Move pipe left based on player speed
    });

    // Check for collision with pipes
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        if (
            player.x < pipe.x + PIPE_WIDTH &&
            player.x + player.width > pipe.x &&
            (player.y < pipe.y || player.y + player.height > pipe.y + PIPE_GAP)
        ) {
            gameOver(); // Trigger game over if a collision is detected
            return;
        }
    }

    // Remove pipes that have gone off screen
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    // Check for score increment based on pipe passing
    pipes.forEach(pipe => {
        if (pipe.x + PIPE_WIDTH < player.x && !pipe.scored) {
            score += 1; // Increment score for each pipe passed
            pipe.scored = true; // Mark pipe as scored
        }
    });

    // Check if the score has crossed a multiple of 100
    if (Math.floor(score / 100) > lastSpeedIncrease) {
        player.speed += 0.5; // Increase speed
        scoreIncrementRate += 0.5; // Increase score increment rate
        lastSpeedIncrease++; // Update the last speed increase
    }

    // Boundaries for vertical movement
    if (player.y < groundHeight || player.y + player.height > canvas.height - groundHeight) {
        // Player has touched the ground (either top or bottom)
        gameOver(); // Trigger game over
        return;
    }

    draw();
    requestAnimationFrame(update);
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (scrolling to the left to simulate forward movement)
    ctx.fillStyle = '#98FB98'; // light green for ground
    
    // Draw ground at the bottom
    ctx.fillRect(-scrollOffset, canvas.height - groundHeight, canvas.width * 2, groundHeight);
    // Draw ground at the top
    ctx.fillRect(-scrollOffset, 0, canvas.width * 2, groundHeight);

    // Draw pipes (rods) and hoops
    pipes.forEach(pipe => {
        // Draw rod
        ctx.drawImage(rodImage, pipe.x, 0, PIPE_WIDTH, pipe.y); // Top rod
        ctx.drawImage(rodImage, pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.y - PIPE_GAP); // Bottom rod

        // Draw hoop
        ctx.drawImage(hoopImage, pipe.x, pipe.y, PIPE_WIDTH, PIPE_GAP); // Hoop in the gap
    });

    // Player character
    ctx.drawImage(characterImage,player.x, player.y, player.width, player.height)
    
    // Check if the ground has scrolled out of view and reset scrollOffset
    if (scrollOffset >= canvas.width) {
        scrollOffset = 0; // Reset to create an endless effect
    }
}

// Initially, the game is not running until the start button is clicked.
