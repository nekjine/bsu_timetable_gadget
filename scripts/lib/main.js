/*
    App object
    public methods: 
    - update: updates current timetable, always must be called when app starts
    - getTBL: return timetable object
*/
var app = {
    __url : "http://www.bsu.ru?mod=rasp"
,   __postdata : "t=wgroup%5B%5D&wgroup%5B%5D=05290"
,   timetable : null
};

app.update = function(fn){
    var self = this;
    app.loadData(function(err, data){
        if(err){
            return fn(err);
        }
        var trimmedData = self.trimData(data);
        var new_sum = hex_md5(trimmedData);
        var old_sum = self.loadChecksum();
        var old_table = self.getTBL();
        // $show(new_sum + ", " + old_sum)
        if(new_sum == old_sum && old_table != null){ // our table is up to date
            self.timetable = self.loadTBL();
            return fn(null, 0);
        }
        var new_table = self.parseData(trimmedData);
        self.timetable = new_table;
        self.saveTBL(new_table);
        self.saveTBLpage(new_table);
        self.saveChecksum(new_sum);
        if(old_table != null){
            self.analyzeDiffs( old_table, new_table );
        }
        return fn(null, 1);
    });
}

app.getTBL = function(){
    if(!this.timetable){
        this.timetable = this.loadTBL();
    }
    return this.timetable;
}

/*
    App object
    private methods:
    - loadChecksum: returns checksum of raw data
    - saveChecksum: saves checksum of raw data
    - loadData: does post to __url and returns raw data
    - trimData: trims raw data, returns trimmed
    - parseData: parses trimmed data, returns TBL object
    
    - loadTBL: loads timetable from storage, returns TBL object
    - analyzeDiffs(timetable T, timetable T2): analyzes differences btw T & T2, logs them to file then
    - saveTBL: saves timetable to storage
*/

app.loadChecksum = function(){
    return ReadFile("checksum.md5");
}

app.saveChecksum = function(newSum){
    WriteFile("checksum.md5", newSum);
}

app.loadTBL = function(){
    var f = ReadFile("table.json");
    if(f)
        return new TBL(JSON.parse(f));
    else
        return null;
}

app.saveTBL = function(tbl){
    WriteFile("table.json", JSON.stringify(tbl.getRawTable()));
}

app.saveTBLpage = function(tbl){
    var str = '<!doctype html><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><link rel="stylesheet" href="file:///C:/Users/Whirpool/AppData/Local/Microsoft/Windows%20Sidebar/Gadgets/timetable.gadget/files/main.css" /></head><body>';

    for(var week=0; week<2; ++week){
        for(var day=0; day<6; ++day){
            str += '<table id="main" class="main" cellspacing="0" cellpadding="0"><tr style="height:30px"><td class="s t"><div id="today" class="header_day">'+GetDayStr(day)+'</div> <div id="today_week" class="header_week">'+(week+1)+'</div> </td> </tr><tr><td class="s"><table id="subjs_left" class="subjects" align="center">'
            var subjs = tbl.fetch(week, day);
            for(var i=0; i<subjs.length; ++i){
                str += '<tr><td class="col_time"><div class="time">'+subjs[i].time+'</div></td><td class="col"><div class="room">'+subjs[i].classroom+'</div><div class="type">'+subjs[i].type+'</div></td><td class="col"><div class="subj">'+subjs[i].subject+'</div><div class="teach">'+subjs[i].teacher+'</div></td></tr>'
            }
            str += '</table></td></tr></table>'
        }
    }
    str += "</body></html>";
    WriteFile("timetable.hta", str, false, false);
}

function logForDay(week, day, oldt, newt){
    // god bless this piece of code
    var str = "********** "+GetDateStr() +  " **********:\r\nИзменения на " + GetDayStr(day) + ", " + (week+1) + " неделя\r\nБыло\r\n";
    for(var i=0; i<oldt.length; ++i){
        str += oldt[i].time + " / " + oldt[i].classroom + " / " + oldt[i].subject + " / " + oldt[i].type + " / " + oldt[i].teacher + "\r\n";
    }
    str += "Стало\r\n";
    for(var i=0; i<newt.length; ++i){
        str += newt[i].time + " / " + newt[i].classroom + " / " + newt[i].subject + " / " + newt[i].type + " / " + newt[i].teacher + "\r\n";
    }
    WriteFile("log.txt", str, true);
}

app.analyzeDiffs = function(oldTBL, newTBL){
    for(var week=0; week<2; ++week){
        for(var day=0; day<6; ++day){
            var oldt = oldTBL.fetch(week, day);
            var newt = newTBL.fetch(week, day);
            if(oldt.length != newt.length){
                logForDay(week, day, oldt, newt);
            }else{
                for(var i=0; i<oldt.length; ++i){
                    if(!ObjEqual(oldt[i], newt[i])){
                        logForDay(week, day, oldt, newt);
                        break;
                    }
                }
            }
        }
    }
}

app.loadData = function(fn){
    var req = new XMLHttpRequest();
    req.open("post", this.__url);
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.onreadystatechange = function(){
        if(req.readyState == 4){
            if(req.status == 200){
                fn(null, req.responseText);
            }else{
                fn(error);
            }
        }
    }
    req.send(this.__postdata);
}

app.trimData = function(data){
    var ks1 = "Занятия очной формы обучения. Группа 05290";
    var ks2 = "</TD></TR></TABLE></td></tr></table>";
    var pos1 = data.indexOf(ks1);
    var pos2 = data.indexOf(ks2);
    if(pos1 == -1 || pos2 == -1){
        return -1;
    }
    return data.substr( pos1+ks1.length, pos2-pos1-ks1.length );
}

// returns what a chunk in array[i] in app.parseData mean
// returns [ int meaning, value ]
var _recognize = function(string){
    if(/время|ауд\.|предмет|тип|преподаватель/i.test(string)){
        return [0];
    }
    if(/неделя/i.test(string)){
        return [1, parseInt(string.charAt(0))-1];
    }
    if(/понедельник|вторник|среда|четверг|пятница|суббота|воскресенье/i.test(string)){
        return [2, {
            "понедельник": 0
        ,   "вторник": 1
        ,   "среда": 2
        ,   "четверг": 3
        ,   "пятница": 4
        ,   "суббота": 5
        ,   "воскресенье": 6
        }[string.toLowerCase()]];
    }
    if(/^[0-9]+\:[0-9]+$/.test(string)){
        return [3, string];
    }
    if(/^[0-9]{3,4}$/.test(string)){
        return [4, string];
    }
    if(/^(ЛК|ЛБ|ПР)$/.test(string)){
        return [6, string];
    }
    if(/^([а-яА-Я]|\.|\s)+[А-Я]{1}\.[А-Я]{1}\.$/.test(string)){
        return [7, string];
    }
    if(/^([а-яА-Я0-9]|\.|\,|\s|\-)+$/.test(string)){
        return [5, string];
    }
    return [-1];
}

app.parseData = function(data){
    // very ugly but workable :()
    var array = data
                .replace(/<([a-zA-Z0-9]|\/|\s|\=|\")+>/g, "|")
                .match(/\|([а-яА-Я0-9]|\.|\,|\s|\:|\-)+(\||\0|\s)/g)

    var cWeek = null;
    var cDay = null;
    // var cSubjects = null;
    var cSubject = null;
    var table = new TBL();

    for(var i=0; i<array.length; ++i){
        array[i] = array[i].replace(/\|/g, "").replace(/(^\s+|\s+$)/g, ""); // clean this element of |
        var xm = _recognize(array[i]); // get this element's meaning
        var meaning = xm[0];
        var value = xm[1];
        switch(meaning){
            case 0:// garbage
                continue;
            break;
            case 1:// week
                cWeek = value;
            break;
            case 2:// day of week
                cDay = value;
            break;
            case 3:// time
                cSubject = {};
                cSubject.time = value;
            break;
            case 4:// classroom
                cSubject.classroom = value;
            break;
            case 5:// subject
                cSubject.subject = value;
            break;
            case 6:// type
                cSubject.type = value;
            break;
            case 7:// teacher
                cSubject.teacher = value;
                table.push(cWeek, cDay, cSubject);
            break;
        }
    }
    return table;
}

/*
    TBL class
    - this.table: represent time table. array:
        [0 .. 1][0 .. 6][0 .. x] = {"time" : time, "teacher" : teacher, "subject" : subject, "type" : type, "classroom" : classroom}
    public methods:
    - fetch: returns array of subjects in given day
    - push: adds a new subject to the day of week
*/
function TBL(rawTable){
    if(rawTable){
        this.table = rawTable;
    }else{
        this.table = [];
        for(var i=0; i<2; ++i){
            this.table[i] = [];
            for(var j=0; j<7; ++j){
                this.table[i][j] = [];
            }
        }
    }
}

TBL.prototype.fetch = function(week, day){
    return this.table[week][day];
}

// TBL.prototype.getForDayCount = function(week, day){

// }

TBL.prototype.push = function(week, day, daySubjects){
    this.table[week][day].push(daySubjects);
}

TBL.prototype.getRawTable = function(){
    return this.table;
}
