// initiate table
ratter = {
    etuor: [14551,14554,14569,14829,14610,14616,14711,14822,14945,15062,
            16732,15503,15505,15506,15439,14150,15610,14842,14849,14854,
            14855,13945,14500,16199,16505,16522,14871,14884,15481,15482,
            15489,15490,15363,15385,15386,15408,15420,15432,15281,15319,
            15333,15342,15344,15351,15748,16181,16182,15560,15555,16183,
            16184,16185,15642,15648,15667,15695,16178,16177,14981,16175,
            16174,16173,16171,14970,14497,16213,16203,16195,16161,16162,
            16152,16151,16147,16142,16190,16189,16188,15747,15742,15731,
            15725,15703,15702,15700,16165,16166,16167,16168,16169,16163],
};

// clear potential residual timer.
clearTimeout(ratter.Timer);

ratter.test = function () {
    send_direct("blink");
}

ratter.nextStep = function () {
    var i = ratter.etuor.indexOf(mapdb_v.room_gmcp.num)+1;
    if (i < 0)
        return;
    let d = ratter.etuor[i];
    if (typeof d === 'undefined' || d == mapdb_v.room_gmcp.num) {
        display_notice("[Ratter]: Time to sell!", "#ffffff", "#ff3300");
        send_command("rats");
        return;
    }
    send_command("goto " + d);
    clearTimeout(ratter.Timer);
    ratter.Timer = setTimeout(
        function() {
            display_notice("[Ratter]: Ding", "#ffffff", "#ff3300");
            ratter.nextStep();
        }, 20000);
}