window.onload = init;

function init() {
    const button = document.getElementById('save');
    button.onclick = addEntry;
    const eintraegeArray = getLocalHighscore();
    for (let i = 0; i < eintraegeArray.length; i++) {
        writeIntoDOM(i, eintraegeArray[i]);
    }
}

function getLocalHighscore() {
    let eintraegeArray = localStorage.getItem('eintraegeArray');
    eintraegeArray = eintraegeArray ? JSON.parse(eintraegeArray) : [];
    return eintraegeArray;
}

function addEntry() {
    let eintraegeArray = getLocalHighscore();
    const value = document.getElementById('eingabe').value;
    const punktzahl = document.getElementById('punktzahl').value;
    if (value !== '' && punktzahl !== '') {
        const eintrag = {'Punktzahl': punktzahl, 'Name': value};
        let i;
        if (eintraegeArray.length !== 0) {
            for (i = 0; i < eintraegeArray.length; i++) {
                if (parseInt(punktzahl) >= parseInt(eintraegeArray[i].Punktzahl)) {
                    eintraegeArray.splice(i, 0, eintrag);
                    break;
                }
            }
        }else{
            eintraegeArray.push(eintrag);
        }
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        writeIntoDOM(i, eintrag.Name);
        document.getElementById('eingabe').value = ' ';
        document.getElementById('punktzahl').value = ' ';
    } else {
        alert('Bitte geben Sie etwas ein!');
    }
}

function deleteScoreEntry(entry) {
    const name = entry.target.innerHTML;
    const id = entry.target.id;
    let eintraegeArray = getLocalHighscore();
    if (eintraegeArray) {
        for (let i = 0; i < eintraegeArray.length; i++) {
            if (name === eintraegeArray[i].Name) {
                eintraegeArray.splice(i, 1);
            }
        }
        localStorage.removeItem('eintraegeArray');
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        deleteOutOfDOM(id);
    }
}

function writeIntoDOM(id, ItemObj) {
    let htmlEntries = document.getElementById('eintraege');
    let newHtmlEntry = document.createElement('li');
    newHtmlEntry.setAttribute('id', id);
    newHtmlEntry.innerHTML = "" + ItemObj.Name + " : " + ItemObj.Punktzahl;
    htmlEntries.appendChild(newHtmlEntry);
    newHtmlEntry.onclick = deleteScoreEntry;
}

function deleteOutOfDOM(id) {
    let htmlListEntry = document.getElementById(id);
    htmlListEntry.parentNode.removeChild(htmlListEntry);
}