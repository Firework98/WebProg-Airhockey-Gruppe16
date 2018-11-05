window.onload = init;
function init() {
    var button = document.getElementById('speichern');
    button.onclick = eintragHinzufügen;
    var eintraegeArray = leseEinträge();
    for (var i = 0; i < eintraegeArray.length; i++) {
        var plazierungNr = eintraegeArray[i];
        var value = eintraegeArray[i].Name;
        insDOMschreiben(eintraegeArray[i], eintraegeArray[i].Name);
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
    var punktzahl = document.getElementById('punktzahl').value;
    console.log(punktzahl);
    if(value!='' && punktzahl!='')
    {
        var eintrag = {'Punktzahl':punktzahl,'Name': value};
        eintraegeArray.push(eintrag);
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        insDOMschreiben(eintraegeArray[eintraegeArray.length], eintrag.Name);
        document.getElementById('eingabe').value=' ';
    }
    else
    {
        alert('Bitte geben Sie etwas ein!');
    }
}

function eintragLöschen(e) {
    var name = e.target.innerHTML;
    var id = e.target.id;
    var eintraegeArray = leseEinträge();
    if (eintraegeArray) {
        for (var i = 0; i < eintraegeArray.length; i++) {
            if (name == eintraegeArray[i].Name) {
                eintraegeArray.splice(i,1);
            }
        }
        localStorage.removeItem('eintraegeArray');
        localStorage.setItem('eintraegeArray', JSON.stringify(eintraegeArray));
        ausDOMentfernen(id);
    }
}

function insDOMschreiben(plazierungNr, value) {
    var eintraege = document.getElementById('eintraege');
    var eintrag = document.createElement('li');
    eintrag.setAttribute('id', plazierungNr);
    eintrag.innerHTML = value;
    eintraege.appendChild(eintrag);
    eintrag.onclick = eintragLöschen;
}

function ausDOMentfernen(plazierungNr) {
    var eintrag = document.getElementById(plazierungNr);
    eintrag.parentNode.removeChild(eintrag);
}


