function audioStop() {
    var sound = document.getElementById("audio");
        sound.pause();
        console.log(sound.played);
        sound.played = 0;
}
function audioStart() {
    var sound = document.getElementById("audio");
    sound.play();
    console.log(sound.played);
}