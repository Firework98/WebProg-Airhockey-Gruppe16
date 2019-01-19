"use strict";

//Variables needed for DOM Manipulation and Graphics
let canv;
let gC;
let inputForm;
let inputField;
let lvlPicker;
let bRect;
let scoreBoard;
//Offset of the Canvas. Needed To Calculate Mouse Position
let xOffSet;
let yOffSet;
//Game objects
let cPsh;
let pPush;
let gDsk;
let computer;
let player;
let computerGoal;
let playerGoal;
//Position where the mouse should be moved in the next Frame
let newX;
let newY;

//Is the game still running (Not paused)
let gameRunning;
//Is the game won
let gameFinish = false;

//Game Variables set by JSON
//Which Difficulty
let gLvl;
//Until Which Score should be played
let targetScore;
//How heavy should the disk velocity decay (Multiplicated)
let decay;
//How much should the disk velocity be reduced when it collides with the border
let reduction;
//Width of the field
let width;
let height;
//Maximum Velocity
let cap;
//How far should the collision radius be extended. Makes collision Smoother
let epsiloncoll;
//Maximum Velocity of the Computer
let computerPace;

//How far the disk gets outset of the Pusher whilst moving the pusher
const OUTSET = 0.5;
//set lvl-variable; hide lvl-picker; start game setup
function gameStart(lvl){
    gLvl = lvl-1;
    console.log(gLvl);
    lvlPicker = document.getElementById("lvlPicker");
    lvlPicker.style.display = "none";
    scoreBoard = document.getElementById("scoreWrapper");
    scoreBoard.style.display = "block";
    getGameData();
}
function getGameData() {
    let request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:8080/Airhockey/WebApp/Ressources/gameSettings.json' + "?"+(new Date().getTime()));
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        const gameSettings = request.response;
        targetScore = gameSettings.spieldaten[gLvl].TARGETSCORE;
        decay = gameSettings.spieldaten[gLvl].DECAY;
        reduction = gameSettings.spieldaten[gLvl].REDUCTION;
        width = gameSettings.spieldaten[gLvl].WIDTH;
        height = gameSettings.spieldaten[gLvl].HEIGHT;
        cap = gameSettings.spieldaten[gLvl].CAP;
        epsiloncoll = gameSettings.spieldaten[gLvl].EPSILONCOLL;
        computerPace = gameSettings.spieldaten[gLvl].COMPUTERPACE;
        console.log(computerPace);
        init();
    };
}

class Vec2D {
    /**
     * Constructs a new Vector
     * @param x - x Coordinate
     * @param y - y Coordinate
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Add an vector to this vector
     * @param vec - Vec2D to add
     * @returns {Vec2D}
     */
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    /**
     * Multiply this vector with a scalar
     * @param scalar - Scalar to multiplicate with
     * @returns {Vec2D}
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Calculate the length of a Vector
     * @returns {number} - Length of the Vector
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    /**
     * Normalize this Vector
     * @returns {Vec2D} - Reference to this Vector
     */
    normalize(){
        let temp = this.length();
        this.x /= temp;
        this.y /= temp;
        return this;
    }

    /**
     * Clone this vector
     * @returns {Vec2D} - New Identical Vector
     */
    clone(){
        return (new Vec2D(this.x,this.y));
    }
}
class Disk{

    constructor (radius,x,y){
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.velo = new Vec2D(5,5);
        this.col = "black";
    }

    /**
     * Renders the Disk
     */
    render(){
        gC.fillStyle = 'rgb(53, 53, 53)';
        gC.beginPath();
        //Draw outer Circle
        gC.arc(this.x,this.y,this.radius,0, 2*Math.PI);
        gC.fill();

        gC.fillStyle = this.col;
        gC.beginPath();
        //Draw inner Circle
        gC.arc(this.x,this.y,this.radius-5,0, 2*Math.PI);
        gC.fill();
    }
    move(){
        //Calculate the movement in smaller steps to compute a smoother Collision
        let steps = 100;
        //Starting Position of the Disk
        let oldPos = new Vec2D(this.x,this.y);
        let moveVect = this.velo;
        //Length of each Step of the iteration
        let steplength = moveVect.length()/steps;
        //Variable to track if it collided with a pusher
        let pushColl = false;
        let formerPos = oldPos;
        //If a Collision is detected or the disk was moved successfully to the new Position terminate
        for (let i = 0; i <= steps && !pushColl; i++) {
            //Calculate an intermediate Position offsetted from the last Position
            let intermediatePos = oldPos.clone().add(moveVect.clone().normalize().multiply(steplength * i));
            //Define a ghost Disk and check Collision with it. Not rendered
            let ghostDisk = new Disk(this.radius,intermediatePos.x,intermediatePos.y);
            if(ghostDisk.checkCollisionWithPusher(pPush)) {
                this.computeCollisionWithPusher(pPush);
                pushColl = true;
            } else{
                //Check collision with the computer Pusher
                if(ghostDisk.checkCollisionWithPusher(cPsh)) {
                    this.computeCollisionWithPusher(cPsh);
                    pushColl = true;
                } else {
                    //If there is no Collision the Disk can safely be moved to the intermediate Position
                    formerPos = intermediatePos;
                }
            }
        }
        //Update the Position and Velocity
        this.x = formerPos.x;
        this.y = formerPos.y;
        this.velo.x *= decay;
        this.velo.y *= decay;
        //Check if it collides with the border
        this.checkCollisionWithBorder();
        //After computing the collision with the border. Collsions with the Pusher have to be checked again
        if (this.checkCollisionWithPusher(pPush)) {
            this.computeCollisionWithPusher(pPush);
        }
        if(this.checkCollisionWithPusher(cPsh)) {
            this.computeCollisionWithPusher(cPsh);
        }
    }

    /**
     * Resets the Disk after a goal was scored
     * @param goal
     */
    resetAfterGoal(goal){
        //Render the disk
        this.render();
        //Check whether the game is not finished
        if (computer.points < targetScore && player.points < targetScore){
            //Reset the position to the middle of the field
            this.x = width / 2;
            this.y = height /2;
            this.velo.x = 0;
            //Change the velocity so that it moves towards the side of the field which
            //did not score the goal
            this.velo.y = (goal.y === 0 ? -2 : 2);
        }
    }

    /**
     * Check whether the disk collides with the boarder
     * @returns {boolean}
     */
    checkCollisionWithBorder(){
        let ret = false;
        //Need to check for goals because of y-Collision
        let checkGoals = false;
        //Up or down
        if(this.y + this.radius <= height && this.y - this.radius >= 0){
            checkGoals = false;
        }
        //Down
        if (this.y + this.radius > height){
            ret = true;
            this.y = height - this.radius;
            this.velo.y = -(this.velo.y * reduction);
            checkGoals = true;
        }
        //Up
        if (this.y - this.radius < 0){
            ret = true;
            this.y = 0 + this.radius;
            this.velo.y = -(this.velo.y * reduction);
            checkGoals = true;
        }
        //Check collision with goals
        if(checkGoals && (this.isInGoalSpace(computerGoal) || this.isInGoalSpace(playerGoal))){
            //Calculate distance to Goals
            let distToCGoal = Math.abs(computerGoal.y-this.y);
            let distToPGoal = Math.abs(playerGoal.y-this.y);
            //If it is in one of the goal Spaces. Increase the points and reset the goal
            if (distToCGoal <= this.radius && this.isInGoalSpace(computerGoal)){
                computerGoal.player.points++;
                this.resetAfterGoal(computerGoal);
            } else{
                if (distToPGoal <= this.radius && this.isInGoalSpace(playerGoal)){
                    playerGoal.player.points++;
                    this.resetAfterGoal(playerGoal);
                }
            }
            //Set the Score displays
            document.getElementById("playerScore").innerText = player.points;
            document.getElementById("computerScore").innerText = computer.points;

        } else{
            //Right
            if (this.x + this.radius > width){
                ret = true;
                this.x = width - this.radius;
                this.velo.x = -(this.velo.x * reduction)
            }
            //Left
            if (this.x - this.radius < 0){
                ret = true;
                this.x = this.radius;
                this.velo.x = -(this.velo.x * reduction)
            }
        }
        return ret;
    }

    /**
     * Check whether the disk in in the given goal
     * @param goal - Goal to be checked
     * @returns {boolean}
     */
    isInGoalSpace(goal){
        return this.x > goal.xLeft && this.x < goal.xRight;
    }

    /**
     * Checks whether the disk collides with the given pusher
     * @param pusher
     * @returns {boolean}
     */
    checkCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        return distVec.length() < pusher.radius + this.radius + epsiloncoll;
    }

    /**
     * Compute a Collision with the given Pusher. Not physically realistic but
     * appropriate for the game
     * @param pusher
     */
    computeCollisionWithPusher(pusher){
        //Calculate a Vector pointing from the pusher to Disk
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        let distDir = distVec.clone();
        //Normalized direction to the Disk
        distDir.normalize();
        let pOldVec = pusher.getLast();
        //Calculate an Velocity Vector from the last position of the Pusher and the actual position
        let pVelo = new Vec2D(pOldVec.x-pusher.x, pOldVec.y-pusher.y);
        //Calculate an Multiplication Factor from this Velocity Vector
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() +  0.4 * this.velo.length() * this.velo.length());
        //Cap the multFactor
        multFactor = (multFactor > cap ? cap : multFactor);
        //Multiply the normalized DirectionalVector with this Factor and set the velocity to this Vector
        distDir.multiply(multFactor);
        this.velo = distDir;
    }

    /**
     * Creates a Disk with the same radius and position
     * @returns {Disk}
     */
    clone(){
        return new Disk(this.radius,this.x,this.y);
    }

    /**
     * Check whether the disk can be moved out of the given Pusher and move the Disk out if possible
     * @param pusher
     * @returns {boolean}
     */
    moveAbleOutOfPusher(pusher) {
        //Calculate the direction the Disk has to be moved out
        let distVec = new Vec2D(this.x - pusher.x, this.y - pusher.y);
        let distDir = distVec.clone();
        distDir.normalize();
        //Calculate the distance it has to be moved out
        let requiredDist = this.radius + pusher.radius + OUTSET;
        distDir.multiply(requiredDist);
        //Create a temporary Disk at this Position
        let tempDisk = this.clone();
        tempDisk.x = pusher.x + distDir.x;
        tempDisk.y = pusher.y + distDir.y;
        //If this Disk would not collide with the boarder it can be moved out
        if (!tempDisk.checkCollisionWithBorder()) {
            //Move the disk out of the pusher
            this.x = tempDisk.x;
            this.y = tempDisk.y;
            return true;
        }
        return false;
    }


}

/**
 * Class to encapsulate the player points
 */
class Player{
    constructor(){
        this.points = 0;
    }
}

/**
 * Class to represent the goals
 */
class Goal{
    constructor(player,xLeft,xRight,y){
        this.player = player;
        this.xLeft = xLeft;
        this.xRight = xRight;
        this.y = y;
    }

    /**
     * Renders the goals
     */
    render(){
        gC.beginPath();
        gC.strokeStyle = "#688488";
        gC.lineWidth = 10;
        gC.moveTo(this.xLeft, this.y);
        gC.lineTo(this.xRight, this.y);
        gC.stroke();
    }

}

/**
 * Class to represent a general Pusher
 */
class Pusher{
    constructor (radius,x,y, upperBoarder, lowerBoarder){
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.color = "red";
        //Initialize the old Position with the actual position
        this.oldPos = new Vec2D(this.x,this.y);
        //Limits in which the Pusher can be moved
        this.upperBoarder = upperBoarder;
        this.lowerBoarder = lowerBoarder;
    }

    /**
     * Returns the former Position of the Pusher
     * @returns {Vec2D}
     */
    getLast(){
        return this.oldPos;
    }

    /**
     * Renders the Pusher
     */
    render() {
        //Outer Circle
        gC.fillStyle = this.color;
        gC.beginPath();
        gC.arc(this.x,this.y,this.radius,0, 2* Math.PI);
        gC.fill();

        //Smaller outer Circle
        gC.fillStyle = 'rgb(155,0,0)';
        gC.beginPath();

        gC.arc(this.x, this.y, this.radius-5,0,2*Math.PI);
        gC.fill();

        //Small inner Circle
        gC.fillStyle = this.color;
        gC.beginPath();

        gC.arc(this.x, this.y, 20,0,2*Math.PI);
        gC.fill();
    }

    /**
     * Static Helper Function to Compute the Pusher-side Collision with the Disk
     * @param disk - Disk which should be checked
     * @param oldPos - Position at which the Pusher was before starting the move
     * @param intermediatePos - Position of a temporary Pusher at which the collision should be calculated
     * @param newPos - Position to which the Pusher should finally be moved
     */
    static computeCollisionWithDisk(disk, oldPos, intermediatePos, newPos){
        //Compute the direction from the Intermediate Pos to the Disk
        let distVec = new Vec2D(disk.x-intermediatePos.x,disk.y-intermediatePos.y);
        let distDir = distVec.clone();
        distDir.normalize();
        //Compute the Velocity from the new and oldPos Vector
        let pVelo = new Vec2D(newPos.x-oldPos.x, newPos.y-oldPos.y);
        //Calculate the Multiplication Factor
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() + 0.3 * disk.velo.length() * disk.velo.length());
        multFactor = (multFactor > cap ? cap : multFactor);
        //Set the velocity of the Disk
        distDir.multiply(multFactor);
        disk.velo = distDir;
    }

    /**
     * Move the Pusher to the given Position
     * @param x
     * @param y
     */
    moveTo(x,y){
        //Move the Pusher
        let steps = 100;
        //Compute the actual new Position if there is an border collision
        let newPos = this.computeBorderCollision(x,y);
        let oldPos = new Vec2D(this.x,this.y);
        //Calculate the Velocity Vector representing the move
        let moveVect = new Vec2D(newPos.x - oldPos.x, newPos.y - oldPos.y);
        let steplength = moveVect.length()/steps;
        //Did the Pusher Collide with the disk and couldn't the disk be moved out
        let diskColl = false;
        let formerPos = oldPos;
        //If the steplength is too short the Pusher effectively was not moved. So no computation has to be done
        if(steplength > 0.001){
            for (let i = 1; i <= steps && !diskColl; i++) {
                let intermediatePos = oldPos.clone().add(moveVect.clone().normalize().multiply(steplength * i));
                //If the intermediatePos collides with the border it has to be changed so that it doesnt exceed bounds
                if (this.checkBorderCollision(intermediatePos.x,intermediatePos.y)){
                    intermediatePos = this.computeBorderCollision(intermediatePos.x,intermediatePos.y);
                }
                //Create a ghostPusher, to use this for collision computation
                let ghostPusher = new Pusher(this.radius,intermediatePos.x,intermediatePos.y,this.upperBoarder,this.lowerBoarder);
                if (gDsk.checkCollisionWithPusher(ghostPusher)){
                    //If the Disk couldn't be moved out of the Pusher the Pusher cant be moved this way. Therefore terminate
                    if( ! gDsk.moveAbleOutOfPusher(ghostPusher)){
                        Pusher.computeCollisionWithDisk(gDsk,oldPos,intermediatePos,newPos);
                        diskColl = true;
                        //Reset the position to the old Position
                        newPos = formerPos.clone();
                    } else{
                        //Compute the new velocity of the Disk accordingly
                        Pusher.computeCollisionWithDisk(gDsk,oldPos,intermediatePos,newPos);
                        newPos = intermediatePos.clone();
                    }
                } else{
                    //If there is no Collision the Pusher can be moved this way
                    newPos = intermediatePos.clone();
                }
                //Set the former Pos to the intermediate Pos
                formerPos = intermediatePos.clone();
            }
            //Move the Pusher
            this.setPos(newPos.x, newPos.y);
        } else {
            //Do not move the Pusher if the mouse was not moved
            this.setPos(this.x,this.y);
        }
    }

    /**
     * Set the position of the Pusher to the given Coordinates
     * @param x
     * @param y
     */
    setPos(x,y){
        this.oldPos = new Vec2D(x,y);
        this.x = x;
        this.y = y;
    }

    /**
     * Check whether the given Position exceeds Bounds
     * @param newX - xCoordinate of the position
     * @param newY - yCoordinate of the position
     * @returns {boolean}
     */
    checkBorderCollision(newX,newY){
        return newX + this.radius > width || newX - this.radius < 0 || newY + this.radius > this.lowerBoarder || newY - this.radius < this.upperBoarder;
    }

    /**
     * Changes a position so that it no longer exceeds bounds
     * @param newX
     * @param newY
     * @returns {Vec2D} - Position which does not exceed Bounds
     */
    computeBorderCollision(newX,newY){
        if (newX + this.radius > width){
            newX = width - this.radius;
        }
        if (newX - this.radius < 0){
            newX = this.radius;
        }
        if (newY + this.radius > this.lowerBoarder) {
            newY = this.lowerBoarder - this.radius;
        }
        if (newY - this.radius < this.upperBoarder){
             newY = this.upperBoarder + this.radius;
        }
        return new Vec2D(newX,newY);
    }
}

/**
 * Class to represent a computer controlled Pusher
 */
class ComputerPusher extends Pusher{

    constructor(radius, x, y, upperBoarder, lowerBoarder, maxVelocity,groundLine) {
        super(radius, x, y, upperBoarder, lowerBoarder);
        //Maximum velocity of the Pusher
        this.maxVelocity = maxVelocity;
        //Y Coordinate at which the Pusher should wait and reset
        this.groundLine = groundLine;
        //How many Frames the Disk did not move while it was on the side of the Computer Pusher. Used to reset if needed
        this.notMovedFrames = 0;
        //Should the Pusher reset
        this.reset = false;
    }

    move(){
        //Check whether the Pusher should reset
        if (!this.reset){
            //Calculate the Position to which the Pusher should move to hit the disk
            let horizontalDelta = gDsk.x - this.x;
            let verticalDelta = 40; //Default Value
            //Check whether the disk is on the side of the Computer pusher.
            let diskInField = gDsk.y > this.upperBoarder && gDsk.y < this.lowerBoarder;
            if (gDsk.y < this.lowerBoarder && gDsk.y > this.groundLine - 1){
                //If so the vertically move towards the disk
                verticalDelta = gDsk.y - this.y;
            } else {
                //Otherwise move towards the groundline
                verticalDelta = this.groundLine - this.y ;
            }
            let oldPos = new Vec2D(this.x,this.y);
            //Move to the calculated Position if possible. If it is to far away move in the direction of the position with maximum Velocity
            this.moveTo(this.x + (Math.abs(horizontalDelta) > this.maxVelocity ? Math.sign(horizontalDelta)*this.maxVelocity : horizontalDelta),
                this.y + (Math.abs(verticalDelta) > this.maxVelocity? Math.sign(verticalDelta)*this.maxVelocity: verticalDelta));
            let newPos = new Vec2D(this.x,this.y);
            //Check whether the Pusher didn't move since the last Frame
            if (newPos.add(oldPos.multiply(-1)).length() < 0.01){
                //Increase the number of not moved Frames
                this.notMovedFrames++;
                //If it exceeds 20 and the disk is on the side of computer
                if(this.notMovedFrames > 20 && diskInField){
                    //The Pusher should reset to the center of the groundline because it probably
                    //pushes the Disk into a corner
                    this.reset = true;
                    //Give the Disk an velocity towards the center of the field. To prevent the computer to loop
                    let veloVec = new Vec2D(width/2 - gDsk.x, height/2 - gDsk.y);
                    veloVec.normalize();
                    veloVec.multiply(30);
                    gDsk.velo.x = veloVec.x;
                    gDsk.velo.y = veloVec.y;
                }
            } else {
                //Else reset the not moved frames
                this.notMovedFrames = 0;
            }
        } else{
            //Reset does not have to be extremely accurate 0.1 above or below ground line is enoug
            let eps = 0.1;
            let origin = width / 2;
            //Check whether the Pusher already is close enough to the reset point
            if (Math.abs(this.y-this.groundLine)<eps && Math.abs(this.x-origin)<eps){
                //If so then it successfully resetted
                this.reset = false;
            } else{
                //Calculate the Delta it has to be moved
                let verticalDelta = this.groundLine - this.y;
                let horizontalDelta = origin - this.x;
                //Move the Pusher to the Position if it is in range. Velocity multiplied by 3 to allow faster reset
                this.moveTo(this.x + (Math.abs(horizontalDelta) > this.maxVelocity * 3 ? Math.sign(horizontalDelta)*this.maxVelocity * 3 : horizontalDelta),
                    this.y + (Math.abs(verticalDelta) > this.maxVelocity ? Math.sign(verticalDelta)*this.maxVelocity : verticalDelta));
            }
        }


    }
}

function addEntry() {
    let localHighscoreArr = getLocalHighscore();
    let score = player.points + " : " + computer.points;
    let username = inputField.value;
    if (username !== '' && score !== '') {
        const newEntry = {'Score': score, 'Username': username};
        let i;
        if (localHighscoreArr.length !== 0) {
            for (i = 0; i < localHighscoreArr.length; i++) {
                if (parseInt(score) >= parseInt(localHighscoreArr[i].Score)) {
                    localHighscoreArr.splice(i, 0, newEntry);
                    break;
                } else if ((i) === localHighscoreArr.length-1) {
                    localHighscoreArr.push(newEntry);
                    break;
                }
            }
        } else {
            localHighscoreArr.push(newEntry);
        }
        localStorage.setItem('localHighscore', JSON.stringify(localHighscoreArr));
    } else {
        alert('Please insert!');
    }
}
function getLocalHighscore() {
    let localHighscoreArr = localStorage.getItem('localHighscore');
    localHighscoreArr = localHighscoreArr ? JSON.parse(localHighscoreArr) : [];
    return localHighscoreArr;
}

function init(){
    canv = document.getElementById("canv");
    canv.style.cursor = "pointer";
    if(canv != null){
        gC = canv.getContext("2d");
        bRect = canv.getBoundingClientRect();
        xOffSet = bRect.left;
        yOffSet = bRect.top;
        document.addEventListener("mousemove",function (e){
            newX = e.pageX - xOffSet;
            newY = e.pageY - yOffSet;
        });
    }
    let psh = new Pusher(40,200,height-40, height/2 + 30, height);
    cPsh = new ComputerPusher(40,200,40, 0, height / 2 - 30 , computerPace, 40);
    let dsk = new Disk(30,200,200);
    let third =  width / 3;

    player = new Player("Player 1", psh);
    computer = new Player("Computer", cPsh);
    computerGoal = new Goal(player,third,third * 2,0);
    playerGoal = new Goal(computer,third ,third *2,height);
    pPush = psh;
    gDsk = dsk;
    window.requestAnimationFrame(draw);
    document.addEventListener("keypress", handleKeyPress );
    inputForm = document.getElementById("inputForm");
    inputField = document.getElementById("username");
}

function handleKeyPress(e) {
    if(e.key === "Escape" && !gameFinish){
        gamePause();
    }
}

function gamePause() {
    gameRunning = !gameRunning;
    if(gameRunning){
        document.getElementById("pause").innerHTML = "&#10074;&#10074;";
        draw();
    }else{
        document.getElementById("pause").innerHTML = "&#8227;";
    }
}

function drawGameLines() {
    gC.fillStyle = "#eef8ff";
    gC.fillRect(0, 0, width, height);
    gC.fill();
    gC.strokeStyle = "blue";
    gC.lineWidth = 3;
    gC.beginPath();
    gC.setLineDash([4, 15]);
    gC.arc(240, 0, 75,-0.035*Math.PI, Math.PI);
    gC.stroke();
    gC.beginPath();
    gC.arc(240, height, 75,Math.PI*0.4, Math.PI*2);
    gC.stroke();
    gC.beginPath();
    gC.moveTo(0,height/2-30);
    gC.lineTo(width, height/2-30);
    gC.stroke();
    gC.beginPath();
    gC.moveTo(0,height/2+30);
    gC.lineTo(width, height/2+30);
    gC.stroke();
    gC.setLineDash([0]);
}

function draw() {
    drawGameLines();
    pPush.moveTo(newX,newY);
    gDsk.move();
    cPsh.move();
    cPsh.render();
    gDsk.render();
    pPush.render();
    playerGoal.render();
    computerGoal.render();
    if(player.points >= targetScore || computer.points >= targetScore){
        gameFinish = true;
        inputForm.style.display = "block";
    }
    if (gameRunning && !gameFinish) {
        window.requestAnimationFrame(draw);
    }
}
