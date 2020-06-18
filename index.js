var GROW_PIXELS = 5;
var GROW_MULTIPLIER_INCREASE = 0.2;
var MAX_WIDTH = 500; 
var INIT_GROW_MULTIPLIER = 1;
var LOOP_MILLISECONDS = 50;
// directions
var LTR = 0;
var RTL = 1;
var TTB = 2;
var BTT = 3;
var ENEMY_START_OFFSET = 50;
var ENEMY_MOVEMENT_SPEED = 5;
var ENEMY_START_PADDING = 0.02;
var INIT_TOTAL_ENEMIES = 4;
var MAX_TOTAL_ENEMIES = 14;
var ENEMY_WIDTH = 20;
var INCREASE_ENEMIES_LOOP = 400; // 100 = 5 seconds
var ENEMY_MOVEMENT_SPEED_VARIANCE = 2;
var DEFAULT_HEIGHT = 600;

var growMultiplier;
var score;
var loopInterval;
var growFunction;
var loopCount;
var enemyCount;
var buttonX = 0;
var buttonY = 0;

var scale = 1;

/**
 * Set the document scale.
 */
function setScale() {
    var height = window.innerHeight;
    scale = height/DEFAULT_HEIGHT;
    document.getElementById("game").style.transform = "scale("+scale+")";
}

/**
 * Load the menu to start the game.
 */
function loadMenu() {
    clearInterval(loopInterval);
    document.getElementById("game").innerHTML = "";
    document.getElementById("game").onmousemove = null;
    document.getElementById("game").onmouseup = null;
    document.getElementById("game").onmousedown = null;
    growMultiplier = INIT_GROW_MULTIPLIER;
    if( score ) {
        createScore();
        document.querySelector(".score").innerText = score;
    }
    score = 0;
    loopCount = 0;
    setScale();
    window.onresize = setScale;
    createHiScore();
    createMenu();
}

/**
 * Create the menu.
 */
function createMenu() {
    var menu = document.createElement("div");
    menu.classList.add("menu");

    var title = document.createElement("h1");
    title.innerText = "Duckiedoo";
    menu.appendChild(title);

    var instructions = document.createElement("div");
    instructions.classList.add("instructions");
    instructions.innerText = "Move your mouse to avoid the enemies. Press the mouse button to grow and get points faster. Release the mouse button to shrink and get points slower.";
    menu.appendChild(instructions);

    var button = document.createElement("button");
    button.innerText = "Play";
    button.onclick = function(e) {
        console.log(e);
        buttonX = e.pageX / scale;
        buttonY = e.pageY / scale;
        loadGame();
    }
    menu.appendChild(button);

    var credits = document.createElement("a");
    credits.innerHTML = "&copy; 2020 Game 103 (game103.net)";
    credits.setAttribute("href", "https://game103.net");
    credits.setAttribute("target", "_blank");
    menu.appendChild(credits);

    document.getElementById("game").appendChild(menu);
}

/**
 * Load the game.
 */
function loadGame() {
    document.getElementById("game").innerHTML = "";
    document.getElementById("game").onclick = null;
    createScore();
    createHiScore();
    createPlayer();
    for( var i=0; i<INIT_TOTAL_ENEMIES; i++ ) createEnemy();
    enemyCount = INIT_TOTAL_ENEMIES;
    loopInterval = setInterval( loopGame, LOOP_MILLISECONDS );
}

/**
 * Loop the game.
 */
function loopGame() {
    loopCount++;
    // update the score
    score += (growMultiplier - INIT_GROW_MULTIPLIER + GROW_MULTIPLIER_INCREASE)/GROW_MULTIPLIER_INCREASE;
    document.querySelector(".score").innerText = score;
    setHighScore();

    if( loopCount % INCREASE_ENEMIES_LOOP == 0 && enemyCount < MAX_TOTAL_ENEMIES) {
        createEnemy();
        enemyCount++;
    }

    if( growFunction ) growFunction();

    var enemies = document.querySelectorAll(".enemy");
    var duck = document.querySelector(".duck");
    var duckX = parseInt(duck.style.left.replace("px",""));
    var duckY = parseInt(duck.style.top.replace("px",""));
    var boundingRect = duck.getBoundingClientRect();
    var paddingX = boundingRect.width/scale/16;
    var paddingY = boundingRect.height/scale/16;
    var duckPoints = [ [ duckX + paddingX, duckY + paddingY ], [ duckX + boundingRect.width/scale/2 - paddingX, duckY + paddingY ], [ duckX + boundingRect.width/scale/2 - paddingX, duckY + boundingRect.height/scale/3 + paddingY ], [ duckX + boundingRect.width/scale - paddingX, duckY + boundingRect.height/scale/3 + paddingY ], [ duckX + boundingRect.width/scale - paddingX, duckY + boundingRect.height/scale - paddingY ], [ duckX + paddingX, duckY + boundingRect.height/scale - paddingY ]  ];
    var toCenter = ENEMY_WIDTH/2; // make sure this is width/2 as defined in the css
    for( var i=0; i<enemies.length; i++ ) {
        var direction = enemies[i].getAttribute("data-direction");
        var speed = parseInt(enemies[i].getAttribute("data-speed"));
        var replaceEnemy = function() {
            enemies[i].parentElement.removeChild(enemies[i]);
            createEnemy();
        }
        var enemyX = parseInt(enemies[i].style.left.replace("px",""));
        var enemyY = parseInt(enemies[i].style.top.replace("px",""));
        boundingRect = enemies[i].getBoundingClientRect();
        var enemyPoints = [ [ enemyX, enemyY ], [ enemyX + boundingRect.width/scale, enemyY ], [ enemyX, enemyY + boundingRect.height/scale ], [ enemyX + boundingRect.width/scale, enemyY + boundingRect.height/scale]  ];

        if( direction == LTR ) {
            enemies[i].style.left = (enemyX + speed).toString() + "px";
            if( enemyX > (document.getElementById("game").offsetWidth + ENEMY_START_OFFSET - toCenter) ) replaceEnemy();
        }
        else if( direction == RTL ) {
            enemies[i].style.left = (enemyX - speed).toString() + "px";
            if( enemyX < (-ENEMY_START_OFFSET - toCenter) ) replaceEnemy();
        }
        else if( direction == TTB ) {
            enemies[i].style.top = (enemyY + speed).toString() + "px";
            if( enemyY > (document.getElementById("game").offsetHeight + ENEMY_START_OFFSET - toCenter) ) replaceEnemy();
        }
        else if( direction == BTT ) {
            enemies[i].style.top = (enemyY - speed).toString() + "px";
            if( enemyY < (-ENEMY_START_OFFSET - toCenter) ) replaceEnemy();
        }

        var combosNeeded = [ "4,-4", "-4,4" ]; // inside
        var combosNeededAlt = [ "4,0", "-4,0" ]; // two points inside
        var combosNeededAlt2 = [ "0,4", "0,-4" ]; // two points inside
        for( var j=0; j<duckPoints.length; j++ ) {
            var hCount = 0;
            var vCount = 0;
            for( var k=0; k<enemyPoints.length; k++ ) {
                if( enemyPoints[k][0] > duckPoints[j][0] ) hCount ++;
                else hCount--;
                if( enemyPoints[k][1] > duckPoints[j][1] ) vCount ++;
                else vCount --;
            }
            if( !hCount && !vCount ) loadMenu();
            else {
                var combo = hCount + "," + vCount;
                if( combosNeeded.includes(combo) ) combosNeeded.splice( combosNeeded.indexOf(combo), 1 );
                if( combosNeededAlt.includes(combo) ) combosNeededAlt.splice( combosNeededAlt.indexOf(combo), 1 );
                if( combosNeededAlt2.includes(combo) ) combosNeededAlt2.splice( combosNeededAlt2.indexOf(combo), 1 );
            }
        }
        if( !combosNeeded.length || !combosNeededAlt.length || !combosNeededAlt2.length ) loadMenu();
    }

    
}

/**
 * Create the score.
 */
function createScore() {
    var scoreElement = document.createElement("div");
    scoreElement.classList.add("score");
    document.getElementById("game").appendChild(scoreElement);
}

/**
 * Create the Hi score.
 */
function createHiScore() {
    var scoreElement = document.createElement("div");
    scoreElement.classList.add("hi-score");
    document.getElementById("game").appendChild(scoreElement);
    setHighScore();
}

/**
 * Set the high score.
 */
function setHighScore() {
    if( !window.localStorage.duckiedooHighScore ) window.localStorage.duckiedooHighScore = 0;
    if( score > parseInt(window.localStorage.duckiedooHighScore) ) {
        window.localStorage.duckiedooHighScore = score;
    }
    document.querySelector(".hi-score").innerText = window.localStorage.duckiedooHighScore;
}


/**
 * Create an enemy.
 */
function createEnemy() {
    var enemyElement = document.createElement("img");
    enemyElement.setAttribute("src", "assets/enemy.png");
    enemyElement.classList.add("enemy");

    var direction = Math.floor(Math.random() * 4);
    var toCenter = ENEMY_WIDTH/2; // make sure this is width/2 as defined in the css
    if( direction == LTR || direction == RTL ) {
        enemyElement.style.top = (Math.random() * (document.getElementById("game").offsetHeight - document.getElementById("game").offsetHeight*ENEMY_START_PADDING*2) + document.getElementById("game").offsetHeight*ENEMY_START_PADDING - toCenter) + "px";
        if( direction == LTR ) {
            enemyElement.style.left = (-ENEMY_START_OFFSET - toCenter) + "px";
        }
        else {
            enemyElement.style.left = (document.getElementById("game").offsetWidth + ENEMY_START_OFFSET - toCenter) + "px";
        }
    }
    else {
        enemyElement.style.left = (Math.random() * (document.getElementById("game").offsetWidth - document.getElementById("game").offsetWidth*ENEMY_START_PADDING*2) + document.getElementById("game").offsetWidth*ENEMY_START_PADDING - toCenter) + "px";
        if( direction == BTT ) {
            enemyElement.style.top = (document.getElementById("game").offsetHeight + ENEMY_START_OFFSET - toCenter) + "px";
        }
        else {
            enemyElement.style.top = (-ENEMY_START_OFFSET - toCenter) + "px";
        }
    }

    enemyElement.setAttribute("data-direction", direction);
    var speed = ENEMY_MOVEMENT_SPEED + Math.random()*ENEMY_MOVEMENT_SPEED_VARIANCE*2 - ENEMY_MOVEMENT_SPEED_VARIANCE;
    enemyElement.setAttribute("data-speed", speed);

    document.getElementById("game").appendChild(enemyElement);
}

/**
 * Create the player.
 */
function createPlayer() {
    var duck = document.createElement("img");
    duck.setAttribute("src", "assets/duck.png");
    duck.classList.add("duck");
    document.getElementById("game").appendChild(duck);

    var originalBoundingRect = duck.getBoundingClientRect();
    //duck.style.width = originalboundingRect.width/scale + "px";
    //duck.style.height = originalboundingRect.height/scale + "px";

    var growInterval;
    var lastMouseX = buttonX;
    var lastMouseY = buttonY;

    // center the duck to the mouse cursor
    var centerDuck = function() {
        var boundingRect = duck.getBoundingClientRect();
        duck.style.left = (lastMouseX - boundingRect.width/scale/2) + "px";
        duck.style.top = (lastMouseY - boundingRect.height/scale/2) + "px";
    }

    // grow the duck
    var grow = function( pixels ) {
        var boundingRect = duck.getBoundingClientRect();
        var change = Math.round(pixels * growMultiplier);

        var newWidth = boundingRect.width/scale + change;
        if( newWidth > originalBoundingRect.width/scale && newWidth < MAX_WIDTH ) {
            duck.style.width = newWidth + "px";
            growMultiplier += pixels > 0 ? GROW_MULTIPLIER_INCREASE : -GROW_MULTIPLIER_INCREASE;
            centerDuck();
        }
        else {
            if( newWidth <= originalBoundingRect.width/scale) duck.style.width = originalBoundingRect.width/scale + "px";
            else duck.style.width = MAX_WIDTH + "px";
            centerDuck();
            growFunction = null;
        }
    }

    document.getElementById("game").onmousemove = function(e) {
        lastMouseX = e.offsetX;
        lastMouseY = e.offsetY;
        centerDuck();
    }
    document.getElementById("game").onmousedown = function(e) {
        clearInterval(growInterval);
        growFunction = function() {
            grow( GROW_PIXELS );
        };
    }
    document.getElementById("game").onmouseup = function(e) {
        clearInterval(growInterval);
        growFunction = function() {
            grow( -GROW_PIXELS );
        }
    }

    centerDuck();
    setTimeout(centerDuck, 10);
    return duck;
}

window.addEventListener('load', loadMenu);
