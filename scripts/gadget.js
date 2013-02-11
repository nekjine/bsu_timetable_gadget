$(function(){
    $show("Инициализация...");
    document.body.style.width = 600;
    document.body.style.height = 300;
    document.body.style.padding = 0;

    var icon = "settings";
    $("settings_icon").onmouseover = function(){
        this.setAttribute("src", "files/"+icon+".png");
    }
    $("settings_icon").onmouseout = function(){
        this.setAttribute("src", "files/"+icon+"_.png");
    }
    var alter_vis = false;
    $("settings_icon").onmouseup = function(){
        if(!alter_vis){
            $("main").style.display = "none";
            $("alter").style.display = "block";
            alter_vis = true;
            icon = "ok";
            $("settings_icon").setAttribute("src", "files/"+icon+".png");
            $("settings_icon").setAttribute("title", "Leave the control area");
        }else{
            $("main").style.display = "";
            $("alter").style.display = "none";
            alter_vis = false;
            icon = "settings";
            $("settings_icon").setAttribute("src", "files/"+icon+".png");
            $("settings_icon").setAttribute("title", "Enter the control area");
        }
    }

    /*
        Get seconds before the next day
    */
    var date = new Date;
    var tstamp = +(date);

    var date0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var dateTomorrow = new Date( +date0 + 86400000 );

    var diff = +dateTomorrow - tstamp;
    /*
        When the next day comes, refresh timetable
    */
    $show("Загрузка расписания...");
    refresh_timetable("now");
    setTimeout(function(){
        refresh_timetable();
        setInterval(function(){
            refresh_timetable();
        }, 86400000)
    }, diff);
    /*
        
    */
    update_timetable();
    refresh_last_update();
});

/*
    UI listeners
*/
var bt_alter = function(element, alt){
    if(alt){
        element.className = "button_hover";
    }else{
        element.className = "button";
    }
}

var show_log = function(){
    if(FileExists("log.txt"))
        ShellExecute("log.txt");
    else
        $show("Журнал пуст")
}

var update_timetable = function(){
    $show("Проверка обновления...");
    app.update(function(err, result){
        if(err){
            $show("Ошибка обновления");
        }
        if(result == 1){
            // updated
            $show("Расписание обновлено");
            refresh_timetable();
            $set("last_update", GetDateStr());
            refresh_last_update();
        }else{
            $show("Обновление не требуется");
        }
    });
}

var show_entire_timetable = function(){
    ShellExecute("timetable.htm");
}

var delete_cache = function(){
    EmptyFile("table.json");
    EmptyFile("checksum.md5");
    $show("Кэш очищен");
}

var delete_log = function(){
    EmptyFile("log.txt");
    $show("Журнал очищен");
}
/*
    Stuff
*/
var add_subjects = function(table, TBLSubject){
    if(TBLSubject.length == 0){
        var tbody = document.createElement("tbody");
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        var div = document.createElement("div");
        div.className = "no_subjects";
        div.innerText = "Нет пар";
        td.appendChild(div);
        tr.appendChild(td);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        return;
    }
    for(var i=0; i<TBLSubject.length; ++i){
        var tbody = document.createElement("tbody");
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var div_time = document.createElement("div");
        var div_room = document.createElement("div");
        var div_type = document.createElement("div");
        var div_subj = document.createElement("div");
        var div_teach = document.createElement("div");
        td1.className = "col_time";
        td2.className = "col";
        td3.className = "col";
        div_time.className = "time";
        div_time.innerText = TBLSubject[i].time;
        div_room.className = "classroom";
        div_room.innerText = TBLSubject[i].classroom;
        div_type.className = "type";
        div_type.innerText = TBLSubject[i].type;
        div_subj.className = "sbj";
        div_subj.innerText = TBLSubject[i].subject;
        div_teach.className = "teacher";
        div_teach.innerText = TBLSubject[i].teacher;
        td1.appendChild(div_time);
        td2.appendChild(div_room);
        td2.appendChild(div_type);
        td3.appendChild(div_subj);
        td3.appendChild(div_teach);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tbody.appendChild(tr);
        table.appendChild(tbody);
    }
}

var remove_all_subjects = function(table){
    if (table.hasChildNodes()){
        while (table.childNodes.length >= 1){
            table.removeChild(table.firstChild);       
        } 
    }
}

var refresh_last_update = function(){
    if($get("last_update")){
        $("last_update").innerText = $get("last_update");
    }
}

var refresh_timetable = function(now){
    var date_today = new Date;
    var date0 = new Date(date_today.getFullYear(), date_today.getMonth(), date_today.getDate());
    var date_tomorrow = new Date( +date0 + 86400000 );

    setTimeout(function(){
        var week_td = get_week(date_today);
        var week_tm = get_week(date_tomorrow);
        var day_td = normalize_day(date_today.getDay());
        var day_tm = normalize_day(date_tomorrow.getDay());

        var ttable = app.getTBL();
        if(ttable == null){
            return;
        }
        $("today").innerText = GetDayStr(day_td);
        $("tomorrow").innerText = GetDayStr(day_tm);

        $("today_week").innerText = (week_td+1)+" неделя";
        $("tomorrow_week").innerText = (week_tm+1)+" неделя";
        remove_all_subjects($("subjs_left"));
        remove_all_subjects($("subjs_right"));
        add_subjects($("subjs_left"), ttable.fetch(week_td, day_td));
        add_subjects($("subjs_right"), ttable.fetch(week_tm, day_tm));
    }, now ? 1 : 2000);
}

var normalize_day = function(day){
    return --day < 0 ? 6 : day;
}

var get_week = function(date){
    if(date){
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
    var dd = Math.round(dt/86400000);
    var wd = Math.floor(dd / 7);
    var week = wd % 2;// 0 - second
    return week == 1 ? 0 : 1;// 21.08.2012 - reversed according to official timetable
}