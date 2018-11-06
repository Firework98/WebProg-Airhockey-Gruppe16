let canv;
let gC;
let pX;
let pY;
let pPush;
let gDsk;

const DECAY = 0.999;
const REDUCTION = 0.95;
const WIDTH = 900;
const HEIGHT = 1080;
const StackSize = 3;
const CAP = 30;

class Vec2D{
    constructor (x,y){
        this.x = x;
        this.y = y;
    }
    multiply (scalar){
        this.x *= scalar;
        this.y *= scalar;
    }
    length(){
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    normalize(){
        let temp = this.length();
        this.x /= temp;
        this.y /= temp;
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
        if (this.x + this.radius > WIDTH){
            this.x = WIDTH - this.radius;
            this.velo.x = -(this.velo.x * REDUCTION)
        }
        if (this.x - this.radius < 0){
            this.x = this.radius;
            this.velo.x = -(this.velo.x * REDUCTION)
        }
        if (this.y + this.radius > HEIGHT){
            this.y = HEIGHT - this.radius;
            this.velo.y = -(this.velo.y * REDUCTION)
        }
        if (this.y - this.radius < 0){
            this.y = 0 + this.radius;
            this.velo.y = -(this.velo.y * REDUCTION)
        }
        console.log("Velo =" + this.velo);
    }
    checkCollisionWithPusher(pusher){
        let distVec = new Vec2D(this.x-pusher.x,this.y-pusher.y);
        console.log("Dist"+distVec.x + " | " + distVec.y);
        if (distVec.length() < pusher.radius + this.radius){
            this.col = "blue";
            let distDir = distVec.clone();
            distDir.normalize();
            let pOldVec = pusher.getLast();
            let pVelo = new Vec2D(pusher.x - pOldVec.x, pusher.y - pOldVec.y);
            let multFactor = Math.sqrt(pVelo.length()) + this.velo.length();
            multFactor = (multFactor > CAP ? CAP : multFactor);
            console.error("Pvelo = ("+ pVelo.x + " | " + pVelo.y + ")");
            distDir.multiply(Math.sqrt(pVelo.length()) + this.velo.length());
            this.velo = distDir;
        } else{
            this.col = "red";
        }
    }
}
class Pusher{
    constructor (radius,x,y){
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.stack = [];
        for(var i = 0; i < StackSize; i++){
            this.stack.push(new Vec2D(x,y));
        }
    }
    getLast(){
        return this.stack[0];
        
    }

    render(){
        gC.fillStyle = "black";
        console.log(""+ this.x + "  " + this.y + " " + this.radius);
        gC.beginPath();
        gC.arc(this.x,this.y,this.radius,0, 2* Math.PI);
        gC.fill();
    }

    moveTo(x,y){
        let newPos = this.checkBorderCollision(x,y);
        this.setPos(newPos.x, newPos.y);
    }
    setPos(x,y){
        this.stack.push(new Vec2D (x,y));
        this.stack.shift();
        this.x = x;
        this.y = y;
    }

    checkBorderCollision(newX,newY){
        if (newX + this.radius > WIDTH){
            newX = WIDTH - this.radius;
        }
        if (newX - this.radius < 0){
            newX = this.radius;
        }
        if (newY + this.radius > HEIGHT){
            newY = HEIGHT - this.radius;
        }
        if (newY - this.radius < 0){
             newY = 0 + this.radius;
        }
        return new Vec2D(newX,newY);
    }
}
function init(){
    canv = document.getElementById("canv");
    if(canv != null){
        gC = canv.getContext("2d");
    }
    let psh = new Pusher(40,50,40);
    let dsk = new Disk(20,40,50);
    pPush = psh;
    gDsk = dsk;
    window.requestAnimationFrame(draw);
    document.addEventListener("mousemove",function (e){
        let x = e.pageX;
        let y = e.pageY;
        pPush.moveTo(x,y);
        console.log("x " + x + "y " + y);
    })
}
function draw(){
    console.log("Draw");
    gC.fillStyle = "grey";
    gC.fillRect(0,0,WIDTH,HEIGHT);
    gC.fill();
    gDsk.move();
    gDsk.render();
    pPush.render();
    window.requestAnimationFrame(draw);
}