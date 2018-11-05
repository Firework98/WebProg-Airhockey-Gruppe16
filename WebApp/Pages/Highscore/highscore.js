window.onload = init;
function init() {
    var button = document.getElementById('speichern');
    button.onclick = eintragHinzufügen;
    var eintraegeArray = leseEinträge();
    for (var i = 0; i < eintraegeArray.length; i++) {
        var plazierungNr = eintraegeArray[i];
        var value = JSON.parse(localStorage.getItem(plazierungNr));
        insDOMschreiben(plazierungNr, value);
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
        var plazierung = eintraegeArray.length+1;
        var name = {'value': value};
        localStorage.setItem(plazierung, JSON.stringify(name));
        eintraegeArray.push(name);
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        insDOMschreiben(plazierung, name);
        document.getElementById('eingabe').value=' ';
    }
    else
    {
        alert('Bitte geben Sie etwas ein!');
    }
}

function eintragLöschen(e) {
    var plazierungNr = e.target.id;
    var eintraegeArray = leseEinträge();
    if (eintraegeArray) {
        for (var i = 0; i < eintraegeArray.length; i++) {
            if (plazierungNr == eintraegeArray[i]) {
                eintraegeArray.splice(i,1);
            }
        }
        localStorage.removeItem(plazierungNr);
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        ausDOMentfernen(plazierungNr);
    }
}

function insDOMschreiben(plazierungNr, ItemObj) {
    var eintraege = document.getElementById('eintraege');
    var eintrag = document.createElement('li');
    eintrag.setAttribute('id', plazierungNr);
    eintrag.innerHTML = ItemObj.value;
    eintraege.appendChild(eintrag);
    eintrag.onclick = eintragLöschen;
}

function ausDOMentfernen(plazierungNr) {
    var eintrag = document.getElementById(plazierungNr);
    eintrag.parentNode.removeChild(eintrag);
}


