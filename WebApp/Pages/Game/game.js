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

const DECAY = 0.999;
const REDUCTION = 0.96;
const WIDTH = 480;
const HEIGHT = 640;
const CAP = 30;
const EPSILONCOLL = 0.2;

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
        let newPos = new Vec2D(this.x+this.velo.x,this.y+this.velo.y);
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
        this.velo.x *= DECAY;
        this.velo.y *= DECAY;
        this.checkCollisionWithBorder();
        if (this.checkCollisionWithPusher(pPush)) {
            this.computeCollisionWithPusher(pPush);
        }
    }
    checkCollisionWithBorder(){
        let checkGoals = false;
        if(this.y + this.radius <= HEIGHT && this.y - this.radius >= 0){
            checkGoals = false;
        }
        if (this.y + this.radius > HEIGHT){
            this.y = HEIGHT - this.radius;
            this.velo.y = -(this.velo.y * REDUCTION);
            checkGoals = true;
        }
        if (this.y - this.radius < 0){
            this.y = 0 + this.radius;
            this.velo.y = -(this.velo.y * REDUCTION);
            checkGoals = true;
        }
        if(checkGoals && (this.isInGoalSpace(computerGoal) || this.isInGoalSpace(playerGoal))){
            let distToCGoal = Math.abs(computerGoal.y-this.y);
            let distToPGoal = Math.abs(playerGoal.y-this.y);
            if (distToCGoal <= this.radius && this.isInGoalSpace(computerGoal)){
                computerGoal.player.points++;
            } else{
                if (distToPGoal <= this.radius && this.isInGoalSpace(playerGoal)){
                    playerGoal.player.points++;
                }
            }
            document.getElementById("playerScore").innerText = player.points;
            document.getElementById("computerScore").innerText = computer.points;

        } else{
            if (this.x + this.radius > WIDTH){
                this.x = WIDTH - this.radius;
                this.velo.x = -(this.velo.x * REDUCTION)
            }
            if (this.x - this.radius < 0){
                this.x = this.radius;
                this.velo.x = -(this.velo.x * REDUCTION)
            }
        }
        //console.log("Velo =" + this.velo);
    }

    isInGoalSpace(goal){
        return this.x > goal.xLeft && this.x < goal.xRight;
    }
    checkCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        return distVec.length() < pusher.radius + this.radius + EPSILONCOLL;
    }

    computeCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        let distDir = distVec.clone();
        distDir.normalize();
        let pOldVec = pusher.getLast();
        let pVelo = new Vec2D(pOldVec.x-pusher.x, pOldVec.y-pusher.y);
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() +  0.4 * this.velo.length() * this.velo.length());
        multFactor = (multFactor > CAP ? CAP : multFactor);
        console.error("Pvelo = (" + pVelo.x + " | " + pVelo.y + ")");
        distDir.multiply(multFactor);
        this.velo = distDir;
    }
}
class Player{
    constructor(name,pusher){
        this.pusher = pusher;
        this.name = name;
        this.points = 0;
    }
    setGoal(goal)
    {
        this.goal = goal;
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
        //console.log(""+ this.x + "  " + this.y + " " + this.radius);
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
    computeCollisionWithDisk(disk,oldPos,intermediatePos, newPos){
        let distVec = new Vec2D(disk.x-intermediatePos.x,disk.y-intermediatePos.y);
        let distDir = distVec.clone();
        distDir.normalize();
        let pOldVec = oldPos;
        let pVelo = new Vec2D(newPos.x-oldPos.x, newPos.y-oldPos.y);
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() + 0.3 * disk.velo.length() * disk.velo.length());
        multFactor = (multFactor > CAP ? CAP : multFactor);
        console.error("Oldpos = (" + oldPos.x + " | " + oldPos.y + ")" + "NewPos = (" + newPos.x + " | " + newPos.y + ")" + "Pvelo = (" + pVelo.x + " | " + pVelo.y + ")");
        distDir.multiply(multFactor);
        disk.velo = distDir;
    }

    moveTo(x,y){
        let steps = 100;
        let newPos = this.computeBorderCollision(x,y);
        let oldPos = new Vec2D(this.x,this.y);
        let moveVect = new Vec2D(newPos.x - oldPos.x, newPos.y - oldPos.y);
        let steplength = moveVect.length()/steps;
        let boundaryColl = false;
        let diskColl = false;
        let formerPos = oldPos;
        console.error("Old" + oldPos.x + " | " + oldPos.y);
        if(steplength > 0.001){
            for (let i = 1; i <= steps && !diskColl; i++) {
                let intermediatePos = oldPos.clone().add(moveVect.clone().normalize().multiply(steplength * i));
                if (this.checkBorderCollision(intermediatePos.x,intermediatePos.y)){
                    intermediatePos = this.computeBorderCollision(intermediatePos.x,intermediatePos.y);
                }
                let ghostPusher = new Pusher(this.radius,intermediatePos.x,intermediatePos.y,this.upperBoarder,this.lowerBoarder);
                if (gDsk.checkCollisionWithPusher(ghostPusher)){
                    this.computeCollisionWithDisk(gDsk,oldPos,intermediatePos,newPos);
                    if(gDsk.checkCollisionWithPusher(ghostPusher)){
                        diskColl = true;
                        newPos = formerPos.clone();
                    }

                } else {
                    newPos = intermediatePos.clone();
                }
                formerPos = intermediatePos.clone();
            }
            this.setPos(newPos.x, newPos.y);
        } else {
            this.setPos(this.x,this.y);
        }
        console.error("Old" + this.x + " | " + this.y);
    }


    setPos(x,y){
        this.oldPos = new Vec2D(x,y);
        this.x = x;
        this.y = y;
    }

    checkBorderCollision(newX,newY){
        return newX + this.radius > WIDTH || newX - this.radius < 0 || newY + this.radius > this.lowerBoarder || newY - this.radius < this.upperBoarder;
    }
    computeBorderCollision(newX,newY){
        if (newX + this.radius > WIDTH){
            newX = WIDTH - this.radius;
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
            console.log("Horizontal Delta =" + horizontalDelta);
            let verticalDelta = 40;
            if (gDsk.y < this.lowerBoarder && gDsk.y > this.upperBoarder){
                console.error("Why you dont move?");
                verticalDelta = gDsk.y - this.y + Math.random()*5 - 2.5;
            } else {
                verticalDelta = this.groundLine - this.y + Math.random()*5 - 2.5;
            }
            let oldPos = new Vec2D(this.x,this.y);
            this.moveTo(this.x + (Math.abs(horizontalDelta) > this.maxVelocity ? Math.sign(horizontalDelta)*this.maxVelocity : horizontalDelta),
                this.y + (Math.abs(verticalDelta) > this.maxVelocity * 4? Math.sign(verticalDelta)*this.maxVelocity * 4 : verticalDelta * 4));
            let newPos = new Vec2D(this.x,this.y);
            if (newPos.add(oldPos.multiply(-1)).length() < 0.01){
                this.notMovedFrames++;
                if(this.notMovedFrames > 20){
                    this.reset = true;
                }
            } else {
                this.notMovedFrames = 0;
            }
        } else{
            let origin = WIDTH / 2;
            if (this.y === this.groundLine && this.x === origin){
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
function init(){
    canv = document.getElementById("canv");
    canv.style.cursor = "none";
    if(canv != null){
        gC = canv.getContext("2d");
    }
    let bRect = canv.getBoundingClientRect();
    xOffSet = bRect.left;
    yOffSet = bRect.top;
    let psh = new Pusher(40,50,40, HEIGHT/2, HEIGHT);
    cPsh = new ComputerPusher(40,200,40, 0, HEIGHT / 2, 4, 40);
    let dsk = new Disk(30,200,200);
    let third =  WIDTH / 3;

    player = new Player("Player 1", psh);
    computer = new Player("Computer", cPsh);
    computerGoal = new Goal(player,third,third * 2,0);
    playerGoal = new Goal(computer,third ,third *2,HEIGHT);
    player.setGoal(playerGoal);
    computer.setGoal(computerGoal);
    pPush = psh;
    gDsk = dsk;
    window.requestAnimationFrame(draw);
    document.addEventListener("mousemove",function (e){
        newX = e.pageX - xOffSet;
        newY = e.pageY - yOffSet;
        //pPush.moveTo(x,y);
        //console.log("Mouse");
    })
    document.addEventListener("keypress", handleKeyPress );
}

function handleKeyPress(e) {
    if(e.key === "Escape"){
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
    gC.fillRect(0, 0, WIDTH, HEIGHT);
    gC.fill();
    gC.strokeStyle = "blue";
    gC.lineWidth = 3;
    gC.beginPath();
    gC.setLineDash([4, 15]);
    gC.arc(240, 0, 75,-0.035*Math.PI, Math.PI);
    gC.stroke();
    gC.beginPath();
    gC.arc(240, HEIGHT, 75,Math.PI*0.4, Math.PI*2);
    gC.stroke();
    gC.beginPath();
    gC.moveTo(0,HEIGHT/2);
    gC.lineTo(WIDTH, HEIGHT/2);
    gC.stroke();
    gC.setLineDash([0]);
}

function draw() {
    //console.log("Draw");
    drawGameLines();
    pPush.moveTo(newX,newY);
    gDsk.move();
    cPsh.move();
    cPsh.render();
    gDsk.render();
    pPush.render();
    if (gameRunning) {
        window.requestAnimationFrame(draw);
    }
    playerGoal.render();
    computerGoal.render();
}

function addEntry(username, score) {
    let localHighscoreArr = getLocalHighscore();
    //const username = document.getElementById('inputName').value;
    //const score = document.getElementById('inputScore').value;
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
