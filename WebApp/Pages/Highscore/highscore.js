"use strict";
window.onload = init;

function init() {
    const button = document.getElementById('save');
    button.onclick = addEntry;
    const localHighscoreArr = getLocalHighscore();
    for (let i = 0; i < localHighscoreArr.length; i++) {
        writeIntoDOM(i, localHighscoreArr[i]);
    }
}

function getLocalHighscore() {
    let localHighscoreArr = localStorage.getItem('localHighscore');
    localHighscoreArr = localHighscoreArr ? JSON.parse(localHighscoreArr) : [];
    return localHighscoreArr;
}
function deleteScoreEntry(entry) {
    const id = entry.target.id;
    let localHighscoreArr = getLocalHighscore();
    if (localHighscoreArr) {
        localHighscoreArr.splice(id, 1);
    }
    localStorage.setItem('localHighscore', JSON.stringify(localHighscoreArr));
    deleteOutOfDOM(id);
}

function writeIntoDOM(id, ItemObj) {
    let htmlEntries = document.getElementById('entries');
    let newHtmlEntry = document.createElement('li');
    newHtmlEntry.setAttribute('id', id);
    newHtmlEntry.innerHTML = "" + ItemObj.Username + " : " + ItemObj.Score;
    htmlEntries.appendChild(newHtmlEntry);
    newHtmlEntry.onclick = deleteScoreEntry;
}

function deleteOutOfDOM(id) {
    let htmlListEntry = document.getElementById(id);
    htmlListEntry.parentNode.removeChild(htmlListEntry);
}