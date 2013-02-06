// ***********************
// * helpers
// ***********************
function inArray(array, value){
    for(i=0; i<array.length; ++i){
        if(array[i] == value){
            return i;
        }
    }
    return -1;
}
// ***********************
// * ActiveX stuff
// ***********************
// reads cache file
// if file is empty or doesnt exist returns null
function readCacheFile(){
    var aX = new ActiveXObject("Scripting.FileSystemObject");
    var f = aX.openTextFile(System.Gadget.path + "\\" + "cache.txt", 1, true);
    var res = null;
    if(f.atEndOfStream == false){
        res = f.readAll();
    }
    f.close();
    return res;
}
// writes cache file
function writeCacheFile(data){
    var aX = new ActiveXObject("Scripting.FileSystemObject");
    var f = aX.createTextFile(System.Gadget.path + "\\" + "cache.txt", true);
    f.write(data);
    f.close();
}
// ***********************
// * Time stuff
// ***********************
// getWeek(date) returns week type (1 or 0)
var dayName = [
    "понедельник",
    "вторник",
    "среда",
    "четверг",
    "пятница",
    "суббота",
    "воскресенье"
];
var msecInDay = 86400000;
// getWeek(date) returns week type (1 or 0)
function getWeek(date){
    if(date != undefined){
        var today = new Date(date);
    }else{
        var today = new Date();
    }
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var then = new Date("16 January 2012 00:00");
    var t = today.getTime();
    var t0 = then.getTime();
    var dt = Math.abs(t - t0);
    var dd = Math.round(dt/msecInDay);
    var wd = Math.floor(dd / 7);
    var week = wd % 2;// 0 - second
    return week == 1 ? 1 : 2;// 21.08.2012 - reversed accordingly to official timetable
}
// converts sunday-started-week-index to monday-swi
// ! delete this
function monDay(day){
    if(day==0){
        return 6;
    }
    return --day;
}
// offsets current date
function offsetDate(days){
    date = new Date();
    date.setTime( date.getTime() + days * msecInDay );
    return date;
}
// ***********************
// * Main part
// ***********************
// parses cache file, returns ready-to-use string
function parseCache(){
    var rawSubstr = readCacheFile();
    // cuts off these tags
    var strings = new Array();
    var skip = 0;
    var split = false;
    var k = -1;
    var ws = false;
    
    for(i=0; i<rawSubstr.length; ++i){
        if(rawSubstr.charAt(i) == "<"){
            skip = 0;
        }
        else if(rawSubstr.charAt(i) == ">"){
            skip = 1;
            split = true;
            ws = true;
        }
        if(skip > 1){
            if(split){
                if(k==-1 || strings[k].join("") != "")
                    ++k;
                strings[k] = new Array();
                split = false;
            }
            if(rawSubstr.charAt(i) != " " && rawSubstr.charAt(i) != "\n"){
                ws = false;
            }
            if(!ws){
                strings[k].push(rawSubstr.charAt(i));
            }
        }
        else if(skip == 1){
            skip = 2;
        }
    }
    return strings;
}
var updateStatus = null;
var updateError = null;
var UPDATE_TIMEOUT = 3600;
function updateCache(){
    updateStatus = -1;
    var updUrl = "http://www.bsu.ru?mod=rasp";
    var updPostData = "t=wgroup%5B%5D&wgroup%5B%5D=05290";
    var keyString1 = "Занятия очной формы обучения";
    var keyString2 = "</TD></TR></TABLE></td></tr></table>";
    
    var ReqObject = new XMLHttpRequest();
    ReqObject.open("post",updUrl);
    ReqObject.onreadystatechange = function(){
        if(ReqObject.readyState == 4){
            if(ReqObject.status == 200){
                var text = ReqObject.responseText;
                // searches key-string
                var ksPos = text.indexOf(keyString1);
                var ksEnd = text.indexOf(keyString2);
                if(ksPos == -1 || ksEnd == -1){
                    // ERROR ***************************************
                    updateStatus = 48;
                    updateError = "bad tokens";
                    return;
                }
                var ksLen = ksEnd - ksPos;
                var rawSubstr = text.substr(ksPos, ksLen);
                //setTempState("gained "+rawSubstr.length+" bytes", 4000);
                if(readCacheFile() == rawSubstr){
                    updateStatus = 0;
                }else{
                    writeCacheFile(rawSubstr);
                    updateStatus = 1;
                }
            }else{
                updateStatus = 48;
                updateError = ReqObject.statusText;
            }
        }
    }
    ReqObject.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    //try{
        ReqObject.send(updPostData);
    //}catch(e){
    //    setTempState("something wrong", 1000);
    //}
}
function formTimetable(week, day){
    var strings = parseCache();
    var weekStr = week + " неделя";
    var dayStrArray = ["ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА", "ВОСКРЕСЕНЬЕ"];
    var resultArray = new Array();
    
    for(i=0; i<strings.length; ++i){
        if(strings[i].join("") == weekStr){
            for(j=i+1; j<strings.length; ++j){
                if(strings[j].join("") == dayStrArray[day]){
                    for(k=j+1; k<strings.length; ++k){
                        if(inArray(dayStrArray, strings[k].join("")) == -1 && strings[k].join("").indexOf("еделя") == -1){
                            resultArray.push(strings[k].join(""));
                        }else{
                            break;
                        }
                    }
                    break;
                }
            }
            break;
        }
    }
    
    if(resultArray.length == 0){
        // ERROR ***************************************
        return "нет пар";
    }
    var result = "";
    var j = 0;
    for(i=5; i<resultArray.length; ++i,++j){
        if(j==5){
            j = 0;
            result += "\n";
        }
        
        result += resultArray[i];
        if(j!=4){
            result += " \\ ";
        }
    }
    return result;
}
// ***********************
// * GUI
// ***********************
//var tobjStatus = null;
var statusTexts = ["Проверка обновления", "Проверка обновления.", "Проверка обновления..", "Проверка обновления..."];
var statusTextsIndex = null;
var statusInterval = null;
function startLoadingState(){
    showStateBlock();
    statusTextsIndex = 1;
    $("spanState").innerText = statusTexts[0];
    statusInterval = window.setInterval(function(){
        $("spanState").innerText = statusTexts[statusTextsIndex];
        statusTextsIndex = (statusTextsIndex + 1) % statusTexts.length;
    }, 200);
}
function stopLoadingState(){
    clearInterval(statusInterval);
    hideStateBlock();
}
function setTempState(text, time){
    $("spanState").innerText = text;
    showStateBlock();
    //if(time == 0){
    //    tobjStatus.value = text;
    //}else{
        setTimeout(function(){
            hideStateBlock();
        }, time);
    //}
}
var tobjLeftTable = null,
    tobjRightTable = null,
    tobjLeftHeader = null,
    tobjRightHeader = null;

function showTimetable(){
    var sDate = offsetDate(0);
    var week = getWeek(sDate);
    var day = monDay(sDate.getDay());
    tobjLeftHeader.value = "Сегодня: "+dayName[day]+", "+week+" неделя";
    tobjLeftTable.value = formTimetable(week, day);
    
    var sDate = offsetDate(1);
    var week = getWeek(sDate);
    var day = monDay(sDate.getDay());
    
    tobjRightHeader.value = "Завтра: "+dayName[day]+", "+week+" неделя";
    tobjRightTable.value = formTimetable(week, day);
}
function clearTimetable(){
    for(i=0;i<tobjLeftTable.length;++i) tobjLeftTable[0].value = " ";
}
function showStateBlock(){
    $("divState").style.display = "";
}
function hideStateBlock(){
    $("divState").style.display = "none";
}
function hideMouseDown(){
    hideStateBlock();
}
function prefsChanged(){
    var color = PrefGets("fontColor");
    tobjLeftHeader.color = color;
    tobjRightHeader.color = color;
    tobjLeftTable.color = color;
    tobjRightTable.color = color;
    var shColor = PrefGets("shadowColor");
    tobjLeftHeader.addShadow(shColor, tableTextStyle.shadowRadius, tableTextStyle.shadowAlpha, tableTextStyle.shadowDeltaX, tableTextStyle.shadowDeltaY);
    tobjRightHeader.addShadow(shColor, tableTextStyle.shadowRadius, tableTextStyle.shadowAlpha, tableTextStyle.shadowDeltaX, tableTextStyle.shadowDeltaY);
    tobjLeftTable.addShadow(shColor, tableTextStyle.shadowRadius, tableTextStyle.shadowAlpha, tableTextStyle.shadowDeltaX, tableTextStyle.shadowDeltaY);
    tobjRightTable.addShadow(shColor, tableTextStyle.shadowRadius, tableTextStyle.shadowAlpha, tableTextStyle.shadowDeltaX, tableTextStyle.shadowDeltaY);
}
function update(){
    System.Gadget.Flyout.show = false;
    if(updInterval != null) return;
    
    startLoadingState();
    updateCache();
    updTicks = 0;
    
    updInterval = setInterval(function(){
        if(updTicks >= UPDATE_TIMEOUT){
            setTempState("Превышен интервал ожидания", 4000);
            clearInterval(updInterval);
            updInterval = null;
            stopLoadingState();
        }
        if(updateStatus != -1){
            clearInterval(updInterval);
            updInterval = null;
            stopLoadingState();
            
            if(updateStatus <= 1){
                if(updateStatus == 0){
                    setTempState("Без изменений", 2000);
                }else{
                    setTempState("Расписание обновлено", 4000);
                    showTimetable();
                }
            }else if(updateStatus == 48){
                setTempState("Ошибка обновления: "+updateError, 10000);
            }
        }
        ++updTicks;
    }, 100);
}
// ***********************
// * Initialize
// ***********************
var tableTextStyle = {
    color: "white",
    size: 12,
    shadowColor: "black",
    shadowRadius: 4,
    shadowAlpha: 100,
    shadowDeltaX: 0,
    shadowDeltaY: 0
};
var updInterval = null;
var updTicks = null;
Initialize({width: 680, height: 200}, "flyout.html", function(){
    $("btnSync").onclick = prefsChanged;
    $("btnSyncUpd").onclick = update;
    SetTextNode($("imgBackground"));
    
    if(PrefGets("fontColor")=="")   PrefSets("fontColor", "white");
    if(PrefGets("shadowColor")=="") PrefSets("shadowColor", "black");
    tableTextStyle.color =          PrefGets("fontColor");
    tableTextStyle.shadowColor =    PrefGets("shadowColor");
    
    tobjLeftHeader  =   AddText(" ", 0, 0, tableTextStyle);
    tobjRightHeader =   AddText(" ", 340, 0, tableTextStyle);
    tobjLeftTable   =   AddText(" ", 0, 25, tableTextStyle);
    tobjRightTable  =   AddText(" ", 340, 25, tableTextStyle);
    
    // show old timetable
    showTimetable();
    // start update
    update();
});