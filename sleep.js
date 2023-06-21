let half="&frac12;";
function debug(...args) {
	console.debug(...args);
}
let dividingHour = localStorage.getItem("dividingHour")??15; //the local hour which divides one "day" from the next
//FIX: Read these from local
//Also want to add a preferences sheet
let OKscoreRanges = {sleep: [0,0.99], //these are min/max hours for "OK"
		   wake:[], //null means "I don't care"
		     diff:[7,7]};
function getTodaysNumber(div){
    div = div??dividingHour;
    let today = new Date()
    let minutesPerDay = 24*60
    let msPerMinute = 1000*60
    let unixTime = today.getTime()/minutesPerDay/msPerMinute //measured in days
    let divide = today.getTimezoneOffset() + div*60; //measured in minutes
    divide /= minutesPerDay //This is the fraction of unixTime at the divide
    return Math.floor(unixTime - divide)
}
function register(which) {
    let now = new Date();
    let minutes = ("00" + parseInt(now.getMinutes())).slice(-2);
    let time = now.getHours() + ":" + minutes;
    let day = getTodaysNumber();
    localStorage.setItem(`${which}${day}`,time);
    update();
}
function timeStr2Min(val) {
    val=val.split(":");
    return parseInt(val[0])*60 + parseInt(val[1]);
}
let AM = "am";
let PM = "pm";
function fromAMPM(val) {
    if (!val) {return "";}
    [hr,min] = val.split(":");
    hr = Number(hr);
    hr = hr%12;
    min = min.toLowerCase();
    if (min.includes("p")) {hr+=12;}
    min = min.replace(/[^0-9]+/,"");
    return `${hr}:${min}`;
}
function toAMPM(val) {
    if (!val) {return;}
    [hr,min] = val.split(":");
    if (hr==0) {return "12:"+min+AM;}
    if (hr==12) {return "12:"+min+PM;}
    if (hr<12) {return val+AM;}
    return `${hr-12}:${min}${PM}`;
}

function subtract(sleep,wake){
    if (!sleep || !wake) {return null;}
    sleep = timeStr2Min(sleep);
    wake = timeStr2Min(wake);
    let diff = (wake - sleep + 24*60)%(24*60); //this is in minutes
    diff = Math.round(diff/30); //half hours
    let hour = "" + (Math.floor(diff/2));
    if (diff%2) {hour+=half;}
    return hour;
}
function scoreTime(time,range){
    if (range.length==0) {return "";}
    if(!time) {return "";}
    if (typeof(time)==="string") {
	time = timeStr2Min(time);
    }
    if (time >= dividingHour*60) {time -= 24*60;}
    if (time<range[0]*60) {return "good";}
    if (time>range[1]*60) {return "bad";}
    return "ok";
}
function readDay(day) {
    let sleep = window.localStorage.getItem(`sleep${day}`);
    let wake  = window.localStorage.getItem(`wake${day}`);
    let diff  = subtract(sleep,wake);
    let sleepscore = scoreTime(sleep,OKscoreRanges.sleep);
    let wakescore = scoreTime(wake,OKscoreRanges.wake);
    let diffscore = "";
    if (diff) {
	diffV = Number((diff.endsWith(half))?(Number(diff.replace(half,""))+0.5):(diff));
	diffscore = "ok";
	if (diffV < OKscoreRanges.diff[0]) {diffscore = "bad";}
	if (diffV > OKscoreRanges.diff[1]) {diffscore = "good";}
    }	
    return {id: day,
	    sleep:toAMPM(sleep),
	    wake:toAMPM(wake),
	    diff:diff,
	    sleepscore: sleepscore,
	    wakescore: wakescore,
	    diffscore: diffscore
	   };
}
function getDates(N) {
    //get day information for the last N days
    let today = getTodaysNumber();
    let result = [];
    for (let day = today - (N-1); day<=today; day++) {
	result.push(readDay(day));
    }
    return result;
}
function updateButton(which,yesterQ=true){
    let dates=getDates(2);
    let text = dates[1][which];
    let isyester = false;
    if (!text && yesterQ) {
	text = dates[0][which];
	isyester = true;
    }
    text = text??"";
    $times[which].html(text).toggleClass("yesterday",isyester);
    return isyester;
}
function updateButtons(){
    let S = updateButton("sleep");
    let W = updateButton("wake",S);
}
function updateCalendar(N){
    $("#calendar").html("");
    let width = $("#calendar").width();
    let datewidth = 60;
    N = N??Math.floor(width/datewidth);
    N = Math.min(7,N);
    let dates = getDates(N);
    for(let day of dates) {
	let $day = $("<span>").attr("day",day.id).appendTo($("#calendar"));
	let $sleep = $("<div>").addClass("sleep").html(day.sleep).appendTo($day);
	$sleep.addClass(day.sleepscore);
	$sleep.attr({id:"sleep"+day.id, ctime:day.sleep});
	$sleep.on("click",(e)=>{editTime(e.target);});
	let $wake = $("<div>").addClass("wake").html(day.wake).appendTo($day);
	$wake.on("click",(e)=>{editTime(e.target);});
	$wake.attr({id:"wake"+day.id, ctime:day.wake});
	$wake.addClass(day.wakescore);
	let $diff = $("<div>").addClass("diff").html(day.diff).appendTo($day);
	$diff.addClass(day.diffscore);
	
    }
}
function remove(which) {
    if (!confirm(`Delete this ${which} time?`)) {return;}
    let today = getTodaysNumber();
    if($times[which].hasClass("yesterday")){today-=1;}
    localStorage.removeItem(`${which}${today}`);
    $times[which].removeClass("yesterday");
    update();
}
function fixTime(which,dir){
    let now = getTodaysNumber();
    let yester = $times[which].hasClass("yesterday");
    if(yester) {now -= 1;}
    let time = localStorage.getItem(which+now);
    if (!time) {return;}
    [hr,min] = time.split(":");
    hr = Number(hr);
    min = Number(min) + dir*10;
    while (min<0) {hr-=1; min+=60;}
    while (min>=60) {hr+=1; min-=60;}
    if (hr<0) {hr+=24;}
    if (hr>=24) {hr-=24;}
    hr = String(hr);
    min = ("00" + String(min)).slice(-2);
    localStorage.setItem(which+now,`${hr}:${min}`);
    update();
}
function makeButton(title){
    let which = title.toLowerCase();
    let $root = $("<div>").addClass("buttonframe").attr("id",which).appendTo("#buttons");
    let $left = $("<div>").addClass("side").appendTo($root);
//    let $advB = $("<img>").attr("src","decrease.png").addClass("sidebtn").appendTo($left);
//    $advB.on("click",(e,w=which)=>{fixTime(w,-1);});
    let $button = $("<div>").addClass("button").html(title).appendTo($root);
    let $time = $("<div>").addClass("time").appendTo($button);
    
    let $right = $("<div>").addClass("side").appendTo($root);
//    let $advF = $("<img>").attr("src","increase.png").addClass("sidebtn").appendTo($right);
//    $advF.on("click",(e,w=which)=>{fixTime(w,1);});
    let $trash = $("<img>").attr("src","trash.png").addClass("sidebtn").appendTo($right);
    $trash.on("click",(e,w=which)=>{remove(w);});
    $button.on("click",(e,w=which)=>{register(w);});
    return $time;
}
let $times={};
function update() {
    updateButtons();
    updateCalendar();
}
function doneEdit(e){
    let id = $(e.target).parent().attr("id");
    console.debug(e.target.value);
    let val = e.target.value;
    localStorage.setItem(id,val);
    e.target.blur();
    
}
function editTime(target){
    let $tgt = $(target);
    let code = $tgt.attr("id");
    let current = fromAMPM($tgt.html());
    console.debug(code,current);
    let $editor = $("<input type='time'>");
    $ed = $editor;
    $editor.val(current);
    $tgt.html("").append($editor);
    $editor.focus();
    $editor.on("input",doneEdit);
    $editor.on("keypress",(e)=>{
	if(e.which==13){
	    doneEdit(e);
	} else if(e.which==20) {
	    e.target.blur();
	}
    });
    $editor.on("blur",update);
}
function init() {
    $times.sleep = makeButton("Sleep");
    $times.wake= makeButton("Wake");
    update();
}
$(init);
