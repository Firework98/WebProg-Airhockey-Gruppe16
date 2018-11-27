"use strict";
let canv;
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

const DECAY = 0.995;
const REDUCTION = 0.92;
const WIDTH = 480;
const HEIGHT = 640;
const StackSize = 3;
const CAP = 17;
const EPSILONCOLL = 1.2;
const EPSILONMOVE = 1;

class Vec2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vec){
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }
    multiply (scalar){
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    length(){
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
        this.col = "red";
    }
    render(){
        gC.fillStyle = this.col;
        gC.beginPath();

        gC.arc(this.x,this.y,this.radius,0, 2*Math.PI);
        gC.fill();
    }
    move(){
        this.x += this.velo.x;
        this.y += this.velo.y;
        this.velo.x *= DECAY;
        this.velo.y *= DECAY;
        this.checkCollisionWithBorder();
        this.checkCollisionWithPusher(pPush);
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
        let pVelo = new Vec2D(this.x-pusher.x, this.y-pusher.y);
        let multFactor = Math.sqrt(pVelo.length() * pVelo.length() + this.velo.length() * this.velo.length())*0.96;
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
        gC.strokeStyle = "#880000";
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
        this.stack = [];
        this.upperBoarder = upperBoarder;
        this.lowerBoarder = lowerBoarder;
        for(let i = 0; i < StackSize; i++){
            this.stack.push(new Vec2D(x,y));
        }
    }
    getLast(){
        return this.stack[0];
        
    }

    render() {
        gC.fillStyle = "#ff0000";
        //console.log(""+ this.x + "  " + this.y + " " + this.radius);
        gC.beginPath();
        gC.arc(this.x,this.y,this.radius,0, 2* Math.PI);
        gC.fill();
    }

    moveTo(x,y){
        let steps = 10;
        let newPos = new Vec2D(x,y);
        let oldPos = new Vec2D(this.x,this.y);
        let moveVect = new Vec2D(newPos.x - oldPos.x, newPos.y - oldPos.y);
        let steplength = moveVect.length()/steps;
        let boundaryColl = false;
        let diskColl = false;
        for (let i = 0; i <= steps && !boundaryColl; i++) {
            let intermediatePos = oldPos.clone().add(moveVect.clone().normalize().multiply(steplength * i));
            if (this.checkBorderCollision(intermediatePos.x,intermediatePos.y)){
                newPos = this.computeBorderCollision(intermediatePos.x,intermediatePos.y);
            }
            //this.setPos(intermediatePos.x, intermediatePos.y);
            if (gDsk.checkCollisionWithPusher(this)){
                gDsk.computeCollisionWithPusher(this);
            }
        }
        this.setPos(newPos.x, newPos.y);
    }


    setPos(x,y){
        this.stack.push(new Vec2D (x,y));
        this.stack.shift();
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

function init(){
    canv = document.getElementById("canv");
    canv.style.cursor = "none";
    if(canv != null){
        gC = canv.getContext("2d");
    }
    let bRect = canv.getBoundingClientRect();
    xOffSet = bRect.left;
    yOffSet = bRect.top;
    let psh = new Pusher(40,50,40, 0, HEIGHT);
    let dsk = new Disk(30,40,50);
    let third =  WIDTH / 3;

    player = new Player("Player 1", psh);
    computer = new Player("Computer", null);
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
    });
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
    gC.arc(240, HEIGHT, 75,Math.PI *0.4, Math.PI*2);
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
    gDsk.render();
    pPush.render();
    if (gameRunning) {
        window.requestAnimationFrame(draw);
    }
    playerGoal.render();
    computerGoal.render();
}
