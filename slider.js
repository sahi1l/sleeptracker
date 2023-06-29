let half="&frac12;";
class Slider {
    constructor($root,label,init,callback) {
        this.$container = $("<div>").appendTo($root).addClass("slidercontainer");
        this.label = label;
        this.callback = callback;
        this.update = this.update.bind(this);
        this.$w = $("<div>").appendTo(this.$container).addClass("slider");
        this.$range = $("<span>").addClass("range").html("xxx");
        this.$norate = $("<label>").html("Don't rate").addClass("norate").appendTo(this.$container);
        this.$noratebox = $('<input type="checkbox">').addClass("checkbox").appendTo(this.$norate);
        this.updateNoRate = this.updateNoRate.bind(this);
        this.$noratebox.on("change",(x) => {this.norating = !this.norating; this.updateNoRate();});
        this.norating = ($.isEmptyObject(init));
    }
    update(values,min,max,offset,flipQ=false){
        let colors = ["green","red"];
        if(flipQ){colors = ["red","green"];}
        let gradient = `linear-gradient(to right,${colors[0]} ${min}%, ${colors[1]} ${max}%)`;
        this.$outerbars.css({background: gradient});
        this.$range.html(`OK ${this.label}: ${values[0]}-${values[1]}`);
        this.$range.css({left: `${(min+max)/2-offset}%`});
        if(this.callback) {this.callback();}
    }
    postinit() {
        this.$w.append(this.$range);
        this.$outerbars = this.$w.find(".noUi-connects");
        if(this.norating) {
            this.$noratebox.prop("checked",true);
            this.updateNoRate();
        }
        this.slider.on("update",this.update.bind(this));
    }
    
    updateNoRate() {
        let norate = this.norating;
        this.$noratebox.prop("checked",norate);
        this.$norate.toggleClass("norateON",norate);
        this.$outerbars.toggle(!norate);
        if(norate) {
            this.slider.disable();
        } else {
            this.slider.enable();
        }
        if(this.callback) {this.callback();}
    }
    get() {
        let ranges = [];
        if (!this.norating) {
            ranges = this.slider.get();
        }
        return ranges;
    }
    rating(value){
        if(!value) {return 2;}
        let get = this.get();
        if (get.length==0) {return 2;}
        console.group();
        console.log("get for ",this.label,get);
        
        let ranges = get.map((x)=>this.string2Num(x,true)); //true means "wrap around"
        console.log("ranges:",ranges);
        console.log("value:",value);
        let val = this.string2Num(value,true);
        console.log("val",val);
        let score = 0;
        if(ranges[1]<val) {score=-1;} //on the right
        if(ranges[0]>val) {score=1;} //on the left
        console.log("score",score);
        console.groupEnd();
        return score;
    };
}
export class diffSlider  extends Slider {
    constructor($root,label,init,callback) {
        super($root,label,init,callback);
        init = this.norating ? [8,8] : init;
        this.slider = noUiSlider.create(this.$w[0], {
            range: {
                'min': 0,
                'max': 12,
            },
            step: 0.5,
            start: init,
            connect: true,
            tooltips: false,
            format: {
                to: this.num2String,
                from: this.string2Num,
            },
            pips: {
                mode: "steps",
                density: 10,
                format: {
                    to: this.num2String,
                    from: this.string2Num,
                },
                filter: function(x) {
                    if (x%1) {return 0;}
                    return 1;
                }
            },
        });
        this.postinit();
    }
    
    update(values,handle,unencoded,tap,positions,slider) {
        let [min,max] = unencoded.map((x) => Math.round(x/12*100));
        super.update(values,min,max,3,true);
        }
    num2String(value) {
        return value.toFixed(1).replace(".0","").replace(".5",half);
    }
    string2Num(value) {
        value = value.replace(half,".5");
        return Number(value);
    }
}
export class timeSlider extends Slider {
    constructor($root,label,init,dividingHour,callback) {
        super($root,label,init,callback);
        init = this.norating ? ["12a","12a"] : init;
        this.dH = dividingHour; //dividing hour
        this.offset = 15;
        for (let i in init) {
            init[i] = this.string2Num(init[i]);
            while (init[i]<this.offset) {init[i]+=24;}
        }
        this.slider = noUiSlider.create(this.$w[0], {
            range: {
                'min': 0+this.offset,
                'max': 24+this.offset,
            },
            step: 0.5,
            start: init,
            connect: true,
            tooltips: false,
            format: {
                to: this.num2String,
                from: this.string2Num,
            },
            pips: {
                mode: "steps",
                density: 10,
                format: {
                    to: this.num2String,
                    from: this.string2Num,
                },
                filter: function(x) {
                    if (x%1) {return -1;}
                    if (x%3) {return 0;}
                    if (x%6) {return 1;}
                    return 1;
                }
            },
        });
        this.postinit();
    }
        
    update(values,handle,unencoded,tap,positions,slider) {
        let [min,max] = unencoded.map((x) => Math.round((x-this.offset)/24*100));
        super.update(values,min,max,7,false);
    }
    num2String(value){
        let hr = Math.floor(value);
        let ampm = ((hr%24)>11)?"p":"a";
        hr = (hr+11)%12 + 1;
        let minute="";
        if (value.toFixed(1).endsWith(5)) {minute=":30";}
        return hr+minute+ampm;
    }
    string2Num(value,wrap=false) {
        let pm = value.includes("p");
        value = value.replace(/[^0-9:]/g,"").split(":");
        let result = Number(value[0]);
        if (pm && (value[0]%12)) {result += 12;}
        if (!pm && value[0]==12) {result = 24;}
        
        let debug = {wrap:wrap,value0:value[0],dH:this.dH,result:result};
        if (wrap && result>=this.dH) {result -= 24;}
        debug.result2 = result;
        console.log(debug);
        if (value[1]) {result += value[1]/60;}
        return result;
    }
}

    
