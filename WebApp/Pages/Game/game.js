"use strict";
let canv;
let cPsh;
let gC;
let pPush;
let gDsk;
let xOffSet;
let yOffSet;
let computer;
let player;
let computerGoal;
let playerGoal;
let newX;
let newY;
let gameRunning;
let inputForm;
let gameFinish = false;
let inputField;
let username;
let debug;
let lvlPicker;
let bRect;
let scoreBoard;

let gLvl;
let targetScore;
let decay;
let reduction;
let width;
let height;
let cap;
let epsiloncoll;
let computerPace;

const OUTSET = 0.5;

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
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    normalize(){
        let temp = this.length();
        this.x /= temp;
        this.y /= temp;
        return this;
    }
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
    render(){
        gC.fillStyle = 'rgb(53, 53, 53)';
        gC.beginPath();

        gC.arc(this.x,this.y,this.radius,0, 2*Math.PI);
        gC.fill();

        gC.fillStyle = this.col;
        gC.beginPath();

        gC.arc(this.x,this.y,this.radius-5,0, 2*Math.PI);
        gC.fill();
    }
    move(){
        let steps = 100;
        let oldPos = new Vec2D(this.x,this.y);
        let moveVect = this.velo;
        let steplength = moveVect.length()/steps;
        let pushColl = false;
        let formerPos = oldPos;
        for (let i = 0; i <= steps && !pushColl; i++) {
            let intermediatePos = oldPos.clone().add(moveVect.clone().normalize().multiply(steplength * i));
            let ghostDisk = new Disk(this.radius,intermediatePos.x,intermediatePos.y);
            if(ghostDisk.checkCollisionWithPusher(pPush)) {
                this.computeCollisionWithPusher(pPush);
                pushColl = true;
            } else{
                formerPos = intermediatePos;
            }
        }
        this.x = formerPos.x;
        this.y = formerPos.y;
        this.velo.x *= decay;
        this.velo.y *= decay;
        this.checkCollisionWithBorder();
        if (this.checkCollisionWithPusher(pPush)) {
            this.computeCollisionWithPusher(pPush);
        }
    }
    resetAfterGoal(goal){
        this.render();
        this.x = width / 2;
        this.y = height /2;
        this.velo.x = 0;
        this.velo.y = (goal.y === 0 ? -2 : 2);
    }
    checkCollisionWithBorder(){
        let ret = false;
        let checkGoals = false;
        if(this.y + this.radius <= height && this.y - this.radius >= 0){
            checkGoals = false;
        }
        if (this.y + this.radius > height){
            ret = true;
            this.y = height - this.radius;
            this.velo.y = -(this.velo.y * reduction);
            checkGoals = true;
        }
        if (this.y - this.radius < 0){
            ret = true;
            this.y = 0 + this.radius;
            this.velo.y = -(this.velo.y * reduction);
            checkGoals = true;
        }
        if(checkGoals && (this.isInGoalSpace(computerGoal) || this.isInGoalSpace(playerGoal))){
            let distToCGoal = Math.abs(computerGoal.y-this.y);
            let distToPGoal = Math.abs(playerGoal.y-this.y);
            if (distToCGoal <= this.radius && this.isInGoalSpace(computerGoal)){
                computerGoal.player.points++;
                this.resetAfterGoal(computerGoal);
            } else{
                if (distToPGoal <= this.radius && this.isInGoalSpace(playerGoal)){
                    playerGoal.player.points++;
                    this.resetAfterGoal(playerGoal);
                }
            }
            document.getElementById("playerScore").innerText = player.points;
            document.getElementById("computerScore").innerText = computer.points;

        } else{
            if (this.x + this.radius > width){
                ret = true;
                this.x = width - this.radius;
                this.velo.x = -(this.velo.x * reduction)
            }
            if (this.x - this.radius < 0){
                ret = true;
                this.x = this.radius;
                this.velo.x = -(this.velo.x * reduction)
            }
        }
        return ret;
    }

    isInGoalSpace(goal){
        return this.x > goal.xLeft && this.x < goal.xRight;
    }
    checkCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        return distVec.length() < pusher.radius + this.radius + epsiloncoll;
    }

    computeCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        let distDir = distVec.clone();
        distDir.normalize();
        let pOldVec = pusher.getLast();
        let pVelo = new Vec2D(pOldVec.x-pusher.x, pOldVec.y-pusher.y);
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() +  0.4 * this.velo.length() * this.velo.length());
        multFactor = (multFactor > cap ? cap : multFactor);
        distDir.multiply(multFactor);
        this.velo = distDir;
    }
    clone(){
        return new Disk(this.radius,this.x,this.y);
    }
    moveOutOfPusher(pusher) {
        let distVec = new Vec2D(this.x - pusher.x, this.y - pusher.y);
        let distDir = distVec.clone();
        distDir.normalize();
        let requiredDist = this.radius + pusher.radius + OUTSET;
        distDir.multiply(requiredDist);
        let tempDisk = this.clone();
        tempDisk.x = pusher.x + distDir.x;
        tempDisk.y = pusher.y + distDir.y;
        if (!tempDisk.checkCollisionWithBorder()) {
            this.x = tempDisk.x;
            this.y = tempDisk.y;
            return true;
        } else {
            //TODO Probably breaking

        }
        return false;
    }


}
class Player{
    constructor(){
        this.points = 0;
    }
}

class Goal{
    constructor(player,xLeft,xRight,y){
        this.player = player;
        this.xLeft = xLeft;
        this.xRight = xRight;
        this.y = y;
    }
    render(){
        gC.beginPath();
        gC.strokeStyle = "#688488";
        gC.lineWidth = 10;
        gC.moveTo(this.xLeft, this.y);
        gC.lineTo(this.xRight, this.y);
        gC.stroke();
    }

}
class Pusher{
    constructor (radius,x,y, upperBoarder, lowerBoarder){
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.color = "red";
        this.oldPos = new Vec2D(this.x,this.y);
        this.upperBoarder = upperBoarder;
        this.lowerBoarder = lowerBoarder;
    }
    getLast(){
        return this.oldPos;
        
    }

    render() {
        gC.fillStyle = this.color;
        gC.beginPath();
        gC.arc(this.x,this.y,this.radius,0, 2* Math.PI);
        gC.fill();

        gC.fillStyle = 'rgb(155,0,0)';
        gC.beginPath();

        gC.arc(this.x, this.y, this.radius-5,0,2*Math.PI);
        gC.fill();

        gC.fillStyle = this.color;
        gC.beginPath();

        gC.arc(this.x, this.y, 20,0,2*Math.PI);
        gC.fill();
    }
    static computeCollisionWithDisk(disk, oldPos, intermediatePos, newPos){
        let distVec = new Vec2D(disk.x-intermediatePos.x,disk.y-intermediatePos.y);
        let distDir = distVec.clone();
        distDir.normalize();
        let pVelo = new Vec2D(newPos.x-oldPos.x, newPos.y-oldPos.y);
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() + 0.3 * disk.velo.length() * disk.velo.length());
        multFactor = (multFactor > cap ? cap : multFactor);
        distDir.multiply(multFactor);
        disk.velo = distDir;
    }

    moveTo(x,y){
        let steps = 100;
        let newPos = this.computeBorderCollision(x,y);
        let oldPos = new Vec2D(this.x,this.y);
        let moveVect = new Vec2D(newPos.x - oldPos.x, newPos.y - oldPos.y);
        let steplength = moveVect.length()/steps;
        let diskColl = false;
        let formerPos = oldPos;
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
                    //If the Disk couldn't be moved out of the Pusher the Pusher cant be moved this way
                    if( ! gDsk.moveOutOfPusher(ghostPusher)){
                        Pusher.computeCollisionWithDisk(gDsk,oldPos,intermediatePos,newPos);
                        diskColl = true;
                        newPos = formerPos.clone();
                    } else{
                        Pusher.computeCollisionWithDisk(gDsk,oldPos,intermediatePos,newPos);
                        newPos = intermediatePos.clone();
                    }
                } else{
                    newPos = intermediatePos.clone();
                }
                formerPos = intermediatePos.clone();
            }
            this.setPos(newPos.x, newPos.y);
        } else {
            this.setPos(this.x,this.y);
        }
    }


    setPos(x,y){
        this.oldPos = new Vec2D(x,y);
        this.x = x;
        this.y = y;
    }

    checkBorderCollision(newX,newY){
        return newX + this.radius > width || newX - this.radius < 0 || newY + this.radius > this.lowerBoarder || newY - this.radius < this.upperBoarder;
    }
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

class ComputerPusher extends Pusher{

    constructor(radius, x, y, upperBoarder, lowerBoarder, maxVelocity,groundLine) {
        super(radius, x, y, upperBoarder, lowerBoarder);
        this.maxVelocity = maxVelocity;
        this.groundLine = groundLine;
        this.notMovedFrames = 0;
        this.reset = false;
    }

    move(){
        if (!this.reset){
            let horizontalDelta = gDsk.x - this.x;
            let verticalDelta = 40;
            let diskInField = gDsk.y > this.upperBoarder && gDsk.y < this.lowerBoarder;
            if (gDsk.y < this.lowerBoarder && gDsk.y > this.groundLine - 1){
                verticalDelta = gDsk.y - this.y;
            } else {
                verticalDelta = this.groundLine - this.y ;
            }
            let oldPos = new Vec2D(this.x,this.y);
            this.moveTo(this.x + (Math.abs(horizontalDelta) > this.maxVelocity ? Math.sign(horizontalDelta)*this.maxVelocity : horizontalDelta),
                this.y + (Math.abs(verticalDelta) > this.maxVelocity? Math.sign(verticalDelta)*this.maxVelocity: verticalDelta));
            let newPos = new Vec2D(this.x,this.y);
            if (newPos.add(oldPos.multiply(-1)).length() < 0.01){
                this.notMovedFrames++;
                if(this.notMovedFrames > 20 && diskInField){
                    this.reset = true;
                    gDsk.velo.x += 1;
                    gDsk.velo.y += 1;
                }
            } else {
                this.notMovedFrames = 0;
            }
        } else{
            let eps = 0.1;
            let origin = width / 2;
            console.error(""+this.x+" "+ this.y);
            console.error(""+origin+" "+this.groundLine);
            if (Math.abs(this.y-this.groundLine)<eps && Math.abs(this.x-origin)<eps){
                console.error("Resetted");
                this.reset = false;
            } else{
                let verticalDelta = this.groundLine - this.y;
                let horizontalDelta = origin - this.x;
                this.moveTo(this.x + (Math.abs(horizontalDelta) > this.maxVelocity * 3 ? Math.sign(horizontalDelta)*this.maxVelocity * 3 : horizontalDelta),
                    this.y + (Math.abs(verticalDelta) > this.maxVelocity ? Math.sign(verticalDelta)*this.maxVelocity : verticalDelta));
            }
        }


    }
}
function addEntry() {
    let localHighscoreArr = getLocalHighscore();
    let score = player.points + " : " + computer.points;
    username = inputField.value;
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
    debug = document.getElementsByTagName("h1").item(0);
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
