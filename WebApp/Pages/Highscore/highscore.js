window.onload = init;
function init() {
    var button = document.getElementById('speichern');
    button.onclick = eintragHinzufügen;
    var eintraegeArray = leseEinträge();
    for (var i = 0; i < eintraegeArray.length; i++) {
        var aufgabeNr = eintraegeArray[i];
        var value = JSON.parse(localStorage[aufgabeNr]);
        insDOMschreiben(aufgabeNr, value);
    }
}
function leseEinträge() {
    var eintraegeArray = localStorage.getItem('eintraegeArray');
    if (!eintraegeArray) {
        eintraegeArray = [];
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
    } else {
        eintraegeArray = JSON.parse(eintraegeArray);
    }
    return eintraegeArray;
}

function eintragHinzufügen() {
    var eintraegeArray = leseEinträge();
    var value = document.getElementById('eingabe').value;
    if(value!='')
    {
        var plazierung = 'Plazierung_';
        var name = {'value': value};
        localStorage.setItem(plazierung, JSON.stringify(name));
        eintraegeArray.push(plazierung);
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        insDOMschreiben(plazierung, name);
        document.getElementById('eingabe').value=' ';
    }
    else
    {
        alert('Bitte geben Sie etwas ein!');
    }
}

function toDoLöschen(e) {
    var aufgabeNr = e.target.id;
    var eintraegeArray = leseEinträge();
    if (eintraegeArray) {
        for (var i = 0; i < eintraegeArray.length; i++) {
            if (aufgabeNr == eintraegeArray[i]) {
                eintraegeArray.splice(i,1);
            }
        }
        localStorage.removeItem(aufgabeNr);
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        ausDOMentfernen(aufgabeNr);
    }
}

function insDOMschreiben(aufgabeNr, ItemObj) {
    var eintraege = document.getElementById('eintraege');
    var eintrag = document.createElement('li');
    eintrag.setAttribute('id', aufgabeNr);
    eintrag.innerHTML = ItemObj.value;
    eintraege.appendChild(eintrag);
    eintrag.onclick = toDoLöschen;
}

function ausDOMentfernen(aufgabeNr) {
    var eintrag = document.getElementById(aufgabeNr);
    eintrag.parentNode.removeChild(eintrag);
}


