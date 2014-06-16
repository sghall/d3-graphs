var Config = function (options) {
  for (var opt in options) {
    this[opt] = options[opt];
  }
};

var Node = function(obj) {
  this.id = obj.id;
};

var Link = function(obj) {
  this.id = obj.id;
  this.source = obj.source;
  this.target = obj.target;
};

var Graph = function(data, config) {

  this.svg = d3.select("body").append("svg")
    .attr("width", config.width)
    .attr("height", config.height)
    .append("g");

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

  this.nodes  = {};
  this.links  = {};
  this.store  = data;
  this.config = config;
  this.force  = d3.layout.force()

  this.force
    .gravity(config.gravity)
    .charge(config.charge)
    .friction(config.friction)
    .linkDistance(config.distance)
    .linkStrength(config.strength)
    .size([config.width, config.height]);

  this.datgui = new dat.GUI();

  this.datgui.add(this.config, 'dataset', Object.keys(this.store)).onChange(function (d) {
    this.svg.selectAll(".node").remove();
    this.svg.selectAll(".link").remove();
    this.setData();
    this.update();
    this.force.start()
  }.bind(this));

  this.datgui.add(this.config, 'charge', -1000, 1000).onChange(function (d) {
    this.force.charge(d);
    this.force.start()
  }.bind(this));

  this.datgui.add(this.config, 'gravity', -0.1, 1).onChange(function (d) {
    this.force.gravity(d);
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

  link_gui.open();

  this.setData();

};

Graph.prototype.setData = function () {

  console.log(this.config.dataset)
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

Graph.prototype.addNode = function (obj) {
  if (obj.id === undefined) throw "Node ID required";
  this.nodes[obj.id] = new Node(obj);
};

Graph.prototype.getNodes = function () {
  var nodesArr = [];
  for (var key in this.nodes) {
    nodesArr.push(this.nodes[key]);
  }
  return nodesArr;
};

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

Graph.prototype.addLink = function(begID, endID){
  var beg, end, lid;
  if (this.nodes[begID] && this.nodes[begID]) {
    beg = this.nodes[begID < endID ? begID: endID];
    end = this.nodes[begID < endID ? endID: begID];
    lid = beg.id + '_' + end.id;
    this.links[lid] = new Link({id: lid, source: beg, target: end});
  } else {
    throw "Both nodes must exist in the graph";
  }
};

Graph.prototype.getLinks = function () {
  var linksArr = [];
  for (var key in this.links) {
    linksArr.push(this.links[key]);
  }
  return linksArr;
};

Graph.prototype.removeLink = function(begID, endID){
  var beg = begID < endID ? begID: endID;
  var end = begID < endID ? endID: begID;
  if (this.links[beg + '_' + end]) {
    delete this.links[beg + '_' + end];
  } else {
    throw "Link not found";
  }
};

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

  link.exit().remove();

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

  node.exit().remove();

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

Graph.prototype.onResize = function(){
  var width = window.innerWidth;
  var height = window.innerHeight;

  this.svg
    .attr("width", width)
    .attr("height", height);

  this.force.size([width, height]);
  this.force.start();
};
