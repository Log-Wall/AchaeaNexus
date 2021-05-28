'use strict';
var cy = {};
var nexMap = {
    logging: true,
    mudmap: {},
	cytoscapeLoaded: false,
    mudletMapLoaded: false,
    currentRoom: -99,
    currentArea: -99,
    currentZ: -99,
    shortDirs: {
        east: "e",
        west: "w",
        south: "s",
        north: "n",
        northeast: "ne",
        northwest: "nw",
        southeast: "se",
        southwest: "sw",
        in: "in",
        out: "out",
        down: "d",
        up: "up",
    },
    wormWarpExits: {},
};

nexMap.findRoom = function(roomNum) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.findRoom(${roomNum})`)};
    console.log(roomNum);
    let rm = nexMap.mudmap.areas.find(e=>e.rooms.find(e2=>e2.id==roomNum)).rooms.find(e3=>e3.id==roomNum);
    console.log(rm);
};

nexMap.changeRoom = function(id) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.changeRoom(${id})`)};
    let room = cy.$id(id);
    cy.startBatch();
	cy.$('.currentRoom').removeClass('currentRoom');
    room.addClass('currentRoom');
    cy.endBatch()
    nexMap.currentRoom = id;
    $('#currentRoomLabel').text(`${room.data('areaName')}: ${room.data('name')}`)
    $('#currentExitsLabel').text(`Exits: ${room.data('exits').join()}`)
    
    nexMap.changeArea(cy.$id(id).data().area, cy.$id(id).position().z);
    cy.center(room);
};

nexMap.changeArea = function(area, z) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.changeArea(${area} ${z})`)};
    if (area == nexMap.currentArea && z == nexMap.currentZ) {return;}
    nexMap.currentArea = area;
    nexMap.currentZ = z;
    cy.startBatch();
    cy.$('.areaDisplay').removeClass('areaDisplay');
    cy.$('.pseudo').remove();
    let x = cy.nodes().filter(e =>
        e.data('area') == nexMap.currentArea && e.data('z') == nexMap.currentZ
    );
    x.addClass('areaDisplay');
    nexMap.generateExits();
    cy.center(nexMap.currentRoom);
    cy.endBatch();
};

nexMap.generateExits = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.generateExits()')};
    let exitIndex = 0;

    let createExit = function(position, cmd, tar) {
        let pos = {...position}
        if (cmd=='s')
            pos.y+=20;
        else if (cmd=='n')
            pos.y+=-20;
        else if (cmd=='e')
            pos.y+=20;
        else if (cmd=='w')
            pos.y+=-20;
        else if (cmd=='e')
            pos.y+=20;
        else if (cmd=='w')
            pos.y+=-20;

        let newNode = {
            group: 'nodes',
            data: {
                id: `pseudo${exitIndex}`,
            },
            position: {x: pos.x, y: pos.y, z: pos.z},
            classes: ['pseudo',tar?'areaAdjacent':`pseudo-${cmd}`],
        };

        cy.add(newNode);

        if (tar) {
            cy.add({
                group: 'edges',
                data: {
                    id: `pseudoE${exitIndex}`,
                    source: tar,
                    target: newNode.data.id,
                },
                classes: ['pseudo','areaAdjacentExit'],
            });
        }
        exitIndex++;
    }

    let x = cy.edges().filter(e =>
            e.data('area') == nexMap.currentArea && e.data('z') == nexMap.currentZ
        );

    x.filter(e=>['up','d','in','out'].includes(e.data('command')))
        .forEach(e=>createExit(e.source().position(), e.data('command')));

    let xe = x.filter(e=>['s','n','e','w','ne','nw','se','sw'].includes(e.data('command')));
    xe = xe.filter(e=>e.target().data('area') != nexMap.currentArea || e.target().data('z') != nexMap.currentZ);

    xe.forEach(e=>createExit(e.source().position(), e.data('command'), e.data('source')));
};

nexMap.generateGraph = async function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.generateGraph()')};
    return new Promise((resolve, reject)=> {
        for (let area of nexMap.mudmap.areas) {
            if (area.roomCount) {
                nexMap.mudmap.areas[area.id].rooms.forEach(room => {
                    let xts = [];
                    nexMap.mudmap.areas.find(e=>
                        e.rooms.find(e2=>
                            e2.id==room.id)).rooms.find(e3=>
                                e3.id==room.id).exits.forEach(e=>
                                    xts.push(nexMap.shortDirs[e.name]?nexMap.shortDirs[e.name]:e.name));
                    let newNode = {
                        group: 'nodes',
                        data: {
                            id: room.id,
                            area: area.id,
                            areaName: area.name,
                            environment: room.environment,
                            name: room.name,
                            userData: room.userData,
                            z: room.coordinates[2],
                            exits: xts,
                        },
                        position: {x: room.coordinates[0]*20, y: room.coordinates[1]*-20, z: room.coordinates[2]},
                        classes: [`environment${room.environment}`],
                        locked: true,
                    };
                    cy.add(newNode)
                });   
            }
        }

        for (let area of nexMap.mudmap.areas) {
            if (area.roomCount) {
                nexMap.mudmap.areas[area.id].rooms.forEach(room => {
                    room.exits.forEach(exit => {
                        let newEdge;
                        let xt = nexMap.shortDirs[exit.name]?nexMap.shortDirs[exit.name]:exit.name;
                        if (cy.$(`#${room.id}-${exit.exitId}`).length==0) {
                            newEdge = {
                                group: 'edges',
                                data: {
                                    id: `${room.id}-${exit.exitId}`,
                                    source: room.id,
                                    target: exit.exitId,
                                    area: area.id,
                                    command: xt,
                                    z: room.coordinates[2]
                                },
                            }

                            if (xt=='in')
                                newEdge.classes = ['inexit'];
                            else if (xt=='out')
                                newEdge.classes = ['outexit'];
                            else if (xt=='up')
                                newEdge.classes = ['upexit'];
                            else if (xt=='d')
                                newEdge.classes = ['downexit'];
                            else if (xt=='worm warp')
                                newEdge.classes = ['wormwarp'];
                            else if (xt=='enter grate')
                                newEdge.classes = ['sewergrate'];

                            cy.add(newEdge);
                        }
                    });
                });   
            }
        }
    
        cy.edges().filter(e=>e.data('command') == 'southeastst').forEach(e=>e.data().command = 'se'); // Mudlet map misspells 'southeast'
        nexMap.wormWarpExits = cy.edges().filter(e=>e.data('command') == 'worm warp');
        if (!nexMap.settings.useWormholes) {nexMap.wormWarpExits.remove();} // removes all worm warp exits.
        
        /* 
        //Mudlet map has hundreds of rooms with no name.
        
        nexMap.mudmap.areas.forEach(e=>{
            let col = e.rooms.filter(e2=>!e2.name);
            if (col.length) {
                console.log(`${e.id}:${e.name}`);
                console.log(col);
            }
        });
        */
        console.log('nexMap: Graph model created.');
        resolve();
    });
}
    
nexMap.loadDependencies = async function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.loadDependencies()')};
    let preloader = async function() {
        return new Promise((resolve, reject)=>{
            let src  = "https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.18.2/cytoscape.min.js"

            let head = document.getElementsByTagName('head')[0]
            let elem = document.createElement('script')
            elem.src = src + '?' + Math.random()
            elem.onload = ()=>{
                console.log('Loaded ' + src + '.');
                nexMap.cytoscapeLoaded = true;
                resolve();
            }
            elem.onerror = ()=>{
                console.log('Unable to load ' + src + '.');
                reject();
            }

            head.appendChild(elem)
        });
    }
    
    let clone = function(obj) {
        let copy;
        if (null == obj || 'object' != typeof obj) { return obj }
        if (obj instanceof String) { return (' ' + obj).slice(1) } // https://stackoverflow.com/a/31733628
        if (obj instanceof Date) { 
            copy = new Date()
            copy.setTime(obj.getTime())
            return copy }
        if (obj instanceof Array) {
            copy = []
            for (var i = 0, len = obj.length; i < len; i++) { copy[i] = clone(obj[i]) }
            return copy }
        if (obj instanceof Object) {
            copy = {}
            for (var attr in obj) { if (obj.hasOwnProperty(attr)) { copy[attr] = clone(obj[attr]) } }
            return copy }
        throw new Error('Unable to copy object! Type not supported.') 
    }
    
    let restoreMap = function() {
        $('body')
            .on('restoreMap', function(e, _map) {
            console.log(_map)
            window.Map = _map
            $('body').off('restoreMap')
        })

        let f = document.createElement('iframe')
        f.width = 0
        f.height = 0
        f.src = 'about:blank'
        f.onload = function() {
            $('body').trigger('restoreMap', [clone(f.contentWindow.Map)])
            document.body.removeChild(f)
        }
        document.body.appendChild(f)
    }
    
    let loadMap = async function() {
        return new Promise ((resolve, reject)=>{
            $.ajax({
                async: true,
                global: false,
                url: "https://raw.githubusercontent.com/IRE-Mudlet-Mapping/AchaeaCrowdmap/gh-pages/Map/map.json",
                dataType: "json",
                success: function (data) {
                    nexMap.mudmap = data;
                    nexMap.mudletMapLoaded = true;

                },
                complete: ()=>{
                    if(nexMap.mudletMapLoaded)
                        resolve();
                        console.log('nexMap: mudlet JSON map loaded.');
                },
                error:()=>{reject()}
            });
        });
    }
    
	restoreMap();
    await Promise.all([preloader(),loadMap()]);
    return true;
};

nexMap.initializeGraph = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.initializeGraph()')};
    if($('#cy').length) {$('#cy').remove()}
    $('<div></div>', {id:'currentRoomLabel'}).appendTo('#tbl_nexus_map');
    $('<div></div>', {id:'cy'}).appendTo('#tbl_nexus_map');
    $('<div></div>', {style:'position:absolute;bottom:0px',id:'currentExitsLabel'}).appendTo('#tbl_nexus_map');
    
    cy = cytoscape({
        container: document.getElementById('cy'),
        layout: 'grid',
        zoom: 1.5,
        minZoom: 0.25,
        maxZoom: 3,
        wheelSensitivity: 0.5,
        boxSelectionEnabled: false,
        selectionType: 'single',

        hideEdgesOnViewport: true,
        textureOnViewport: true,
        motionBlur: true,
        pixelRatio: 'auto',
    });
};

nexMap.startUp = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.startUp()')};
	run_function('nexMap.display', {}, 'nexmap');
    run_function('nexMap.settings', {}, 'nexmap');
	nexMap.display.notice('Loading mapper modules');
    nexMap.loadDependencies().then(()=>{
        nexMap.initializeGraph();
        nexMap.generateGraph().then(()=> {
            run_function('nexMap.style', {}, 'nexmap');
            run_function('nexMap.walker', {}, 'nexmap');
            nexMap.style();
            nexMap.display.notice('Mapper loaded and ready for use.');
            send_command('ql');
        });
    });
};

'use strict';
if (get_variable('nexMap')) {
    nexMap.settings = get_variable('nexMap');
}
else {
    nexMap.settings = {
        commandSeparator: '|',
        moveBatchCount: 3,
        useGallop: true,
        useDash: false,
        useDuanathar: false,
        duanatharCommand: 'say duanathar',
        useWormholes: false,
    }
}

nexMap.settings.save = function() {
    set_variable('nexMap',nexMap.settings);
}

nexMap.settings.wormholes = function() {
	if (nexMap.settings.useWormholes) {
        nexMap.settings.useWormholes = false;
        nexMap.wormWarpExits.remove();
    }
    else {
        nexMap.settings.useWormholes = true;
        nexMap.wormWarpExits.restore();
    }
    
    nexMap.settings.save();
}

nexMap.style = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.style()')};
    $('#cy').css({
        id: 'cy',
        'background-image':' url(/includes/images/windows/map-background.jpg)',
        width: '100%',
        height: 'calc(100% - 44px)',
        position: 'absolute',
        overflow: 'hidden',
        top: '0px',
        left: '0px',
        'margin-top': '22px',
        'margin-bottom': '22px'
    });
    
    cy.startBatch()
    cy.style().clear();
    
    // Core element styles
    cy.style()
        .selector('node')
            .style({
                shape: 'rectangle',
                width: 10,
                height: 10,
        		'border-color': 'black',
        		'border-width': 0.5,
        		display: 'none',
        		locked: true,
            })
        .selector('edge')
            .style({
                width: 1,
                'line-color': 'grey',
        		//display: 'none',
            });
    
    // Classes styles
    cy.style()
        .selector('.displayLabel')
            .style({
                //label: 'data(name)',
        		label: 'data(id)',
                color: 'white',
            })
    	.selector('.areaDisplay')
    		.style({
        		display: 'element',
    		}) 
        .selector('.areaAdjacent')
    		.style({
        		display: 'element',
    			visibility: 'hidden'
    		})    
    	.selector('.wormhole')
    		.style({
    			visibility: 'hidden'
    		})
    	.selector('.sewergrate')
    		.style({
        		visibility: 'hidden'
    		})    
    	.selector('.downexit')
    		.style({
    			'source-arrow-shape':'triangle',
        		'curve-style':'bezier',
        		visibility: 'hidden'    
    		})
    	.selector('.upexit')
    		.style({
    			'source-arrow-shape':'triangle',
        		'curve-style':'bezier',
        		visibility: 'hidden'
    		})
    	.selector('.inexit')
    		.style({
    			'source-arrow-shape':'circle',
        		'curve-style':'bezier',
        		visibility: 'hidden'    
    		})
    	.selector('.outexit')
    		.style({
    			'source-arrow-shape':'circle',
        		'curve-style':'bezier',
        		visibility: 'hidden'
    		})
        .selector('.pseudo-d')
            .style({
            display: 'element',
            'border-color':'black',
            'border-width':0.5,
            'background-color':'white',
            shape:'polygon',
            'shape-polygon-points':[
                -0.6,-0.7,
                0.6,-0.7,
                0,-0.1]
        })
        .selector('.pseudo-up')
            .style({
            display: 'element',
            'border-color':'black',
            'border-width':0.5,
            'background-color':'white',
            shape:'polygon',
            'shape-polygon-points':[
                0.6,0.7,
                -0.6,0.7,
                0,0.1]
        })
        .selector('.pseudo-in')
            .style({
            display: 'element',
            'border-color':'black',
            'border-width':0.5,
            'background-color':'white',
            shape:'polygon',
            'shape-polygon-points':[
                0.7,-0.6,
                0.7,0.6,
                0.1,0.0]
        })
        .selector('.pseudo-out')
            .style({
            display: 'element',
            'border-color':'black',
            'border-width':0.5,
            'background-color':'white',
            shape:'polygon',
            'shape-polygon-points':[
                -0.7,0.6,
                -0.7,-0.6,
                -0.1,0.0]
        })
        .selector('.areaAdjacentExit')
            .style({
            display: 'element',
            'target-arrow-shape':'vee',
            'curve-style':'straight',
        	'arrow-scale':0.75
        });
    
    // Node colors based on environment tag
    nexMap.mudmap.customEnvColors.forEach(e => {
        cy.style()
        .selector(`.environment${e.id}`)
            .style('background-color', `rgb(${e.color24RGB.join()})`)     
    });

    cy.style()
        .selector(':selected')
            .style({
            'background-color': 'green',
            })
        .selector('.currentRoom')
            .style({
        	'border-color':'LawnGreen',
        	'border-width':2,
            });

    cy.style().update();
    
    cy.on('mouseout', 'node', evt=>{evt.target.removeClass('displayLabel');}); // Pop up labels on mouseover
    cy.on('mouseover', 'node', evt=>{evt.target.addClass('displayLabel')}); // Pop up labels on mouseover
    cy.on('zoom', e=>{cy.style().selector('.displayLabel').style({'font-size': `${12*1/cy.zoom()}pt`})}) //Increases the size of the label based on the zoom level.
    cy.on('unselect', 'node', evt=>{nexMap.walker.stop()});
    cy.on('select', 'node', evt=>{nexMap.walker.speedWalk()});

	cy.endBatch();
}

nexMap.walker = {
    pathing: false,
    pathRooms: [],
    pathCommands: [],
    delay: false,
    destination: 0,
    antiWingAreas: [44],
}

nexMap.walker.speedWalk = function() {
	nexMap.walker.determinePath();    
}

nexMap.walker.stepDelay = function(currentSetting) {
    if (nexMap.logging) {console.log('nexMap: nexMap.walker.stepDelay()')};
    if (nexMap.logging) {print('nexMap: nexMap.walker.stepDelay()')};
    nexMap.walker.timer = setTimeout(e=>{
        console.log('nexMap: timer delay fired.');
        print('nexMap: timer delay fired.');
        nexMap.walker.delay = false;
        nexMap.walker.determinePath();   
        client.echo_input = currentSetting;
    },500)
}

nexMap.walker.clearDelay = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.walker.clearDelay()')};
    if (nexMap.logging) {print('nexMap: nexMap.walker.clearDelay()')};
    clearTimeout(nexMap.walker.timer);
}

nexMap.walker.step = function() {
    let nmw = nexMap.walker;
    
    if (nexMap.logging) {console.log('nexMap: nexMap.walker.step()')};
    
    //nmw.determinePath()
    if (nmw.delay || nmw.pathCommands.length == 0) {if (nexMap.logging) {console.log('nexMap: nexMap.walker.step RETURN')};return;}
    
    let index = nmw.pathRooms.indexOf(GMCP.Room.Info.num);

    if (index == -1) {
        nexMap.display.notice('Off path. Recalculating new route.');
        nmw.determinePath();
        return;
    }
    
    if (GMCP.Room.Info.num == nmw.destination) {
        nmw.pathing = false;
        cy.$(':selected').unselect();
        nexMap.display.notice('Pathing complete.');
    }
    else {
        nmw.pathing = true;

        let stepBatch = nmw.pathCommands.slice(index,index+nexMap.settings.moveBatchCount).join(nexMap.settings.commandSeparator);
        send_command(stepBatch);
    }
}

nexMap.walker.determinePath = function(s, t) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.walker.determinePath(${s}, ${t})`)};
    let source = s?s: cy.$('.currentRoom').data('id');
    let target = t?t: cy.$(':selected').data('id');
    let nmw = nexMap.walker;
    nmw.destination = target;
       
    nmw.pathRooms = [];
    nmw.pathCommands = [];
    
    let astar = cy.elements().aStar({ root: `#${cy.$id(source).data('id')}`, goal: `#${cy.$id(target).data('id')}`, directed: true});
    
    astar.path.nodes().forEach(e=>nmw.pathRooms.push(e.data('id')));
    astar.path.edges().forEach(e=>nmw.pathCommands.push(e.data('command')));

    nmw.checkClouds(astar, target);

    if(nexMap.settings.useGallop) {nmw.checkDash('gallop')}

    nmw.step();
}

nexMap.walker.checkClouds = function(astar, target) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.walker.checkClouds()`)};
    if (!nexMap.settings.useDuanathar) {return;}
    
    let nmw = nexMap.walker;
    let firstWingRoom = astar.path.nodes().find(e=>e.data().userData.indoors!='y' && !nmw.antiWingAreas.includes(e.data('area')));
    let wingRoomId = firstWingRoom?firstWingRoom.data('id'):0;
    let cloudPath = cy.elements().aStar({ root: `#${cy.$id(3885).data('id')}`, goal: `#${cy.$id(target).data('id')}`, directed: true});

    
    if (astar.distance > nmw.pathRooms.indexOf(wingRoomId)+cloudPath.distance) {
        nmw.pathRooms.splice(nmw.pathRooms.indexOf(wingRoomId)+1);
        nmw.pathCommands.splice(nmw.pathRooms.indexOf(wingRoomId));
        nmw.pathCommands.push(nexMap.settings.duanatharCommand);
        
        cloudPath.path.nodes().forEach(e=>nmw.pathRooms.push(e.data('id')));
        cloudPath.path.edges().forEach(e=>nmw.pathCommands.push(e.data('command')));
    }  
}

nexMap.walker.checkDash = function(cmd) {
    if (nexMap.logging) {console.log(`nexMap: nexMap.walker.checkDash(${cmd})`)};
	let nmwpc = nexMap.walker.pathCommands;
    let nmwpr = nexMap.walker.pathRooms;

    let galCmds = [];
    let galRm = [nmwpr[0]];
    let galIndex = -1;
    let len;
    nmwpc.forEach((e,i)=>{
        if (e != nmwpc[i+1]) {
            len = i-galIndex;
            
            if(len==2) {
            	galCmds.push(e);
            	galRm.push(nmwpr[i]);    
            }
            
            galCmds.push(len>2?`gallop ${e} ${i-galIndex}`:e);
            galRm.push(len>2?nmwpr[galIndex+len+1]:nmwpr[i+1]);

            galIndex=i;
        }
    })
    
    nexMap.walker.pathCommands = [...galCmds];
    nexMap.walker.pathRooms = [...galRm];
}

nexMap.walker.reset = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.walker.reset()')};
    nexMap.walker.pathing = false;
    nexMap.walker.usedClouds = false;
    cy.$(':selected').unselect();
    nexMap.walker.pathCommands = [];
    nexMap.walker.pathRooms = [];
}


nexMap.walker.stop = function() {
    if (nexMap.logging) {console.log('nexMap: nexMap.walker.stop()')};
    if (nexMap.walker.pathing === true) {
        nexMap.walker.reset();
    	nexMap.display.notice('Pathing canceled')
    }
}

nexMap.display = {
	pageBreak: 20,
    pageIndex: 0,
    displayCap: {}, 
    displayClick: "",
    displayEntries: {},
}

nexMap.display.notice = function(txt) {
	let msg = $('<span></span>', {class:"mono"});
    $('<span></span>',{style:'color:DodgerBlue'}).text('[-').appendTo(msg);
    $('<span></span>',{style:'color:OrangeRed'}).text('nexMap').appendTo(msg);
    $('<span></span>',{style:'color:DodgerBlue'}).text('-] ').appendTo(msg);
    $('<span></span>',{style:'color:GoldenRod'}).text(txt).appendTo(msg)
    
    print(msg[0].outerHTML);
}

nexMap.display.generateTable = function(entries, caption) {
    nexMap.display.pageIndex = 0;
    nexMap.display.displayEntries = entries;
    nexMap.display.displayCap = caption;
    nexMap.display.displayTable();
}

nexMap.display.click = function(id) {
    cy.$(':selected').unselect();
	cy.$(`#${id}`).select();   
}

nexMap.display.displayTable = function() {
    let entries = nexMap.display.displayEntries;
    let caption = nexMap.display.displayCap;
    
    let tab = $("<table></table>", {
        class:"mono", 
        style:"max-width:100%;border:1px solid white;border-spacing:0px"});
    if (nexMap.display.pageIndex == 0) {
        let cap = $("<caption></caption>", {style:"text-align:left"}).appendTo(tab);
        $('<span></span>',{style:'color:DodgerBlue'}).text('[-').appendTo(cap);
        $('<span></span>',{style:'color:OrangeRed'}).text('nexMap').appendTo(cap);
        $('<span></span>',{style:'color:DodgerBlue'}).text('-] ').appendTo(cap);
        $('<span></span>',{style:'color:GoldenRod'}).text('Displaying matches for ').appendTo(cap)
        $('<span></span>',{style:'font-weight:bold;color:LawnGreen'}).text(nexMap.display.displayCap).appendTo(cap);//fix
    
        let header = $("<tr></tr>", {style: "text-align:left;color:Ivory"}).appendTo(tab);
        $("<th></th>", {style:'width:5em'}).text('Num').appendTo(header);
        $("<th></th>", {style:'width:auto'}).text('Name').appendTo(header);
        $("<th></th>", {style:'width:auto'}).text('Area').appendTo(header);
	}
    else {
        let header = $("<tr></tr>", {style: "text-align:left;color:Ivory"}).appendTo(tab);
        $("<th></th>", {style:'width:5em'}).text('').appendTo(header);
        $("<th></th>", {style:'width:auto'}).text('').appendTo(header);
        $("<th></th>", {style:'width:auto'}).text('').appendTo(header);
    }
    
    let startIndex = nexMap.display.pageIndex > 0 ? (nexMap.display.pageIndex*nexMap.display.pageBreak) : 0;
    for(let i = startIndex;i < entries.length && i < startIndex+nexMap.display.pageBreak;i++) {
    	let row  = $("<tr></tr>", {style:'cursor:pointer;color:dimgrey;'}).appendTo(tab);
        $("<td></td>", {style:'color:grey',onclick: `nexMap.display.click(${JSON.stringify(entries[i].data('id'))});`}).text(entries[i].data('id')).appendTo(row);
        $("<td></td>", {style:'color:gainsboro;text-decoration:underline',onclick: `nexMap.display.click(${JSON.stringify(entries[i].data('id'))});`}).text(entries[i].data('name')).appendTo(row);
        $("<td></td>", {onclick: `nexMap.display.click(${JSON.stringify(entries[i].data('id'))});`}).text(entries[i].data('areaName')).appendTo(row);
    }   
    
    print(tab[0].outerHTML);
 
    let pagination;
    if(Math.ceil(nexMap.display.displayEntries.length/nexMap.display.pageBreak) > nexMap.display.pageIndex+1) {
        pagination = $("<span></span>", {style:'color:Goldenrod'}).text(`Displaying ${startIndex+nexMap.display.pageBreak} of ${nexMap.display.displayEntries.length}.`);
        nexMap.display.pageIndex++;
        $("<span></span>", {style:'color:Goldenrod'}).text(' Click for ').appendTo(pagination);
        $('<a></a>', {style:'cursor:pointer;color:Ivory;text-decoration:underline;',onclick:'nexMap.display.displayTable()'}).text('MORE').appendTo(pagination);
    }
    else {
        pagination = $("<span></span>", {style:'color:Goldenrod'}).text(`Displaying ${nexMap.display.displayEntries.length} of ${nexMap.display.displayEntries.length}.`);
    }
        
    print(pagination[0].outerHTML);                                                                                               
}
