
// basePath = "https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/"
// basePath = ""

//data = basePath + "viz1.json"
//showNetworkDiagram(data)

function showNetworkDiagram(data){

    width = 1120;
    height = 900;

    var svg = d3.select("#viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var color = d3.scaleOrdinal()                                                       //set node color below
        .domain(["Venetian Colonial","Venetian Citizen", "Ottoman", "Unknown","Other"])
        .range(["#5983D9", "#A63D33", "#D9AE89", "#45554E","#593640"]);

    var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(120).strength(.75))
        .force("charge", d3.forceManyBody().strength(function (d, i) {
            var a = i == 0 ? -1500 : -500; return a;})
            .distanceMin(-10)
            .distanceMax(450))                                                         //set distance between nodes here
        .force('collide', d3.forceCollide(37))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width/2))
        .force("y", d3.forceY(height/2));

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    d3.json(data, function(error, graph) {                                       //set input data file here
      if (error) throw error;

       // ****************** Link section ***************************
      var link = svg.append("g")
          .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
          .attr("stroke-width", function(d) { return 3.8*d.weight; })                //set edge thickness here
          .on("mouseover", function(d) {
                div.transition()
                    .duration(300)
                    .style("opacity", .9);
                div.html("Marriage tie" /*+ d.weight*/)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("width", "90px")
                    .style("height", "15px");
               })
              .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
              });

      // ****************** Node section ***************************
      var node = svg.append("g")
          .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")

      var circles = node.append("circle")
          .attr("r", function(d){return 4*d.node_size})                                 // set node radius here
          .attr("fill", function(d) { return color(d.subjecthood) })
          .on("mouseover", function(d) {
                div.transition()
                    .duration(300)
                    .style("opacity", .8);
                div.html( "Family: " + d.label + "<br/>" +
                        "# of dragoman: " + d.node_size + ((d.node_size === 4) ? " or more " : "") + "<br/>" +
                        "Subjecthood: "+ d.subjecthood)
                    .style("left", (d3.event.pageX + 20) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("width", "200px")
                    .style("height", "45px");
               })
          .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
          })
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      var labels = node.append("text")
          .text(function(d) {return d.label;})
          .attr('x', function(d){return 4 * d.node_size;})
          .attr('y', function(d){return 5;})
          .style("font-size",function(d){return 1.8*(d.node_size + 5) + "px";})        //set label text size here

      node.append("title")
          .text(function(d) { return d.labels;})

      simulation
          .nodes(graph.nodes)
          .on("tick", ticked);

      simulation.force("link")
          .links(graph.links);

      function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .attr('class', 'link');
       node
            .attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
            })
        }
    });

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      //d.fx = null;
      //d.fy = null;
    }

    // ****************** Legend section ***************************
    var circX = 25,
        circY = height - 15,
        circTextX = circX + 20,
        circTextX = circX + 20,
        circTextY = circY + 5,

        alignment = 20,
        circleX = 25,
        circleY = circY - 8*alignment,
        circleTextX = circleX + 20,
        circleTextY = circleY + 5,

        lineLength = 20,
        lineX = 15,
        lineY = circleY-7*alignment,
        lineTextX = lineX + 30,
        lineTextY = lineY + 5;

    // nationality
    svg.append("circle").attr("cx",circleX).attr("cy",circleY-5*alignment).attr("r", 6).style("fill", "#5983D9");
    svg.append("circle").attr("cx",circleX).attr("cy",circleY-4*alignment).attr("r", 6).style("fill", "#A63D33");
    svg.append("circle").attr("cx",circleX).attr("cy",circleY-3*alignment).attr("r", 6).style("fill", "#D9AE89");
    svg.append("circle").attr("cx",circleX).attr("cy",circleY-2*alignment).attr("r", 6).style("fill", "#45554E");
    svg.append("circle").attr("cx",circleX).attr("cy",circleY-1*alignment).attr("r", 6).style("fill", "#593640");
    svg.append("text").attr("x", circleTextX).attr("y", circleTextY-5*alignment).text("Venetian Colonial").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circleTextX).attr("y", circleTextY-4*alignment).text("Venetian Citizen").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circleTextX).attr("y", circleTextY-3*alignment).text("Ottoman Subject").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circleTextX).attr("y", circleTextY-2*alignment).text("Unkown").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circleTextX).attr("y", circleTextY-1*alignment).text("Other").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circleX-10).attr("y", circleY-6*alignment).text("Subjecthood by color: ").style("font-size", "15px").attr("alignment-baseline","middle");

    // marriage link
    /*svg.append("line").attr("x1",lineX).attr("y1",lineY-3*alignment).attr("x2",lineX+lineLength).attr("y2",lineY-3*alignment).attr("stroke-width", 1*3.8).attr("stroke", "#bdbdbd");
    svg.append("line").attr("x1",lineX).attr("y1",lineY-2*alignment).attr("x2",lineX+lineLength).attr("y2",lineY-2*alignment).attr("stroke-width", 2*3.8).attr("stroke", "#bdbdbd");
    svg.append("line").attr("x1",lineX).attr("y1",lineY-1*alignment).attr("x2",lineX+lineLength).attr("y2",lineY-1*alignment).attr("stroke-width", 3*3.8).attr("stroke", "#bdbdbd");
    svg.append("text").attr("x", lineTextX).attr("y", lineTextY-3*alignment).text("1 marriage").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", lineTextX).attr("y", lineTextY-2*alignment).text("2 marriages").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", lineTextX).attr("y", lineTextY-1*alignment).text("3 marriages").style("font-size", "15px").attr("alignment-baseline","middle");
    */
    svg.append("text").attr("x", circleX-10).attr("y", lineY-4*alignment).text("Marriage ties: ").style("font-size", "15px").attr("alignment-baseline","middle");
    
    // For ticket https://redmine.digital.utsc.utoronto.ca/issues/9413
    svg.append("line").attr("x1",lineX).attr("y1",lineY-3*alignment).attr("x2",lineX+lineLength).attr("y2",lineY-3*alignment).attr("stroke-width", 1*3.8).attr("stroke", "#bdbdbd");
    svg.append("text").attr("x", lineTextX).attr("y", lineTextY-3*alignment).text("one or more marriage ties").style("font-size", "15px").attr("alignment-baseline","middle");

    // Node size
    svg.append("circle").attr("cx", circX).attr("cy", circY-4*(alignment+9)).attr("r",1*4).style("fill", "#bdbdbd");
    svg.append("circle").attr("cx", circX).attr("cy", circY-3*(alignment+9)).attr("r",2*4).style("fill", "#bdbdbd");
    svg.append("circle").attr("cx", circX).attr("cy", circY-2*(alignment+9)).attr("r",3*4).style("fill", "#bdbdbd");
    svg.append("circle").attr("cx", circX).attr("cy", circY-1*(alignment+9)).attr("r",4*4).style("fill", "#bdbdbd");

    svg.append("text").attr("x", circTextX).attr("y", circTextY-4*(alignment+9)).text("1 dragoman in family").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circTextX).attr("y", circTextY-3*(alignment+9)).text("2 dragomans in family").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circTextX).attr("y", circTextY-2*(alignment+9)).text("3 dragomans in family").style("font-size", "15px").attr("alignment-baseline","middle");
    svg.append("text").attr("x", circTextX).attr("y", circTextY-1*(alignment+9)).text("4 or more dragomans in family").style("font-size", "15px").attr("alignment-baseline","middle");

    // For ticket https://redmine.digital.utsc.utoronto.ca/issues/9413
    //svg.append("circle").attr("cx", circX).attr("cy", circY-4*(alignment+9)).attr("r",1*4).style("fill", "#bdbdbd");
    //svg.append("text").attr("x", circTextX).attr("y", circTextY-4*(alignment+9)).text("one or more marriage ties").style("font-size", "15px").attr("alignment-baseline","middle");

    svg.append("text").attr("x", circleX-10).attr("y", circY-5*(alignment+7)).text("# of dragomans by node size: ").style("font-size", "15px").attr("alignment-baseline","middle");


}
