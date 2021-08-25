var UWGame = unsafeWindow.Game;
unsafeWindow.UWGame = UWGame;

(function(){
    loadCss();
    createCurtain();
    waitForLoading();
})();

function waitForLoading(){
  var interval = setInterval(function() {
        if(document.readyState === 'complete' && $(".tb_activities.toolbar_activities .middle")[0]) {
            clearInterval(interval);
            loadFarmingButton();
            updateFarmingButton();
        }
    },100)
}

function loadCss(){
    var styling = document.createElement('link');
    styling.type =' text/css';
    styling.rel = 'stylesheet';
    styling.href = 'https://cdn.jsdelivr.net/gh/horziest/AiE/style.css';
    document.body.appendChild(styling);
    console.log("FarmVp Css Loaded");
}

// Protection Curtain
function createCurtain(){
    var css = "height: 100%; position: fixed; z-index: 8000; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.6); width: 100%; visibility: hidden;";
    var curtain = document.createElement("div");
    curtain.setAttribute("id", "curtain_farm");
    curtain.setAttribute("style", css);
    document.body.append(curtain);
}

function showCurtain() {
    var showcurtain = document.getElementById('curtain_farm');
    showcurtain.style.visibility = "visible";
    console.log("Curtain " + showcurtain.style.visibility);
}

function hideCurtain() {
    var hidecurtain = document.getElementById('curtain_farm');
    hidecurtain.style.visibility = "hidden";
    console.log("Curtain " + hidecurtain.style.visibility);
}

//Farming Button to start Bot
function loadFarmingButton() {

    var farmButton = document.createElement('div');
    farmButton.classList += 'toolbar_button farmButton';
    var icon = document.createElement('div');
    icon.classList += 'icon farmIcon ' + farmVpStatus;
    var count = document.createElement('div');
    count.classList += 'count js-caption farmCounter';
    count.innerText = 0;
    icon.appendChild(count);
    farmButton.append(icon);
    $(".toolbar_buttons")[0].append(farmButton);
    
    //Turns on and off The Farm Bot on click
    $(".farmButton").click(function() {
        console.log('vpButton is working');
        if (farmVpStatus == "inactive"){
            farmVpStatus = "active";
            $(".farmIcon")[0].classList.replace("inactive", "active");
            loopVP();
        } else if (farmVpStatus == "active"){
            farmVpStatus = "inactive";
            $(".farmIcon")[0].classList.replace("active", "inactive");
        }
    });

    $( 'body' ).on( 'click', '#fto_claim_button', function() {
        var time = $( '#time_options_wrapper .fto_time_checkbox.active' ).attr( 'data-option' );
        if($( '#time_options_wrapper .time_options_loyalty .fto_time_checkbox.active' ).attr( 'data-option' )>time){
            time = $( '#time_options_wrapper .time_options_loyalty .fto_time_checkbox.active' ).attr( 'data-option');
        }
    } );

    console.log('%cNerissEssential_VP is loaded !', 'color: red; font-size: 1em; font-weight: bolder; ');
}

function updateFarmingButton(){
    if($(".captain_active").length > 0){
        // update the timer
        var dateNext = new Date(0);
        dateNext.setUTCSeconds(GM_getValue( UWGame.world_id + '_grepolis-claim-ready') / 1000);
        var dateNow = new Date(0);
        dateNow.setUTCSeconds($.now() / 1000);
        if(dateNext < dateNow) $(".farmCounter")[0].innerText = "0";
        else $(".farmCounter")[0].innerText = Math.abs(dateNext - dateNow) / 1000;

        setTimeout(function() {
            updateFarmingButton();
        }, 1000);
    }
}



/*******************************************************************************************************************************
 *      Auto Farm VP
 *******************************************************************************************************************************/

 var pause = 1111;

 var farmMode = 10;

 var tempsMini = 1;
 var tempsMaxi = 45;

 var farmVpStatus = "inactive";
 var tempsAlea = 0;
 var delayNextVP = 0;

// LOW QUALITY / UNREADABLE CODE UNDER
//
// Loop starts one Promise that farms the VP (farmVP)
// Once the promise is resolved it launches a second one that waits for VP to be ready (Sleep)
// It then starts the loop again


function loopVP(){
    tempsAlea = createTempsAlea(tempsMini, tempsMaxi);
    delayNextVP = (60 * farmMode + tempsAlea)*1000;
    var farmVP = new Promise((resolve, reject) => {
        setTimeout(() => {
            recupVP(resolve);
        },100);
    });
    farmVP.then((value) => {
        //value is nextFarmTimestamp
        console.log("Phase D'attente");
        if (value == 0){
            waitVP(delayNextVP);
        } else {
            delayNextVP = value - Date.now() + tempsAlea*1000;
            //GM_setValue( UWGame.world_id + '_grepolis-claim-ready', (( parseInt( $.now() ) ) + ( parseInt( time ) * 1000)) );
            console.log("delayNextVP = " + delayNextVP);
            waitVP(delayNextVP);
        }
    });
}

function waitVP(delayNextVP){
    var farmTimestamp = Date.now() + delayNextVP;
    var interval = 1000;
    GM_setValue( UWGame.world_id + '_grepolis-claim-ready', farmTimestamp );

    var sleep = new Promise((resolve, reject) => {
        var timerVP = setInterval(function(){
            if(Date.now()>farmTimestamp){
                resolve("Début du Farming");
                clearInterval(timerVP);
            }
            if (farmVpStatus == "inactive"){
                reject("farmVpStatus est inactif");
            }
        },interval);
    });
    sleep.then((value) => {
        console.log("------------------------------");
        console.log(value);
        loopVP();
    });
}

function recupVP(finishFarm){
    showCurtain();
    var curtainActivated = new Promise((resolve, reject) => {
        setTimeout(() => { //Ouvre l'aperçu "Villages de paysans" si nécéssaire
            var all_cities = document.querySelector("#fto_town_wrapper div div.game_header.bold span a");
            if (all_cities == null) {
                console.log("Ouverture de l'interfaces des villages paysans.");
                document.querySelector("#overviews_link_hover_menu div.box.middle.left div div ul li.subsection.captain.enabled ul li.farm_town_overview a").click();
            }
            setTimeout(function() {
                //selects first city on fto list
                document.querySelector("#fto_town_list li.fto_town").click();
                setTimeout(function() {
                    //Vérifie si les vps sont disponible
                    var isAvailable = document.querySelector(".ribbon_wrapper");
                    if (isAvailable.classList.contains("hidden")){
                        //Clique sur "Tout sélectionner"
                        document.querySelector("#fto_town_wrapper div div.game_header.bold span a").click();
                        //Séléction du temps
                        setTimeout(() => {
                            if (farmMode != 10) {
                                console.log('smiley');
                                setTimeout(choiceMode(farmMode), pause);
                            }
                        },pause);
                        clickRessources(resolve);						
                    } 
                    // Sinon il appointe la prochaine prise de vp
                    else {
                        var dateToday = new Date();
                        var unlockTime = document.querySelector(".unlock_time").textContent.slice(14,22);
                        var timeMin = dateToday.toLocaleTimeString("en-GB");

                        var timeUnlock = dateToday.toLocaleDateString('en-US')+" "+unlockTime;
                        var timestampUnlock = Date.parse(timeUnlock);
                        var timeToday = dateToday.toLocaleDateString('en-US')+" "+timeMin;
                        var timestampToday = Date.parse(timeToday);
                        
                        //vérifie quel jour il lance
                        if(timestampUnlock<timestampToday){
                            var dateTomorow = new Date();
                            dateTomorow.setDate(dateToday.getDate() + 1); 
                            var nextTime = dateTomorow.toLocaleDateString('en-US')+' '+unlockTime;
                            var nextFarmTimestamp = Date.parse(nextTime);
                        }else{
                            var nextFarmTimestamp = timestampUnlock;
                        }
                        setTimeout(function(){
                            console.log("tempsAlea : " + tempsAlea);
                            console.log(nextFarmTimestamp);
                            closeVP();
                            setTimeout(() => {resolve(nextFarmTimestamp);},100);
                        },100);
                    }
                },300);
            }, pause);
        },pause);
    })
    curtainActivated.then((value) => {
        console.log("Farming Finit");
        setTimeout(function() {
            hideCurtain();
        },750);
        //Prommesse farmVP est tenue
        finishFarm(value);
    });
}

function clickRessources(resolve){
    setTimeout(function() {
        document.querySelector("#fto_claim_button div.caption.js-caption").click();
        setTimeout(function() {
            document.querySelector('.window_curtain .btn_confirm').click();

            console.log('Récolte des paysans effectué à : ', Date());

            console.log("Temps Aleatoire:" + tempsAlea);
            console.log("Temps du farm :" + farmMode);
            setTimeout(function() {
                closeVP();
                setTimeout(() => {resolve(0);},pause);
            }, pause);
        }, pause);
    }, pause);
}

function choiceMode(farmMode){
    if (farmMode == 40) {
        document.querySelector("#farm_town_options div.fto_time_checkbox.fto_2400 a.checkbox").click();
        }
    else if (farmMode == 160) {
        document.querySelector("#farm_town_options div.fto_time_checkbox.fto_10800 a.checkbox").click();
    }
}

function createTempsAlea(tempsMini, tempsMaxi){
    //Génère un temps aléatoire en seconde, entre "tempsMini" et "tempsMaxi"
    var tempsAlea = Math.floor(Math.random() * (tempsMaxi - tempsMini)) + tempsMini;
    return tempsAlea;
}

function closeVP() {
    var vpCross = document.querySelector('div[style*="width: 768px;"] div.ui-dialog-titlebar button.ui-dialog-titlebar-close');
    vpCross.click();
    console.log('fenetre vp fermé');
}

//GM_getValue( name )
//GM_setValue( name , value );
