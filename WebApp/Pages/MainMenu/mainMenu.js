function audioStop() {
    var sound = document.getElementById("audio");
        sound.pause();
        console.log(sound.played);
        sound.played = 0;
}