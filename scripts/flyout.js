var settings =
{
    "fontColor": [2, 0, "Цвет текста"],
    "shadowColor": [2, 0, "Цвет обводки"]
};
var colors = ["red", "orange", "yellow", "green", "blue", "darkblue", "darkviolet", "white", "black", "aliceblue",
              "blueviolet", "brown", "cornsilk", "greenyellow", "darkgray", "darkolivegreen",
              "darkkhaki", "pink", "violet", "gray", "gainsboro", "dodgerblue", "khaki",
              "lightsalmon", "gold", "lightcyan", "lightgreen", "lightseagreen",
              "olive", "orangered", "papayawhip", "sienna", "royalblue",
              "tomato", "thistle", "wheat", "yellowgreen", "skyblue"];
var updateOnClose = false;
function toggle(e){
    e.style.display = (e.style.display == "none") ? "" : "none";
}
function R(x){
    return System.Gadget.Settings.read(x);
}
function W(x, y){
    return System.Gadget.Settings.write(x, y);
}
function SClosing(event){
    if(event.closeAction == event.Action.commit){
        var anychanges = false;
        for(var i in settings){
            if(document.getElementById("ctrl_"+i).value != R(i)){
                W(i, document.getElementById("ctrl_"+i).value);
                anychanges = true;
            }
        }
        if(anychanges){
            System.Gadget.document.getElementById("btnSync").onclick.apply();
        }
        event.cancel = false;
    }
    if(updateOnClose){
        System.Gadget.document.getElementById('btnSyncUpd').onclick.apply();
        updateOnClose = false;
    }
}
function loadSettings(){
    // forms table according to settings array
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    //
    for(var i in settings){
        var ctrl = null;
        switch(settings[i][0]){
            case 4:
                ctrl = document.createElement("select");
                var varts = settings[i][2];
                for(j=0; j<varts.length; ++j){
                    var opt = document.createElement("option");
                    if(R(i) == varts[j]){
                        opt.setAttribute("SELECTED", "");
                    }
                    opt.setAttribute("value", j);
                    opt.innerHTML = varts[j];
                    ctrl.appendChild(opt);
                }
                break;
            case 3:
                ctrl = document.createElement("input");
                ctrl.setAttribute("type", "checkbox");
                if(R(i)=="1"){
                    ctrl.setAttribute("CHECKED", "1");
                }
                break;
            case 2:
                ctrl = document.createElement("select");
                for(j=0; j<colors.length; ++j){
                    var opt = document.createElement("option");
                    if(R(i) == colors[j]){
                        opt.setAttribute("SELECTED", "TRUE");
                        opt.selected = true;
                    }
                    opt.setAttribute("value", colors[j]);
                    opt.style.backgroundColor = colors[j];
                    ctrl.appendChild(opt);
                }
                break;
            case 1:
            case 0:
            default:
                var ctrl = document.createElement("input");
                ctrl.setAttribute("type", "text");
                // set to current value
                ctrl.setAttribute("value", R(i));
        }
        ctrl.setAttribute("id", "ctrl_"+i);
        var label = document.createTextNode(settings[i][2]);
        
        var tr = document.createElement("tr");
        var tdLeft = document.createElement("td");
        var tdRight = document.createElement("td");
        tdRight.setAttribute("className", "tdRight");//fuckIE
        tdLeft.appendChild(label);
        tdRight.appendChild(ctrl);
        tr.appendChild(tdLeft);
        tr.appendChild(tdRight);
        tbody.appendChild(tr)
    }
    //td.append
    table.setAttribute("width", "280");
    table.setAttribute("id", "tableA");
    //tableB.setAttribute("border", "1");
    table.appendChild(tbody);
    
    //
    //test = document.createElement("div");
    //test.appendChild(text);
    document.getElementById("cont").appendChild(table);
    
    //System.Gadget.onSettingsClosing = SClosing;
}
function btnUpdate(){
    document.getElementById("btnUpdate").setAttribute("disabled", "true");
    document.getElementById("btnUpdate").innerText = "Будет сделано";
    updateOnClose = true;
}
function initialize(){
    updateOnClose = false;
    loadSettings();
    System.Gadget.onSettingsClosed = SClosing;
}