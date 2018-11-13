"use strict";
function audioStop() {
    let sound = document.getElementById("audio");

    sound.muted = sound.muted == false;
}