//****************************************************
// THIS IS THE OBJECT THAT DAT.GUI UPDATES
// SEE: http://workshop.chromeexperiments.com/examples/gui/
//****************************************************
var Config = function (options) {
  for (var opt in options) {
    this[opt] = options[opt];
  }
};

//****************************************************
// BASIC NODE CLASS - YOU COULD STORE OTHER INFO HERE
//****************************************************
var Node = function(obj) {
  this.id = obj.id;
};

//****************************************************
// BASIC LINK CLASS - YOU COULD STORE OTHER INFO HERE
//****************************************************
var Link = function(obj) {
  this.id = obj.id;
  this.source = obj.source;
  this.target = obj.target;
};

//******************************************************
// MAIN GRAPH CLASS CONSTRUCTOR
//******************************************************
var Graph = function(data, config) {
  //****************************************************
  // SET-UP GRAPH SVG
  //****************************************************
  this.svg = d3.select("body").append("svg")
    .attr("width", config.width)
    .attr("height", config.height)
    .append("g");

  //****************************************************
  // CREATE A RADIAL GRADIENT - USED ON NODES
  //****************************************************
  this.defs = this.svg.append("defs")

  this.gradient = this.defs.append("radialGradient")
    .attr("id", "nodeGradient")
    .attr({cx: .5, cy: .5, fx: .75, fy: .75, r: .55})
    .attr("spreadMethod", "pad");

  this.gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#E6E6FA")

  this.gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#0000EE")

  //****************************************************
  // MAIN GOODIES FOR THE GRAPH OBJECT
  //****************************************************
  this.nodes  = {};     // Object holding all the nodes
  this.links  = {};     // Object holding all the links
  this.store  = data;   // Data store w/ all the graphs
  this.config = config; // The passed in config object

  //*********************************************************
  // CONFIGURE THE FORCE LAYOUT FOR THE GRAPH SET TO PASSED 
  // IN CONFIG VALUES. THEN THESE ARE UPDATED VIA DAT.GUI
  //*********************************************************
  this.force = d3.layout.force()
  this.force
    .gravity(config.gravity)
    .charge(config.charge)
    .theta(config.theta)
    .friction(config.friction)
    .linkDistance(config.distance)
    .linkStrength(config.strength)
    .size([config.width, config.height]);

  //***********************************************************
  // SET DAT.GUI TO CHANGE VALUES IN THE CONFIG OBJECT
  //***********************************************************
  this.datgui = new dat.GUI();

  this.datgui.add(this.config, 'dataset', Object.keys(this.store)).onChange(function (d) {
    this.svg.selectAll(".node").remove();
    this.svg.selectAll(".link").remove();
    this.setData();
    this.update();
    this.force.start()
    this.shake();
  }.bind(this));

  this.datgui.add(this.config, 'charge', -1000, 1000).onChange(function (d) {
    this.force.charge(d);
    this.force.start()
  }.bind(this));

  this.datgui.add(this.config, 'gravity', -0.1, 1).onChange(function (d) {
    this.force.gravity(d);
    this.force.start()
  }.bind(this));

  this.datgui.add(this.config, 'theta', 0, 1).onChange(function (d) {
    this.force.theta(d);
    this.force.start()
  }.bind(this));

  this.datgui.add(this.config, 'friction', 0, 1).onChange(function (d) {
    this.force.friction(d);
    this.force.start()
  }.bind(this));

  var link_gui = this.datgui.addFolder('Links');

  link_gui.add(this.config, 'distance', 0, 200).onChange(function (d) {
    this.force.linkDistance(d);
    this.force.start()
  }.bind(this));

  link_gui.add(this.config, 'strength', 0, 1).onChange(function (d) {
    this.force.linkStrength(d);
    this.force.start()
  }.bind(this));

  link_gui.open(); // LEAVE "LINKS" FOLDER OPEN ON LOAD
  this.setData();  // INITIALIZE THE DATA TO THE PASSED IN DATASET
};

//***************************************************
// GRAPH.PROTOTYPE
//***************************************************
//******************************************
// LOAD A PARTICULAR DATASET FROM THE STORE
//******************************************
Graph.prototype.setData = function () {
  var data = this.store[this.config.dataset];

  this.nodes = {};
  this.links = {};

  for (var i = 0; i < data.length; i++) {
    this.addNode({id:i});
  }
  for (var j = 0; j < data.length; j++) {
    for (var k = 0; k < data[j].length; k++) {
      this.addLink(j, data[j][k]);
    }
  }
};

//******************************************
// "SHAKES" GRAPH OUT TO MINIMIZE TANGLES
//******************************************
Graph.prototype.shake = function () {
  setTimeout(function () {
    this.force.gravity(.0001);
    this.force.start();
  }.bind(this), 500)
  setTimeout(function () {
    this.force.gravity(this.config.gravity);
    this.force.start();
  }.bind(this), 1500)
};

//******************************************
// ADD A NEW NODE - NEEDS A UNIQUE ID
//******************************************
Graph.prototype.addNode = function (obj) {
  if (obj.id === undefined) throw "Node ID required";
  this.nodes[obj.id] = new Node(obj);
};

//******************************************
// RETURN AN ARRAY OF NODES FOR RENDER IN D3
//******************************************
Graph.prototype.getNodes = function () {
  var nodesArr = [];
  for (var key in this.nodes) {
    nodesArr.push(this.nodes[key]);
  }
  return nodesArr;
};

//******************************************
// REMOVE A NODE AND ALL ITS LINKS
//******************************************
Graph.prototype.removeNode = function (nodeID) {
  var node = this.nodes[nodeID], links = this.links;
  if (node) {
    delete this.nodes[nodeID];

    for (var l in links) {
      if (links[l].source === node || links[l].target === node) {
        delete links[l];
      }
    }
  } else {
    throw "Node not found";
  }
};

//******************************************
// ADD A LINK BY PASSING IN NODE IDs
//******************************************
Graph.prototype.addLink = function(begID, endID){
  var node1, node2, lid;
  if (this.nodes[begID] && this.nodes[begID]) {
    node1 = this.nodes[begID < endID ? begID: endID];
    node2 = this.nodes[begID < endID ? endID: begID];
    lid = node1.id + '_' + node2.id;
    this.links[lid] = new Link({id: lid, source: node1, target: node2});
  } else {
    throw "Both nodes must exist in the graph";
  }
};

//******************************************
// RETURN AN ARRAY OF LINKS FOR RENDER IN D3
//******************************************
Graph.prototype.getLinks = function () {
  var linksArr = [];
  for (var key in this.links) {
    linksArr.push(this.links[key]);
  }
  return linksArr;
};

//******************************************
// REMOVE A PARTICULAR LINK
//******************************************
Graph.prototype.removeLink = function(begID, endID){
  var id1 = begID < endID ? begID: endID;
  var id2 = begID < endID ? endID: begID;
  if (this.links[id1 + '_' + id2]) {
    delete this.links[id1 + '_' + id2];
  } else {
    throw "Link not found";
  }
};

//******************************************
// UPDATE WHEN NODES AND LINKS HAVE CHANGED
//******************************************
Graph.prototype.update = function(){
  var nodes = this.getNodes();
  var links = this.getLinks();

  this.force
    .nodes(nodes)
    .links(links)
    .start();

  var link = graph.svg.selectAll(".link")
    .data(links, function (d) { return d.id; });
    
  link.enter().append("line")
    .attr("class", "link")
    .style("stroke-width", "2px");

  link.exit().style("stroke", "red")
    .transition().duration(800)
    .style("opacity", 0)
    .remove();

  var node = graph.svg.selectAll(".node")
    .data(nodes, function (d) { return d.id; });

  node.enter().append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .style("fill", "url(#nodeGradient)")
    .on('dblclick', function (d) {
      this.removeNode(d.id);
      this.update();
    }.bind(this))
    .call(this.force.drag);

  node.exit().transition().duration(1000)
    .attr("cx", 2000)
    .attr("cy", 2000)
    .remove();

  this.force.on('tick', function () {
    link
      .attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });

    node
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; });
  });
};

//*********************************************
// RESIZE SVG AND FORCE ON BROWSER RESIZE
//*********************************************
Graph.prototype.onResize = function(){
  var width = window.innerWidth;
  var height = window.innerHeight;

  this.svg
    .attr("width", width)
    .attr("height", height);

  this.force.size([width, height]);
  this.force.start();
};
