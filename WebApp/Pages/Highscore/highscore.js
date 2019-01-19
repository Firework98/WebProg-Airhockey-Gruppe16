"use strict";
//on page load call of the init function
window.onload = init;
//load the highscoreArray from localStorage and write in the html page
function init() {
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
//delete highscore entry out of the html page and out of localstorage
function deleteScoreEntry(entry) {
    const id = entry.target.id;
    let localHighscoreArr = getLocalHighscore();
    if (localHighscoreArr) {
        localHighscoreArr.splice(id, 1);
    }
    localStorage.setItem('localHighscore', JSON.stringify(localHighscoreArr));
    deleteOutOfDOM(id);
}
//write highscore entry into the html page
function writeIntoDOM(id, ItemObj) {
    let htmlEntries = document.getElementById('entries');
    let newHtmlEntry = document.createElement('li');
    newHtmlEntry.setAttribute('id', id);
    newHtmlEntry.innerHTML = "" + ItemObj.Username + " : " + ItemObj.Score;
    htmlEntries.appendChild(newHtmlEntry);
    newHtmlEntry.onclick = deleteScoreEntry;
}
//delete entry out of the html page
function deleteOutOfDOM(id) {
    let htmlListEntry = document.getElementById(id);
    htmlListEntry.parentNode.removeChild(htmlListEntry);
}