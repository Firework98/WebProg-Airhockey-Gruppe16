"use strict";
function audioStop() {
    let sound = document.getElementById("audio");
    sound.muted = sound.muted === false;
    if (sound.muted) {
        document.getElementById("mute").innerHTML = "&#x2717;"
    }else{
        document.getElementById("mute").innerHTML = "&#9835;"
    }
}