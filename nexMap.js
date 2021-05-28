"use strict";var cy={},nexMap={logging:!0,mudmap:{},cytoscapeLoaded:!1,mudletMapLoaded:!1,currentRoom:-99,currentArea:-99,currentZ:-99,shortDirs:{east:"e",west:"w",south:"s",north:"n",northeast:"ne",northwest:"nw",southeast:"se",southwest:"sw",in:"in",out:"out",down:"d",up:"up"},wormWarpExits:{},findRoom:function(e){nexMap.logging&&console.log(`nexMap: nexMap.findRoom(${e})`),console.log(e);let a=nexMap.mudmap.areas.find(a=>a.rooms.find(a=>a.id==e)).rooms.find(a=>a.id==e);console.log(a)},changeRoom:function(e){nexMap.logging&&console.log(`nexMap: nexMap.changeRoom(${e})`);let a=cy.$id(e);cy.startBatch(),cy.$(".currentRoom").removeClass("currentRoom"),a.addClass("currentRoom"),cy.endBatch(),nexMap.currentRoom=e,$("#currentRoomLabel").text(`${a.data("areaName")}: ${a.data("name")}`),$("#currentExitsLabel").text(`Exits: ${a.data("exits").join()}`),nexMap.changeArea(cy.$id(e).data().area,cy.$id(e).position().z),cy.center(a)},changeArea:function(e,a){if(nexMap.logging&&console.log(`nexMap: nexMap.changeArea(${e} ${a})`),e==nexMap.currentArea&&a==nexMap.currentZ)return;nexMap.currentArea=e,nexMap.currentZ=a,cy.startBatch(),cy.$(".areaDisplay").removeClass("areaDisplay"),cy.$(".pseudo").remove(),cy.nodes().filter(e=>e.data("area")==nexMap.currentArea&&e.data("z")==nexMap.currentZ).addClass("areaDisplay"),nexMap.generateExits(),cy.center(nexMap.currentRoom),cy.endBatch()},generateExits:function(){nexMap.logging&&console.log("nexMap: nexMap.generateExits()");let e=0,a=function(a,n,t){let o={...a};"s"==n?o.y+=20:"n"==n?o.y+=-20:"e"==n?o.y+=20:"w"==n?o.y+=-20:"e"==n?o.y+=20:"w"==n&&(o.y+=-20);let s={group:"nodes",data:{id:`pseudo${e}`},position:{x:o.x,y:o.y,z:o.z},classes:["pseudo",t?"areaAdjacent":`pseudo-${n}`]};cy.add(s),t&&cy.add({group:"edges",data:{id:`pseudoE${e}`,source:t,target:s.data.id},classes:["pseudo","areaAdjacentExit"]}),e++},n=cy.edges().filter(e=>e.data("area")==nexMap.currentArea&&e.data("z")==nexMap.currentZ);n.filter(e=>["up","d","in","out"].includes(e.data("command"))).forEach(e=>a(e.source().position(),e.data("command")));let t=n.filter(e=>["s","n","e","w","ne","nw","se","sw"].includes(e.data("command")));(t=t.filter(e=>e.target().data("area")!=nexMap.currentArea||e.target().data("z")!=nexMap.currentZ)).forEach(e=>a(e.source().position(),e.data("command"),e.data("source")))},generateGraph:async function(){return nexMap.logging&&console.log("nexMap: nexMap.generateGraph()"),new Promise((e,a)=>{for(let e of nexMap.mudmap.areas)e.roomCount&&nexMap.mudmap.areas[e.id].rooms.forEach(a=>{let n=[];nexMap.mudmap.areas.find(e=>e.rooms.find(e=>e.id==a.id)).rooms.find(e=>e.id==a.id).exits.forEach(e=>n.push(nexMap.shortDirs[e.name]?nexMap.shortDirs[e.name]:e.name));let t={group:"nodes",data:{id:a.id,area:e.id,areaName:e.name,environment:a.environment,name:a.name,userData:a.userData,z:a.coordinates[2],exits:n},position:{x:20*a.coordinates[0],y:-20*a.coordinates[1],z:a.coordinates[2]},classes:[`environment${a.environment}`],locked:!0};cy.add(t)});for(let e of nexMap.mudmap.areas)e.roomCount&&nexMap.mudmap.areas[e.id].rooms.forEach(a=>{a.exits.forEach(n=>{let t,o=nexMap.shortDirs[n.name]?nexMap.shortDirs[n.name]:n.name;0==cy.$(`#${a.id}-${n.exitId}`).length&&(t={group:"edges",data:{id:`${a.id}-${n.exitId}`,source:a.id,target:n.exitId,area:e.id,command:o,z:a.coordinates[2]}},"in"==o?t.classes=["inexit"]:"out"==o?t.classes=["outexit"]:"up"==o?t.classes=["upexit"]:"d"==o?t.classes=["downexit"]:"worm warp"==o?t.classes=["wormwarp"]:"enter grate"==o&&(t.classes=["sewergrate"]),cy.add(t))})});cy.edges().filter(e=>"southeastst"==e.data("command")).forEach(e=>e.data().command="se"),nexMap.wormWarpExits=cy.edges().filter(e=>"worm warp"==e.data("command")),nexMap.settings.useWormholes||nexMap.wormWarpExits.remove(),console.log("nexMap: Graph model created."),e()})},loadDependencies:async function(){nexMap.logging&&console.log("nexMap: nexMap.loadDependencies()");let e=function(a){let n;if(null==a||"object"!=typeof a)return a;if(a instanceof String)return(" "+a).slice(1);if(a instanceof Date)return(n=new Date).setTime(a.getTime()),n;if(a instanceof Array){n=[];for(var t=0,o=a.length;t<o;t++)n[t]=e(a[t]);return n}if(a instanceof Object){for(var s in n={},a)a.hasOwnProperty(s)&&(n[s]=e(a[s]));return n}throw new Error("Unable to copy object! Type not supported.")};return function(){$("body").on("restoreMap",function(e,a){console.log(a),window.Map=a,$("body").off("restoreMap")});let a=document.createElement("iframe");a.width=0,a.height=0,a.src="about:blank",a.onload=function(){$("body").trigger("restoreMap",[e(a.contentWindow.Map)]),document.body.removeChild(a)},document.body.appendChild(a)}(),await Promise.all([async function(){return new Promise((e,a)=>{let n="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.18.2/cytoscape.min.js",t=document.getElementsByTagName("head")[0],o=document.createElement("script");o.src=n+"?"+Math.random(),o.onload=(()=>{console.log("Loaded "+n+"."),nexMap.cytoscapeLoaded=!0,e()}),o.onerror=(()=>{console.log("Unable to load "+n+"."),a()}),t.appendChild(o)})}(),async function(){return new Promise((e,a)=>{$.ajax({async:!0,global:!1,url:"https://raw.githubusercontent.com/IRE-Mudlet-Mapping/AchaeaCrowdmap/gh-pages/Map/map.json",dataType:"json",success:function(e){nexMap.mudmap=e,nexMap.mudletMapLoaded=!0},complete:()=>{nexMap.mudletMapLoaded&&e(),console.log("nexMap: mudlet JSON map loaded.")},error:()=>{a()}})})}()]),!0},initializeGraph:function(){nexMap.logging&&console.log("nexMap: nexMap.initializeGraph()"),$("#cy").length&&$("#cy").remove(),$("<div></div>",{id:"currentRoomLabel"}).appendTo("#tbl_nexus_map"),$("<div></div>",{id:"cy"}).appendTo("#tbl_nexus_map"),$("<div></div>",{style:"position:absolute;bottom:0px",id:"currentExitsLabel"}).appendTo("#tbl_nexus_map"),cy=cytoscape({container:document.getElementById("cy"),layout:"grid",zoom:1.5,minZoom:.25,maxZoom:3,wheelSensitivity:.5,boxSelectionEnabled:!1,selectionType:"single",hideEdgesOnViewport:!0,textureOnViewport:!0,motionBlur:!0,pixelRatio:"auto"})},startUp:function(){nexMap.logging&&console.log("nexMap: nexMap.startUp()"),run_function("nexMap.display",{},"nexmap"),run_function("nexMap.settings",{},"nexmap"),nexMap.display.notice("Loading mapper modules"),nexMap.loadDependencies().then(()=>{nexMap.initializeGraph(),nexMap.generateGraph().then(()=>{run_function("nexMap.style",{},"nexmap"),run_function("nexMap.walker",{},"nexmap"),nexMap.style(),nexMap.display.notice("Mapper loaded and ready for use."),send_command("ql")})})}};get_variable("nexMap")?nexMap.settings=get_variable("nexMap"):nexMap.settings={version:0.1,commandSeparator:"|",moveBatchCount:3,useGallop:!0,useDash:!1,useDuanathar:!1,duanatharCommand:"say duanathar",useWormholes:!1},nexMap.settings.save=function(){set_variable("nexMap",nexMap.settings)},nexMap.settings.wormholes=function(){nexMap.settings.useWormholes?(nexMap.settings.useWormholes=!1,nexMap.wormWarpExits.remove()):(nexMap.settings.useWormholes=!0,nexMap.wormWarpExits.restore()),nexMap.settings.save()},nexMap.style=function(){nexMap.logging&&console.log("nexMap: nexMap.style()"),$("#cy").css({id:"cy","background-image":" url(/includes/images/windows/map-background.jpg)",width:"100%",height:"calc(100% - 44px)",position:"absolute",overflow:"hidden",top:"0px",left:"0px","margin-top":"22px","margin-bottom":"22px"}),cy.startBatch(),cy.style().clear(),cy.style().selector("node").style({shape:"rectangle",width:10,height:10,"border-color":"black","border-width":.5,display:"none",locked:!0}).selector("edge").style({width:1,"line-color":"grey"}),cy.style().selector(".displayLabel").style({label:"data(id)",color:"white"}).selector(".areaDisplay").style({display:"element"}).selector(".areaAdjacent").style({display:"element",visibility:"hidden"}).selector(".wormhole").style({visibility:"hidden"}).selector(".sewergrate").style({visibility:"hidden"}).selector(".downexit").style({"source-arrow-shape":"triangle","curve-style":"bezier",visibility:"hidden"}).selector(".upexit").style({"source-arrow-shape":"triangle","curve-style":"bezier",visibility:"hidden"}).selector(".inexit").style({"source-arrow-shape":"circle","curve-style":"bezier",visibility:"hidden"}).selector(".outexit").style({"source-arrow-shape":"circle","curve-style":"bezier",visibility:"hidden"}).selector(".pseudo-d").style({display:"element","border-color":"black","border-width":.5,"background-color":"white",shape:"polygon","shape-polygon-points":[-.6,-.7,.6,-.7,0,-.1]}).selector(".pseudo-up").style({display:"element","border-color":"black","border-width":.5,"background-color":"white",shape:"polygon","shape-polygon-points":[.6,.7,-.6,.7,0,.1]}).selector(".pseudo-in").style({display:"element","border-color":"black","border-width":.5,"background-color":"white",shape:"polygon","shape-polygon-points":[.7,-.6,.7,.6,.1,0]}).selector(".pseudo-out").style({display:"element","border-color":"black","border-width":.5,"background-color":"white",shape:"polygon","shape-polygon-points":[-.7,.6,-.7,-.6,-.1,0]}).selector(".areaAdjacentExit").style({display:"element","target-arrow-shape":"vee","curve-style":"straight","arrow-scale":.75}),nexMap.mudmap.customEnvColors.forEach(e=>{cy.style().selector(`.environment${e.id}`).style("background-color",`rgb(${e.color24RGB.join()})`)}),cy.style().selector(":selected").style({"background-color":"green"}).selector(".currentRoom").style({"border-color":"LawnGreen","border-width":2}),cy.style().update(),cy.on("mouseout","node",e=>{e.target.removeClass("displayLabel")}),cy.on("mouseover","node",e=>{e.target.addClass("displayLabel")}),cy.on("zoom",e=>{cy.style().selector(".displayLabel").style({"font-size":`${12/cy.zoom()}pt`})}),cy.on("unselect","node",e=>{nexMap.walker.stop()}),cy.on("select","node",e=>{nexMap.walker.speedWalk()}),cy.endBatch()},nexMap.walker={pathing:!1,pathRooms:[],pathCommands:[],delay:!1,destination:0,antiWingAreas:[44]},nexMap.walker.speedWalk=function(){nexMap.walker.determinePath()},nexMap.walker.stepDelay=function(e){nexMap.logging&&console.log("nexMap: nexMap.walker.stepDelay()"),nexMap.logging&&print("nexMap: nexMap.walker.stepDelay()"),nexMap.walker.timer=setTimeout(a=>{console.log("nexMap: timer delay fired."),print("nexMap: timer delay fired."),nexMap.walker.delay=!1,nexMap.walker.determinePath(),client.echo_input=e},500)},nexMap.walker.clearDelay=function(){nexMap.logging&&console.log("nexMap: nexMap.walker.clearDelay()"),nexMap.logging&&print("nexMap: nexMap.walker.clearDelay()"),clearTimeout(nexMap.walker.timer)},nexMap.walker.step=function(){let e=nexMap.walker;if(nexMap.logging&&console.log("nexMap: nexMap.walker.step()"),e.delay||0==e.pathCommands.length)return void(nexMap.logging&&console.log("nexMap: nexMap.walker.step RETURN"));let a=e.pathRooms.indexOf(GMCP.Room.Info.num);if(-1==a)return nexMap.display.notice("Off path. Recalculating new route."),void e.determinePath();if(GMCP.Room.Info.num==e.destination)e.pathing=!1,cy.$(":selected").unselect(),nexMap.display.notice("Pathing complete.");else{e.pathing=!0;let n=e.pathCommands.slice(a,a+nexMap.settings.moveBatchCount).join(nexMap.settings.commandSeparator);send_command(n)}},nexMap.walker.determinePath=function(e,a){nexMap.logging&&console.log(`nexMap: nexMap.walker.determinePath(${e}, ${a})`);let n=e||cy.$(".currentRoom").data("id"),t=a||cy.$(":selected").data("id"),o=nexMap.walker;o.destination=t,o.pathRooms=[],o.pathCommands=[];let s=cy.elements().aStar({root:`#${cy.$id(n).data("id")}`,goal:`#${cy.$id(t).data("id")}`,directed:!0});s.path.nodes().forEach(e=>o.pathRooms.push(e.data("id"))),s.path.edges().forEach(e=>o.pathCommands.push(e.data("command"))),o.checkClouds(s,t),nexMap.settings.useGallop&&o.checkDash("gallop"),o.step()},nexMap.walker.checkClouds=function(e,a){if(nexMap.logging&&console.log("nexMap: nexMap.walker.checkClouds()"),!nexMap.settings.useDuanathar)return;let n=nexMap.walker,t=e.path.nodes().find(e=>"y"!=e.data().userData.indoors&&!n.antiWingAreas.includes(e.data("area"))),o=t?t.data("id"):0,s=cy.elements().aStar({root:`#${cy.$id(3885).data("id")}`,goal:`#${cy.$id(a).data("id")}`,directed:!0});e.distance>n.pathRooms.indexOf(o)+s.distance&&(n.pathRooms.splice(n.pathRooms.indexOf(o)+1),n.pathCommands.splice(n.pathRooms.indexOf(o)),n.pathCommands.push(nexMap.settings.duanatharCommand),s.path.nodes().forEach(e=>n.pathRooms.push(e.data("id"))),s.path.edges().forEach(e=>n.pathCommands.push(e.data("command"))))},nexMap.walker.checkDash=function(e){nexMap.logging&&console.log(`nexMap: nexMap.walker.checkDash(${e})`);let a,n=nexMap.walker.pathCommands,t=nexMap.walker.pathRooms,o=[],s=[t[0]],p=-1;n.forEach((e,l)=>{e!=n[l+1]&&(2==(a=l-p)&&(o.push(e),s.push(t[l])),o.push(a>2?`gallop ${e} ${l-p}`:e),s.push(a>2?t[p+a+1]:t[l+1]),p=l)}),nexMap.walker.pathCommands=[...o],nexMap.walker.pathRooms=[...s]},nexMap.walker.reset=function(){nexMap.logging&&console.log("nexMap: nexMap.walker.reset()"),nexMap.walker.pathing=!1,nexMap.walker.usedClouds=!1,cy.$(":selected").unselect(),nexMap.walker.pathCommands=[],nexMap.walker.pathRooms=[]},nexMap.walker.stop=function(){nexMap.logging&&console.log("nexMap: nexMap.walker.stop()"),!0===nexMap.walker.pathing&&(nexMap.walker.reset(),nexMap.display.notice("Pathing canceled"))},nexMap.display={pageBreak:20,pageIndex:0,displayCap:{},displayClick:"",displayEntries:{}},nexMap.display.notice=function(e){let a=$("<span></span>",{class:"mono"});$("<span></span>",{style:"color:DodgerBlue"}).text("[-").appendTo(a),$("<span></span>",{style:"color:OrangeRed"}).text("nexMap").appendTo(a),$("<span></span>",{style:"color:DodgerBlue"}).text("-] ").appendTo(a),$("<span></span>",{style:"color:GoldenRod"}).text(e).appendTo(a),print(a[0].outerHTML)},nexMap.display.generateTable=function(e,a){nexMap.display.pageIndex=0,nexMap.display.displayEntries=e,nexMap.display.displayCap=a,nexMap.display.displayTable()},nexMap.display.click=function(e){cy.$(":selected").unselect(),cy.$(`#${e}`).select()},nexMap.display.displayTable=function(){let e=nexMap.display.displayEntries,a=(nexMap.display.displayCap,$("<table></table>",{class:"mono",style:"max-width:100%;border:1px solid white;border-spacing:0px"}));if(0==nexMap.display.pageIndex){let e=$("<caption></caption>",{style:"text-align:left"}).appendTo(a);$("<span></span>",{style:"color:DodgerBlue"}).text("[-").appendTo(e),$("<span></span>",{style:"color:OrangeRed"}).text("nexMap").appendTo(e),$("<span></span>",{style:"color:DodgerBlue"}).text("-] ").appendTo(e),$("<span></span>",{style:"color:GoldenRod"}).text("Displaying matches for ").appendTo(e),$("<span></span>",{style:"font-weight:bold;color:LawnGreen"}).text(nexMap.display.displayCap).appendTo(e);let n=$("<tr></tr>",{style:"text-align:left;color:Ivory"}).appendTo(a);$("<th></th>",{style:"width:5em"}).text("Num").appendTo(n),$("<th></th>",{style:"width:auto"}).text("Name").appendTo(n),$("<th></th>",{style:"width:auto"}).text("Area").appendTo(n)}else{let e=$("<tr></tr>",{style:"text-align:left;color:Ivory"}).appendTo(a);$("<th></th>",{style:"width:5em"}).text("").appendTo(e),$("<th></th>",{style:"width:auto"}).text("").appendTo(e),$("<th></th>",{style:"width:auto"}).text("").appendTo(e)}let n,t=nexMap.display.pageIndex>0?nexMap.display.pageIndex*nexMap.display.pageBreak:0;for(let n=t;n<e.length&&n<t+nexMap.display.pageBreak;n++){let t=$("<tr></tr>",{style:"cursor:pointer;color:dimgrey;"}).appendTo(a);$("<td></td>",{style:"color:grey",onclick:`nexMap.display.click(${JSON.stringify(e[n].data("id"))});`}).text(e[n].data("id")).appendTo(t),$("<td></td>",{style:"color:gainsboro;text-decoration:underline",onclick:`nexMap.display.click(${JSON.stringify(e[n].data("id"))});`}).text(e[n].data("name")).appendTo(t),$("<td></td>",{onclick:`nexMap.display.click(${JSON.stringify(e[n].data("id"))});`}).text(e[n].data("areaName")).appendTo(t)}print(a[0].outerHTML),Math.ceil(nexMap.display.displayEntries.length/nexMap.display.pageBreak)>nexMap.display.pageIndex+1?(n=$("<span></span>",{style:"color:Goldenrod"}).text(`Displaying ${t+nexMap.display.pageBreak} of ${nexMap.display.displayEntries.length}.`),nexMap.display.pageIndex++,$("<span></span>",{style:"color:Goldenrod"}).text(" Click for ").appendTo(n),$("<a></a>",{style:"cursor:pointer;color:Ivory;text-decoration:underline;",onclick:"nexMap.display.displayTable()"}).text("MORE").appendTo(n)):n=$("<span></span>",{style:"color:Goldenrod"}).text(`Displaying ${nexMap.display.displayEntries.length} of ${nexMap.display.displayEntries.length}.`),print(n[0].outerHTML)};
