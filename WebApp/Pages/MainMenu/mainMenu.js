"use strict";
function audioStop() {
    const sound = document.getElementById("audio");

    if (sound.paused != false) {
        sound.play();
    } else {
        sound.pause();
    }
}