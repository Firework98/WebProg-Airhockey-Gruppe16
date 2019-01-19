"use strict";
//function to switch music on and off and switching the button symbol suitable for the music
function audioStop() {
    let sound = document.getElementById("audio");
    sound.muted = sound.muted === false;
    if (sound.muted) {
        document.getElementById("mute").innerHTML = "&#x2717;"
    }else{
        document.getElementById("mute").innerHTML = "&#9835;"
    }
}