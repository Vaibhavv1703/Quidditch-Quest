const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const rulesButton = document.getElementById('rulesButton');
const rulesOverlay = document.getElementById('rulesOverlay');
const closeRules = document.getElementById('closeRules');
const gameTitle = document.getElementById('gameTitle');


rulesButton.addEventListener('click', () => {
    rulesOverlay.style.display = 'flex';
});


closeRules.addEventListener('click', () => {
    rulesOverlay.style.display = 'none';
});


let player = {
    x: canvas.width / 4.5,
    y: canvas.height / 2,
    width: 100,
    height: 70,
    speed: 3,
    dy: 0
};
let scrollOffset = 0;
const groundHeight = 0;
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let scoreIncrementRate = 1;

const questions = [
    { question: "Oh no! A BAT appeared. Defeat it!", options: ["Gorgio", "Flipendo", "Riddikulus"], correct: 1, characterImage: './Assets/bat.png' },
    { question: "A RED CAP! Make it go away!", options: ["Lumos", "Riddikulus", "Spongify"], correct: 2, characterImage: './Assets/redcap.png' },
    { question: "What a Giant GRINDYLOW! Jinx it!", options: ["Relashio", "Expelliarmus", "Obliviate"], correct: 0, characterImage: './Assets/grindylow.png' },
    { question: "A DEMENTOR! Don't let it kiss you! ", options: ["Alohomora", "Expecto Patronum", "Expelliarmus"], correct: 1, characterImage: './Assets/dementor.png' },
    { question: "Ehh, a BOWTRUCKLE! Fire it away!", options: ["Accio", "Incendio", "Ascendio"], correct: 1, characterImage: './Assets/bowtruckle.png' },
    { question: "A wicked PIXIE appeared! Make it go!", options: ["Spongify", "Expecto Patronum", "Incendio"], correct: 2, characterImage: './Assets/pixie.png' },
    { question: "What a creepy GIANT SPIDER! Destroy it!", options: ["Petrificus Totalus", "Episkey", "Descendo"], correct: 0, characterImage: './Assets/spider.png' }
];


let pipes = [];
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const PIPE_FREQUENCY = 150;
let frameCount = 0;


let lastSpeedIncrease = 0;


const rodImage = new Image();
rodImage.src = './Assets/rod.png';
const hoopImage = new Image();
hoopImage.src = './Assets/hoop.png';
const characterImage = new Image();
characterImage.src = './Assets/harry.png';


startButton.addEventListener('click', startGame);


document.addEventListener('keydown', (e) => {
    if (isGameStarted && !isGameOver) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') player.dy = -player.speed;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') player.dy = player.speed;

        // if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.x -= player.speed;
        // if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.x += player.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (isGameStarted && !isGameOver) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
            player.dy = 0;
        }
    }
});

let nextBlockScore = 50;
let initialSpeed=3;


function startGame() {
    document.body.classList.remove('new-background');
    document.body.classList.remove('night-background');
    document.body.classList.add('background');
    rulesButton.style.display = 'none';
    gameTitle.style.display = 'none';
    isGameStarted = true;
    isGameOver = false;
    startButton.style.display = 'none';
    score = 0;
    player.y = canvas.height / 2;
    player.dy = 0;
    player.speed = initialSpeed
    scrollOffset = 0;
    pipes = [];
    frameCount = 0;
    nextBlockScore = 80;
    lastSpeedIncrease = 0;
    update();
}


function gameOver() {
    isGameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Oh no! Game Over", canvas.width / 2, canvas.height / 2 - 100);
    ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("Press Start to Play Again", canvas.width / 2, canvas.height / 2 + 70);
    
    startButton.style.display = 'block';
}

const BLOCK_INTERVAL = [60, 200];
const QUESTION_TIME_LIMIT = 5000;

function generateQuestion() {
    return questions[Math.floor(Math.random() * questions.length)];
}


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


function showQuestion() {
    isGameStarted = false;
    const questionData = generateQuestion();
    displayQuestionOverlay(questionData);
    const timer = setTimeout(() => {
        removeQuestionOverlay();
        gameOver();
    }, QUESTION_TIME_LIMIT);

    document.querySelectorAll('.answer-option').forEach(option => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
    
        newOption.addEventListener('click', (e) => {
            clearTimeout(timer);
            removeQuestionOverlay();
            if (e.target.dataset.correct === "true") {
                resumeGame();
            } else {
                gameOver();
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


function resumeGame() {
    isGameStarted = true;
    nextBlockScore += Math.floor(Math.random() * (BLOCK_INTERVAL[1] - BLOCK_INTERVAL[0] + 1)) + BLOCK_INTERVAL[0];
    update();
}

const MAX_VERTICAL_DIFFERENCE = 250;
let lastPipeY = canvas.height / 2;


function update() {
    if (!isGameStarted || isGameOver) return;

    player.y += player.dy;
    scrollOffset += player.speed;

    score += scoreIncrementRate / 20;
    scoreDisplay.innerText = Math.floor(score);

    if (score >= 130 && document.body.className !== 'new-background') {
        document.body.classList.add('new-background');
    }
    if (score >= 320 && document.body.className !== 'night-background') {
        document.body.classList.add('night-background');
    }

    // if ((score % 600 < 200 && score % 600 >= 0) && document.body.className !== 'background') {
    //     document.body.classList.add('backgroud');
    // }
    // if ((score % 600 < 400 && score % 600 >= 200) && document.body.className !== 'new-background') {
    //     document.body.classList.add('new-backgroud');
    // }
    // if ((score % 600 < 600 && score % 600 >= 400) && document.body.className !== 'night-background') {
    //     document.body.classList.add('night-backgroud');
    // }

    if (score >= nextBlockScore) {
        showQuestion();
        return;
    }

    frameCount++;
    if (frameCount % PIPE_FREQUENCY === 0) {
        const minY = Math.max(groundHeight, lastPipeY - MAX_VERTICAL_DIFFERENCE);
        const maxY = Math.min(canvas.height - PIPE_GAP - groundHeight, lastPipeY + MAX_VERTICAL_DIFFERENCE);
        const pipeHeight = Math.random() * (maxY - minY) + minY;

        pipes.push({ x: canvas.width, y: pipeHeight });

        lastPipeY = pipeHeight;
    }

    pipes.forEach(pipe => {
        pipe.x -= player.speed;
    });


    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        if (
            player.x < pipe.x + PIPE_WIDTH &&
            player.x + player.width > pipe.x &&
            (player.y < pipe.y || player.y + player.height > pipe.y + PIPE_GAP)
        ) {
            gameOver();
            return;
        }
    }

    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    pipes.forEach(pipe => {
        if (pipe.x + PIPE_WIDTH < player.x && !pipe.scored) {
            score += 1;
            pipe.scored = true;
        }
    });

    if (Math.floor(score / 100) > lastSpeedIncrease) {
        player.speed += 0.5;
        scoreIncrementRate += 0.5;
        lastSpeedIncrease++;
    }

    if (player.y < groundHeight || player.y + player.height > canvas.height - groundHeight) {
        gameOver();
        return;
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#98FB98';
    ctx.fillRect(-scrollOffset, canvas.height - groundHeight, canvas.width * 2, groundHeight);
    ctx.fillRect(-scrollOffset, 0, canvas.width * 2, groundHeight);
    pipes.forEach(pipe => {
        ctx.drawImage(rodImage, pipe.x, 0, PIPE_WIDTH, pipe.y);
        ctx.drawImage(rodImage, pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.y - PIPE_GAP);
        ctx.drawImage(hoopImage, pipe.x, pipe.y, PIPE_WIDTH, PIPE_GAP);
    });
    ctx.drawImage(characterImage,player.x, player.y, player.width, player.height)
    if (scrollOffset >= canvas.width) {
        scrollOffset = 0;
    }
}


