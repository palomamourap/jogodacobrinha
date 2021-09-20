/**
* @module Snake
* @class SNAKE
*/

var SNAKE = SNAKE || {};
window.SNAKE = SNAKE; 

/**
* @method addEventListener
* @param {Object} obj 
* @param {String} event 
* @param {Function} funct 
* @param {Boolean} evtCapturing
*/
SNAKE.addEventListener = (function() {
    if (window.addEventListener) {
        return function(obj, event, funct, evtCapturing) {
            obj.addEventListener(event, funct, evtCapturing);
        };
    } else if (window.attachEvent) {
        return function(obj, event, funct) {
            obj.attachEvent("on" + event, funct);
        };
    }
})();

/**
* @method removeEventListener
* @param {Object} obj
* @param {String} event
* @param {Function} funct
* @param {Boolean} evtCapturing 
*/

SNAKE.removeEventListener = (function() {
    if (window.removeEventListener) {
        return function(obj, event, funct, evtCapturing) {
            obj.removeEventListener(event, funct, evtCapturing);
        };
    } else if (window.detachEvent) {
        return function(obj, event, funct) {
            obj.detachEvent("on" + event, funct);
        };
    }
})();

/**
* @class Snake
* @constructor
* @namespace SNAKE
* @param {Object} config
*/
SNAKE.Snake = SNAKE.Snake || (function() {

    // -------------------------------------------------------------------------
    // Variáveis ​​e métodos estáticos privados
    // -------------------------------------------------------------------------

    var instanceNumber = 0;
    var blockPool = [];

    var SnakeBlock = function() {
        this.elm = null;
        this.elmStyle = null;
        this.row = -1;
        this.col = -1;
        this.xPos = -1000;
        this.yPos = -1000;
        this.next = null;
        this.prev = null;
    };

    function getNextHighestZIndex(myObj) {
        var highestIndex = 0,
            currentIndex = 0,
            ii;
        for (ii in myObj) {
            if (myObj[ii].elm.currentStyle){
                currentIndex = parseFloat(myObj[ii].elm.style["z-index"],10);
            }else if(window.getComputedStyle) {
                currentIndex = parseFloat(document.defaultView.getComputedStyle(myObj[ii].elm,null).getPropertyValue("z-index"),10);
            }
            if(!isNaN(currentIndex) && currentIndex > highestIndex){
                highestIndex = currentIndex;
            }
        }
        return(highestIndex+1);
    }

    return function(config) {

        if (!config||!config.playingBoard) {return;}
        if (localStorage.jsSnakeHighScore === undefined) localStorage.setItem('jsSnakeHighScore', 0);

        var me = this,
            playingBoard = config.playingBoard,
            myId = instanceNumber++,
            growthIncr = 5,
            lastMove = 1,
            preMove = -1,
            isFirstMove = true,
            isFirstGameMove = true,
            currentDirection = -1,
            columnShift = [0, 1, 0, -1],
            rowShift = [-1, 0, 1, 0],
            xPosShift = [],
            yPosShift = [],
            snakeSpeed = 80,
            isDead = false,
            isPaused = false;

            function setModeListener (mode, speed) {
                document.getElementById(mode).addEventListener('click', function () { snakeSpeed = speed; });
            }

            var modeDropdown = document.getElementById('selectMode');
            if ( modeDropdown ) {
                modeDropdown.addEventListener('change', function(evt) {
                    evt = evt || {};
                    var val = evt.target ? parseInt(evt.target.value) : 75;
                    
                    if (isNaN(val)) {
                        val = 75;
                    } else if (val < 25) {
                        val = 75
                    }

                    snakeSpeed = val;

                    setTimeout(function() {
                        document.getElementById('game-area').focus();
                    }, 10);
                });
            }

        me.snakeBody = {};
        me.snakeBody["b0"] = new SnakeBlock();
        me.snakeBody["b0"].row = config.startRow || 1;
        me.snakeBody["b0"].col = config.startCol || 1;
        me.snakeBody["b0"].xPos = me.snakeBody["b0"].row * playingBoard.getBlockWidth();
        me.snakeBody["b0"].yPos = me.snakeBody["b0"].col * playingBoard.getBlockHeight();
        me.snakeBody["b0"].elm = createSnakeElement();
        me.snakeBody["b0"].elmStyle = me.snakeBody["b0"].elm.style;
        playingBoard.getBoardContainer().appendChild( me.snakeBody["b0"].elm );
        me.snakeBody["b0"].elm.style.left = me.snakeBody["b0"].xPos + "px";
        me.snakeBody["b0"].elm.style.top = me.snakeBody["b0"].yPos + "px";
        me.snakeBody["b0"].next = me.snakeBody["b0"];
        me.snakeBody["b0"].prev = me.snakeBody["b0"];

        me.snakeLength = 1;
        me.snakeHead = me.snakeBody["b0"];
        me.snakeTail = me.snakeBody["b0"];
        me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'');
        me.snakeHead.elm.className += " snake-snakebody-alive";

        function createSnakeElement() {
            var tempNode = document.createElement("div");
            tempNode.className = "snake-snakebody-block";
            tempNode.style.left = "-1000px";
            tempNode.style.top = "-1000px";
            tempNode.style.width = playingBoard.getBlockWidth() + "px";
            tempNode.style.height = playingBoard.getBlockHeight() + "px";
            return tempNode;
        }

        function createBlocks(num) {
            var tempBlock;
            var tempNode = createSnakeElement();

            for (var ii = 1; ii < num; ii++){
                tempBlock = new SnakeBlock();
                tempBlock.elm = tempNode.cloneNode(true);
                tempBlock.elmStyle = tempBlock.elm.style;
                playingBoard.getBoardContainer().appendChild( tempBlock.elm );
                blockPool[blockPool.length] = tempBlock;
            }

            tempBlock = new SnakeBlock();
            tempBlock.elm = tempNode;
            playingBoard.getBoardContainer().appendChild( tempBlock.elm );
            blockPool[blockPool.length] = tempBlock;
        }

        function recordScore() {
            var highScore = localStorage.jsSnakeHighScore;
            if (me.snakeLength > highScore) {
                alert('Parabéns! Você bateu sua pontuação mais alta anterior, que era ' + highScore + '.');
                localStorage.setItem('jsSnakeHighScore', me.snakeLength);
            }
        }

        function handleEndCondition(handleFunc) {
            recordScore();
            me.snakeHead.elm.style.zIndex = getNextHighestZIndex(me.snakeBody);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-alive\b/, '')
            me.snakeHead.elm.className += " snake-snakebody-dead";

            isDead = true;
            handleFunc();
        }

        // ----- public methods -----

        me.setPaused = function(val) {
            isPaused = val;
        };
        me.getPaused = function() {
            return isPaused;
        };

        /**
        * @method handleArrowKeys
        * @param {Number} keyNum
        */

        me.handleArrowKeys = function(keyNum) {
            if (isDead || isPaused) {return;}

            var snakeLength = me.snakeLength;

            //console.log("lastmove="+lastMove);
            //console.log("dir="+keyNum);

            let directionFound = -1;

            switch (keyNum) {
                case 37:
                case 65:
                    directionFound = 3;
                    break;
                case 38:
                case 87:
                    directionFound = 0;
                    break;
                case 39:
                case 68:
                    directionFound = 1;
                    break;
                case 40:
                case 83:
                    directionFound = 2;
                    break;
            }
            if (currentDirection !== lastMove) 
            {
                preMove = directionFound;
            }
            if (Math.abs(directionFound - lastMove) !== 2 && isFirstMove || isFirstGameMove)
            {
                currentDirection = directionFound;
                isFirstMove = false;
                isFirstGameMove = false;
            }
        };

        /**
        * @method go
        */
        me.go = function() {

            var oldHead = me.snakeHead,
                newHead = me.snakeTail,
                grid = playingBoard.grid;

            if (isPaused === true) {
                setTimeout(function(){me.go();}, snakeSpeed);
                return;
            }

            me.snakeTail = newHead.prev;
            me.snakeHead = newHead;

            if ( grid[newHead.row] && grid[newHead.row][newHead.col] ) {
                grid[newHead.row][newHead.col] = 0;
            }

            if (currentDirection !== -1){
                lastMove = currentDirection;
                if (preMove !== -1)
                {
                    currentDirection = preMove;
                    preMove = -1;
                }
            }
            isFirstMove = true;

            newHead.col = oldHead.col + columnShift[lastMove];
            newHead.row = oldHead.row + rowShift[lastMove];
            newHead.xPos = oldHead.xPos + xPosShift[lastMove];
            newHead.yPos = oldHead.yPos + yPosShift[lastMove];

            if ( !newHead.elmStyle ) {
                newHead.elmStyle = newHead.elm.style;
            }

            newHead.elmStyle.left = newHead.xPos + "px";
            newHead.elmStyle.top = newHead.yPos + "px";


            if (grid[newHead.row][newHead.col] === 0) {
                grid[newHead.row][newHead.col] = 1;
                setTimeout(function(){me.go();}, snakeSpeed);
            } else if (grid[newHead.row][newHead.col] > 0) {
                me.handleDeath();
            } else if (grid[newHead.row][newHead.col] === playingBoard.getGridFoodValue()) {
                grid[newHead.row][newHead.col] = 1;
                if (!me.eatFood()) {
                    me.handleWin();
                    return;
                }
                setTimeout(function(){me.go();}, snakeSpeed);
            }
        };

        /**
        * @method eatFood
        * @return {bool}
        */
        me.eatFood = function() {
            if (blockPool.length <= growthIncr) {
                createBlocks(growthIncr*2);
            }
            var blocks = blockPool.splice(0, growthIncr);

            var ii = blocks.length,
                index,
                prevNode = me.snakeTail;
            while (ii--) {
                index = "b" + me.snakeLength++;
                me.snakeBody[index] = blocks[ii];
                me.snakeBody[index].prev = prevNode;
                me.snakeBody[index].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
                me.snakeBody[index].elm.className += " snake-snakebody-alive";
                prevNode.next = me.snakeBody[index];
                prevNode = me.snakeBody[index];
            }
            me.snakeTail = me.snakeBody[index];
            me.snakeTail.next = me.snakeHead;
            me.snakeHead.prev = me.snakeTail;

            if (!playingBoard.foodEaten()) {
                return false;
            }

            var selectDropDown = document.getElementById("selectMode");
            var selectedOption = selectDropDown.options[selectDropDown.selectedIndex];

            if(selectedOption.text.localeCompare("Rush") == 0)
            {
                snakeSpeed > 30 ? snakeSpeed -=5 : snakeSpeed = 30;
            }

            return true;
        };

        /**
        * @method handleDeath
        */
        me.handleDeath = function() {
            //Reset speed
            var selectedSpeed = document.getElementById("selectMode").value;
            snakeSpeed = parseInt(selectedSpeed);
            
            handleEndCondition(playingBoard.handleDeath);
        };

        /**
        * @method handleDeath
        */
        me.handleWin = function() {
            handleEndCondition(playingBoard.handleWin);
        };

        /**
        * @method rebirth
        */
        me.rebirth = function() {
            isDead = false;
            isFirstMove = true;
            isFirstGameMove = true;
            preMove = -1;
        };

        /**
        * @method reset
        */
        me.reset = function() {
            if (isDead === false) {return;}

            var blocks = [],
                curNode = me.snakeHead.next,
                nextNode;
            while (curNode !== me.snakeHead) {
                nextNode = curNode.next;
                curNode.prev = null;
                curNode.next = null;
                blocks.push(curNode);
                curNode = nextNode;
            }
            me.snakeHead.next = me.snakeHead;
            me.snakeHead.prev = me.snakeHead;
            me.snakeTail = me.snakeHead;
            me.snakeLength = 1;

            for (var ii = 0; ii < blocks.length; ii++) {
                blocks[ii].elm.style.left = "-1000px";
                blocks[ii].elm.style.top = "-1000px";
                blocks[ii].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
                blocks[ii].elm.className += " snake-snakebody-alive";
            }

            blockPool.concat(blocks);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
            me.snakeHead.elm.className += " snake-snakebody-alive";
            me.snakeHead.row = config.startRow || 1;
            me.snakeHead.col = config.startCol || 1;
            me.snakeHead.xPos = me.snakeHead.row * playingBoard.getBlockWidth();
            me.snakeHead.yPos = me.snakeHead.col * playingBoard.getBlockHeight();
            me.snakeHead.elm.style.left = me.snakeHead.xPos + "px";
            me.snakeHead.elm.style.top = me.snakeHead.yPos + "px";
        };

        // ---------------------------------------------------------------------
        // Inicializando
        // ---------------------------------------------------------------------
        createBlocks(growthIncr*2);
        xPosShift[0] = 0;
        xPosShift[1] = playingBoard.getBlockWidth();
        xPosShift[2] = 0;
        xPosShift[3] = -1 * playingBoard.getBlockWidth();

        yPosShift[0] = -1 * playingBoard.getBlockHeight();
        yPosShift[1] = 0;
        yPosShift[2] = playingBoard.getBlockHeight();
        yPosShift[3] = 0;
    };
})();

/**
* @class Food
* @constructor
* @namespace SNAKE
* @param {Object} config
*/

SNAKE.Food = SNAKE.Food || (function() {


    var instanceNumber = 0;

    function getRandomPosition(x, y){
        return Math.floor(Math.random()*(y+1-x)) + x;
    }

    return function(config) {

        if (!config||!config.playingBoard) {return;}

        var me = this;
        var playingBoard = config.playingBoard;
        var fRow, fColumn;
        var myId = instanceNumber++;

        var elmFood = document.createElement("div");
        elmFood.setAttribute("id", "snake-food-"+myId);
        elmFood.className = "snake-food-block";
        elmFood.style.width = playingBoard.getBlockWidth() + "px";
        elmFood.style.height = playingBoard.getBlockHeight() + "px";
        elmFood.style.left = "-1000px";
        elmFood.style.top = "-1000px";
        playingBoard.getBoardContainer().appendChild(elmFood);

        /**
        * @method getFoodElement
        * @return {DOM Element}
        */
        me.getFoodElement = function() {
            return elmFood;
        };

        /**
        * @method randomlyPlaceFood
        * @return {bool}
        */
        me.randomlyPlaceFood = function() {
            if (playingBoard.grid[fRow] && playingBoard.grid[fRow][fColumn] === playingBoard.getGridFoodValue()){
                playingBoard.grid[fRow][fColumn] = 0;
            }

            var row = 0, col = 0, numTries = 0;

            var maxRows = playingBoard.grid.length-1;
            var maxCols = playingBoard.grid[0].length-1;

            while (playingBoard.grid[row][col] !== 0){
                row = getRandomPosition(1, maxRows);
                col = getRandomPosition(1, maxCols);

                numTries++;
                if (numTries > 20000){
                    return false;
                }
            }

            playingBoard.grid[row][col] = playingBoard.getGridFoodValue();
            fRow = row;
            fColumn = col;
            elmFood.style.top = row * playingBoard.getBlockHeight() + "px";
            elmFood.style.left = col * playingBoard.getBlockWidth() + "px";
            return true;
        };
    };
})();

/**
* @class Board
* @constructor
* @namespace SNAKE
* @param {Object} config 
*/

SNAKE.Board = SNAKE.Board || (function() {


    var instanceNumber = 0;

    function getNextHighestZIndex(myObj) {
        var highestIndex = 0,
            currentIndex = 0,
            ii;
        for (ii in myObj) {
            if (myObj[ii].elm.currentStyle){
                currentIndex = parseFloat(myObj[ii].elm.style["z-index"],10);
            }else if(window.getComputedStyle) {
                currentIndex = parseFloat(document.defaultView.getComputedStyle(myObj[ii].elm,null).getPropertyValue("z-index"),10);
            }
            if(!isNaN(currentIndex) && currentIndex > highestIndex){
                highestIndex = currentIndex;
            }
        }
        return(highestIndex+1);
    }

    function getClientWidth(){
        var myWidth = 0;
        if( typeof window.innerWidth === "number" ) {
            myWidth = window.innerWidth;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            myWidth = document.documentElement.clientWidth;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            myWidth = document.body.clientWidth;
        }
        return myWidth;
    }

    function getClientHeight(){
        var myHeight = 0;
        if( typeof window.innerHeight === "number" ) {
            myHeight = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            myHeight = document.body.clientHeight;
        }
        return myHeight;
    }

    return function(inputConfig) {

        var me = this,
            myId = instanceNumber++,
            config = inputConfig || {},
            MAX_BOARD_COLS = 250,
            MAX_BOARD_ROWS = 250,
            blockWidth = 20,
            blockHeight = 20,
            GRID_FOOD_VALUE = -1,
            myFood,
            mySnake,
            boardState = 1,
            myKeyListener,
            isPaused = false,
            elmContainer, elmPlayingField, elmAboutPanel, elmLengthPanel, elmHighscorePanel, elmWelcome, elmTryAgain, elmWin, elmPauseScreen;

        me.grid = [];


        function createBoardElements() {
            elmPlayingField = document.createElement("div");
            elmPlayingField.setAttribute("id", "playingField");
            elmPlayingField.className = "snake-playing-field";

            SNAKE.addEventListener(elmPlayingField, "click", function() {
                elmContainer.focus();
            }, false);

            elmPauseScreen = document.createElement("div");
            elmPauseScreen.className = "snake-pause-screen";
            elmPauseScreen.innerHTML = "<div style='padding:10px;'>[Pausado]<p/>Pressione a [telca de espaço] para continuar.</div>";

            elmAboutPanel = document.createElement("div");
            elmAboutPanel.className = "snake-panel-component";
            elmAboutPanel.innerHTML = "Jogo desenvolvido por Paloma Moura";

            elmLengthPanel = document.createElement("div");
            elmLengthPanel.className = "snake-panel-component";
            elmLengthPanel.innerHTML = "Tamanho: 1";

            elmHighscorePanel = document.createElement("div");
            elmHighscorePanel.className = "snake-panel-component";
            elmHighscorePanel.innerHTML = "Recorde:" + (localStorage.jsSnakeHighScore || 0);

            elmWelcome = createWelcomeElement();
            elmTryAgain = createTryAgainElement();
            elmWin = createWinElement();

            SNAKE.addEventListener( elmContainer, "keyup", function(evt) {
                if (!evt) var evt = window.event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) {evt.stopPropagation();}
                if (evt.preventDefault) {evt.preventDefault();}
                return false;
            }, false);

            elmContainer.className = "snake-game-container";

            elmPauseScreen.style.zIndex = 10000;
            elmContainer.appendChild(elmPauseScreen);
            elmContainer.appendChild(elmPlayingField);
            elmContainer.appendChild(elmAboutPanel);
            elmContainer.appendChild(elmLengthPanel);
            elmContainer.appendChild(elmHighscorePanel);
            elmContainer.appendChild(elmWelcome);
            elmContainer.appendChild(elmTryAgain);
            elmContainer.appendChild(elmWin);

            mySnake = new SNAKE.Snake({playingBoard:me,startRow:2,startCol:2});
            myFood = new SNAKE.Food({playingBoard: me});

            elmWelcome.style.zIndex = 1000;
        }
        function maxBoardWidth() {
            return MAX_BOARD_COLS * me.getBlockWidth();
        }
        function maxBoardHeight() {
            return MAX_BOARD_ROWS * me.getBlockHeight();
        }

        function createWelcomeElement() {
             var tmpElm = document.createElement("div");
            tmpElm.id = "sbWelcome" + myId;
            tmpElm.className = "snake-welcome-dialog";

            var welcomeTxt = document.createElement("div");
            var fullScreenText = "";
            if (config.fullScreen) {
                fullScreenText = "No Windows, pressione F11 para jogar em modo de tela inteira.";
            }
            welcomeTxt.innerHTML = "Jogo da Cobrinha<p></p>Use as <strong>setas</strong> do seu teclado para jogar. " + fullScreenText + "<p></p>";
            var welcomeStart = document.createElement("button");
            welcomeStart.appendChild(document.createTextNode("Iniciar Jogo"));
            var loadGame = function() {
                SNAKE.removeEventListener(window, "keyup", kbShortcut, false);
                tmpElm.style.display = "none";
                me.setBoardState(1);
                me.getBoardContainer().focus();
            };

            var kbShortcut = function(evt) {
                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;
                if (keyNum === 32 || keyNum === 13) {
                    loadGame();
                }
            };
            SNAKE.addEventListener(window, "keyup", kbShortcut, false);
            SNAKE.addEventListener(welcomeStart, "click", loadGame, false);

            tmpElm.appendChild(welcomeTxt);
            tmpElm.appendChild(welcomeStart);
            return tmpElm;
        }

        function createGameEndElement(message, elmId, elmClassName) {
            var tmpElm = document.createElement("div");
            tmpElm.id = elmId + myId;
            tmpElm.className = elmClassName;

            var gameEndTxt = document.createElement("div");
            gameEndTxt.innerHTML = "Jogo da Cobrinha<p></p>" + message + "<p></p>";
            var gameEndStart = document.createElement("button");
            gameEndStart.appendChild(document.createTextNode("Jogar Novamente?"));

            var reloadGame = function () {
                tmpElm.style.display = "none";
                me.resetBoard();
                me.setBoardState(1);
                me.getBoardContainer().focus();
            };

            var kbGameEndShortcut = function (evt) {
                if (boardState !== 0 || tmpElm.style.display !== "block") { return; }
                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;
                if (keyNum === 32 || keyNum === 13) {
                    reloadGame();
                }
            };
            SNAKE.addEventListener(window, "keyup", kbGameEndShortcut, true);

            SNAKE.addEventListener(gameEndStart, "click", reloadGame, false);
            tmpElm.appendChild(gameEndTxt);
            tmpElm.appendChild(gameEndStart);
            return tmpElm;
        }

        function createTryAgainElement() {
            return createGameEndElement("Você Perdeu! :(", "sbTryAgain", "snake-try-again-dialog");
        }

        function createWinElement() {
            return createGameEndElement("Voce Ganhou! :D", "sbWin", "snake-win-dialog");
        }

        function handleEndCondition(elmDialog) {
            var index = Math.max(getNextHighestZIndex(mySnake.snakeBody), getNextHighestZIndex({ tmp: { elm: myFood.getFoodElement() } }));
            elmContainer.removeChild(elmDialog);
            elmContainer.appendChild(elmDialog);
            elmDialog.style.zIndex = index;
            elmDialog.style.display = "block";
            me.setBoardState(0);
        }


        me.setPaused = function(val) {
            isPaused = val;
            mySnake.setPaused(val);
            if (isPaused) {
                elmPauseScreen.style.display = "block";
            } else {
                elmPauseScreen.style.display = "none";
            }
        };
        me.getPaused = function() {
            return isPaused;
        };

        /**
        * @method resetBoard
        */
        me.resetBoard = function() {
            SNAKE.removeEventListener(elmContainer, "keydown", myKeyListener, false);
            mySnake.reset();
            elmLengthPanel.innerHTML = "Length: 1";
            me.setupPlayingField();
        };
        /**
        * Obtém o estado atual do tabuleiro de jogo. Existem 3 estados: 0 - A caixa de diálogo Bem-vindo ou Tentar novamente está presente. 1 - O usuário pressionou "Iniciar Jogo" na caixa de diálogo Bem-vindo ou Tentar Novamente, mas não pressionou uma tecla de seta para mover a cobra. 2 - O jogo está em andamento e a cobra está se movendo.
        * @method getBoardState
        * @return {Number} O estado do tabuleiro.
        */
        me.getBoardState = function() {
            return boardState;
        };
        /**
        * Obtém o estado atual do tabuleiro de jogo. Existem 3 estados: 0 - A caixa de diálogo Bem-vindo ou Tentar novamente está presente. 1 - O usuário pressionou "Iniciar Jogo" na caixa de diálogo Bem-vindo ou Tentar Novamente, mas não pressionou uma tecla de seta para mover a cobra. 2 - O jogo está em andamento e a cobra está se movendo.
        * @method setBoardState
        * @param {Number} state O estado do tabuleiro.
        */
        me.setBoardState = function(state) {
            boardState = state;
        };
        /**
        * @method getGridFoodValue
        * @return {Number} Um número que representa a comida em uma representação numérica do tabuleiro de jogo.
        */
        me.getGridFoodValue = function() {
            return GRID_FOOD_VALUE;
        };
        /**
        * @method getPlayingFieldElement
        * @return {DOM Element} O div que representa o campo de jogo (é onde a cobra pode se mover).
        */
        me.getPlayingFieldElement = function() {
            return elmPlayingField;
        };
        /**
        * @method setBoardContainer
        * @param {DOM Element or String} myContainer Define o elemento do contêiner para o jogo.
        */
        me.setBoardContainer = function(myContainer) {
            if (typeof myContainer === "string") {
                myContainer = document.getElementById(myContainer);
            }
            if (myContainer === elmContainer) {return;}
            elmContainer = myContainer;
            elmPlayingField = null;

            me.setupPlayingField();
        };
        /**
        * @method getBoardContainer
        * @return {DOM Element}
        */
        me.getBoardContainer = function() {
            return elmContainer;
        };
        /**
        * @method getBlockWidth
        * @return {Number}
        */
        me.getBlockWidth = function() {
            return blockWidth;
        };
        /**
        * @method getBlockHeight
        * @return {Number}
        */
        me.getBlockHeight = function() {
            return blockHeight;
        };
        /**
        * Define o campo de jogo.
        * @method setupPlayingField
        */
        me.setupPlayingField = function () {

            if (!elmPlayingField) {createBoardElements();} // cria o campo de jogo

            // calcular a largura do nosso contêiner de jogo
            var cWidth, cHeight;
            var cTop, cLeft;
            if (config.fullScreen === true) {
                cTop = 0;
                cLeft = 0;
                cWidth = getClientWidth()-20;
                cHeight = getClientHeight()-20;
                
            } else {
                cTop = config.top;
                cLeft = config.left;
                cWidth = config.width;
                cHeight = config.height;
            }

            // definir as dimensões do tabuleiro e do campo de jogo
            var wEdgeSpace = me.getBlockWidth()*2 + (cWidth % me.getBlockWidth());
            var fWidth = Math.min(maxBoardWidth()-wEdgeSpace,cWidth-wEdgeSpace);
            var hEdgeSpace = me.getBlockHeight()*3 + (cHeight % me.getBlockHeight());
            var fHeight = Math.min(maxBoardHeight()-hEdgeSpace,cHeight-hEdgeSpace);

            elmContainer.style.left = cLeft + "px";
            elmContainer.style.top = cTop + "px";
            elmContainer.style.width = cWidth + "px";
            elmContainer.style.height = cHeight + "px";
            elmPlayingField.style.left = me.getBlockWidth() + "px";
            elmPlayingField.style.top  = me.getBlockHeight() + "px";
            elmPlayingField.style.width = fWidth + "px";
            elmPlayingField.style.height = fHeight + "px";

            // a matemática para isso precisará mudar dependendo do tamanho da fonte, preenchimento, etc.
            // assumindo altura de 14 (tamanho da fonte) + 8 (preenchimento)
            var bottomPanelHeight = hEdgeSpace - me.getBlockHeight();
            var pLabelTop = me.getBlockHeight() + fHeight + Math.round((bottomPanelHeight - 30)/2) + "px";

            elmAboutPanel.style.top = pLabelTop;
            elmAboutPanel.style.width = "450px";
            elmAboutPanel.style.left = Math.round(cWidth/2) - Math.round(450/2) + "px";

            elmLengthPanel.style.top = pLabelTop;
            elmLengthPanel.style.left = 30 + "px";

            elmHighscorePanel.style.top = pLabelTop;
            elmHighscorePanel.style.left = cWidth - 140 + "px";

            // se a largura for muito estreita, esconda o painel sobre
            if (cWidth < 700) {
                elmAboutPanel.style.display = "none";
            } else {
                elmAboutPanel.style.display = "block";
            }

            me.grid = [];
            var numBoardCols = fWidth / me.getBlockWidth() + 2;
            var numBoardRows = fHeight / me.getBlockHeight() + 2;

            for (var row = 0; row < numBoardRows; row++) {
                me.grid[row] = [];
                for (var col = 0; col < numBoardCols; col++) {
                    if (col === 0 || row === 0 || col === (numBoardCols-1) || row === (numBoardRows-1)) {
                        me.grid[row][col] = 1;
                    } else {
                        me.grid[row][col] = 0;
                    }
                }
            }

            myFood.randomlyPlaceFood();

            myKeyListener = function(evt) {
                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;

                if (me.getBoardState() === 1) {
                    if ( !(keyNum >= 37 && keyNum <= 40) && !(keyNum === 87 || keyNum === 65 || keyNum === 83 || keyNum === 68)) {return;} // if not an arrow key, leave

                    // Isso remove o ouvinte adicionado na linha #listenerX
                    SNAKE.removeEventListener(elmContainer, "keydown", myKeyListener, false);

                    myKeyListener = function(evt) {
                        if (!evt) var evt = window.event;
                        var keyNum = (evt.which) ? evt.which : evt.keyCode;

                        //console.log(keyNum);
                        if (keyNum === 32) {
							if(me.getBoardState()!=0)
                                me.setPaused(!me.getPaused());
                        }

                        mySnake.handleArrowKeys(keyNum);

                        evt.cancelBubble = true;
                        if (evt.stopPropagation) {evt.stopPropagation();}
                        if (evt.preventDefault) {evt.preventDefault();}
                        return false;
                    };
                    SNAKE.addEventListener( elmContainer, "keydown", myKeyListener, false);

                    mySnake.rebirth();
                    mySnake.handleArrowKeys(keyNum);
                    me.setBoardState(2); // inicia o jogo!
                    mySnake.go();
                }

                evt.cancelBubble = true;
                if (evt.stopPropagation) {evt.stopPropagation();}
                if (evt.preventDefault) {evt.preventDefault();}
                return false;
            };

            // Pesquise #listenerX para ver onde foi removido
            SNAKE.addEventListener( elmContainer, "keydown", myKeyListener, false);
        };

        /**
        * Este método é chamado quando a cobra comeu algum alimento.
        * @method foodEaten
        * @return {bool} Se um novo alimento foi capaz de gerar (verdadeiro)
        *   ou não (falso) depois que a cobra come comida.
        */
        me.foodEaten = function() {
            elmLengthPanel.innerHTML = "Length: " + mySnake.snakeLength;
            if (mySnake.snakeLength > localStorage.jsSnakeHighScore)
            {
                localStorage.setItem("jsSnakeHighScore", mySnake.snakeLength);
                elmHighscorePanel.innerHTML = "Highscore: " + localStorage.jsSnakeHighScore;
            }
            if (!myFood.randomlyPlaceFood()) {
                return false;
            }
            return true;
        };

        /**
        * Este método é chamado quando a cobra morre.
        * @method handleDeath
        */
        me.handleDeath = function() {
            handleEndCondition(elmTryAgain);
        };

        /**
        * Este método é chamado quando a cobra vence.
        * @method handleWin
        */
        me.handleWin = function () {
            handleEndCondition(elmWin);
        };

        // ---------------------------------------------------------------------
        // Inicializando
        // ---------------------------------------------------------------------

        config.fullScreen = (typeof config.fullScreen === "undefined") ? false : config.fullScreen;
        config.top = (typeof config.top === "undefined") ? 0 : config.top;
        config.left = (typeof config.left === "undefined") ? 0 : config.left;
        config.width = (typeof config.width === "undefined") ? 400 : config.width;
        config.height = (typeof config.height === "undefined") ? 400 : config.height;

        if (config.fullScreen) {
            SNAKE.addEventListener(window,"resize", function() {
                me.setupPlayingField();
            }, false);
        }

        me.setBoardState(0);

        if (config.boardContainer) {
            me.setBoardContainer(config.boardContainer);
        }

    }; // fim da função de retorno
})();  