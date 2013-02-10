function $(arg){
    if(typeof(arg) == "function"){
        return window.attachEvent("onload", arg);
    }else
    if(typeof(arg) == "string"){
        return document.getElementById(arg);
    }
}
function ObjEqual(obj1, obj2){
    for(var key in obj1){
        if(obj2[key] != obj1[key]){
            return false;
        }
    }
    for(var key in obj2){
        if(obj2[key] != obj1[key]){
            return false;
        }
    }
    return true;
}
function GetDateStr(){
    var d = new Date;
    return d.getDate() + "." + (d.getMonth()+1) + "." + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
}
function GetDayStr(dayNum){
    return ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"][dayNum];
}
function ReadFile(filename){
    var aX = new ActiveXObject("Scripting.FileSystemObject");
    try{
        var f = aX.openTextFile(System.Gadget.path + "\\" + filename, 1, false, true);
    }catch(e){
        return null;
    }
    var res = null;
    if(f.atEndOfStream == false){
        res = f.readAll();
    }
    f.close();
    return res;
}
function WriteFile(filename, data, append){
    if(!append){
        append = 2;
    }else{
        append = 8;
    }
    var aX = new ActiveXObject("Scripting.FileSystemObject");
    // var f = aX.createTextFile(System.Gadget.path + "\\" + filename, true);
    var f = aX.openTextFile(System.Gadget.path + "\\" + filename, append, true, true);
    f.write(data);
    f.close();
}
function EmptyFile(filename){
    WriteFile(filename, "", false);
}
function ShellExecute(filename){
    var sa = new ActiveXObject("Shell.Application");
    sa.ShellExecute(System.Gadget.path + "\\" + filename);
}
// FOR IE DEBUGGING
// var $set, $get, $show;
// if(true){
    var $set = function(key, val){
        System.Gadget.Settings.writeString(key, val);
    }
    var $get = function(key){
        return System.Gadget.Settings.readString(key);
    }

    var $show_timeout = null;
    $show = function(str){
        $("console").style.display = "inline";
        $("console").innerText = str;
        if($show_timeout){
            clearTimeout($show_timeout);
        }
        $show_timeout = setTimeout(function(){
            $("console").style.display = "none";
        }, 3000);
    }
// }else{
    // System = {Gadget : {path : "D:\\"}};
    // storage = {};
    // $set = function(key, val){
    //     storage[key] = val;
    // }
    // $get = function(key){
    //     return storage[key];
    // }
    // $show = function(str){
    //     alert(str);
    // }
// }