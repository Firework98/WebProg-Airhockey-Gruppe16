let canv;
let gC;
let pX;
let pY;
let pPush;

const WIDTH = 640;
const HEIGHT = 480;

class Pusher{
    constructor (radius,x,y){
        this.radius = radius;
        this.x = x;
        this.y = y;
    }

    render(){
        gC.fillStyle = "black";
        console.log(""+ this.x + "  " + this.y + " " + this.radius);
        gC.beginPath();
        gC.arc(this.x,this.y,this.radius,0, 2* Math.PI);
        gC.fill();
    }

    moveTo(x,y){
        this.x = x;
        this.y = y;
    }
}
function init(){
    canv = document.getElementById("canv");
    if(canv != null){
        gC = canv.getContext("2d");
    }

    let psh = new Pusher(10,50,40);
    pPush = psh;
    window.requestAnimationFrame(draw);
    document.addEventListener("mousemove",function (e){
        let x = e.pageX;
        let y = e.pageY;
        pX = x;
        pY = y;
        console.log("x " + x + "y " + y);
    })
}
function draw(){
    console.log("Draw");
    gC.fillStyle = "grey";
    gC.fillRect(0,0,640,480);
    gC.fill();
    if (pX + pPush.radius > WIDTH){
        pX = 640 - pPush.radius;
    }
    if (pX - pPush.radius < 0){
        pX = pPush.radius;
    }
    if (pY + pPush.radius > HEIGHT){
        pY = HEIGHT - pPush.radius;
    }
    if (pY - pPush.radius < 0){
        pY = 0 + pPush.radius;
    }
    pPush.moveTo(pX, pY);
    pPush.render();
    window.requestAnimationFrame(draw);
}
