// extend javascript array class by a remove function
// copied from https://stackoverflow.com/a/3955096/12267732
// https://stackoverflow.com/questions/60107431/d3-tree-with-collapsing-boxes-using-d3-version-4
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// how to get panning/zooming to go to a specific node
// https://stackoverflow.com/questions/39688256/force-layout-zoom-resets-on-first-tick-of-dragging-or-zomming/39689877#39689877
function showKinshipDiagram(treeData) {
  function drawDiagram(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.head;
    var script = document.createElement("script");
    script.type = "text/javaScript";
    script.srcObject = url;
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
  }

  // get the json data using fetch API
  fetch(treeData)
    .then((response) => response.json())
    .then((data) => {
      // store the data as a blob, and create a url to the blob
      var binaryData = [];
      binaryData.push(data);
      var javascriptURL = window.URL.createObjectURL(
        new Blob(binaryData.textContent, { type: "text/javaScript" })
      );

      drawDiagram(javascriptURL, function (javascriptURL) {
        // extend javascript array class by a remove function
        Array.prototype.remove = function () {
          var what,
            a = arguments,
            L = a.length,
            ax;
          while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
              this.splice(ax, 1);
            }
          }
          return this;
        };

        let startExpanded = data.startExpanded ? data.startExpanded : [];
        let startExpandedIds = data.startExpandedIds ? data.startExpandedIds : [];
        let startXModifier = data.startX ? data.startX : -1;
        let startYModifier = data.startY ? data.startY : -1;


        // mark unions
        for (var k in data.unions) {
          data.unions[k].isUnion = true;
        }
        // mark persons
        for (var k in data.persons) {
          data.persons[k].isUnion = false;
        }

        // Set the dimensions and margins of the diagram
        var screen_width = 1120,
          screen_height = 700;


        var rectHeight = 35,
          rectWidth = 123;

        var nodeX = (rectWidth / 5 + 15) * -1,
          nodeY = (rectHeight / 2) * -1;

        // helper variables
        var i = 0,
          duration = 700,
          x_sep = 160,
          y_sep = 40;

        // initialize panning, zooming
        const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", function() {
            g.attr("transform", d3.event.transform);
        });

    

        // initialize tooltips
        var tip = d3
          .tip()
          .attr("class", "d3-tip")
          .direction("e")
          .offset([0, 5])
          .html(function (d) {
            if (d.data.isUnion) return;
            var content = "<b>" + d.data.name + "</b>";

            if (d.data.class.includes("dragoman") == true) {
              content += "<b> (dragoman) </b>";
            }

            if (d.data.birthyear != "?" && d.data.deathyear != "?") {
              content += `<br>` + d.data.birthyear + ` - ` + d.data.deathyear;
            } else {
              content += `<br> Dates unknown`;
            }

            content += `<br> ID: ` + d.data.id + `<br></span>`;
            if (
              d.data.class.includes("showPortrait") == true &&
              d.data.class.includes("hasPortrait") == true
            ) {
              basePath =
                "https://dragomans.digital.utsc.utoronto.ca/sites/default/files/dragomans/images/";
              site_url =
                "https://dragomans.digital.utsc.utoronto.ca/islandora/object/";
              console.log(d);
              content +=
                `<a target="_blank" href="` +
                site_url +
                d.data.PID +
                `"><img src="` +
                basePath +
                d.data.portrait +
                `" width=150 height=200></a><br>`;
            }

            if (d.data.class.includes("portraitUnconfirmed") == true) {
              content += "<br> Note: Presumed portrait for " + d.data.name;
            }

            return content.replace(new RegExp("null", "g"), "?");
          });

        // append the svg object to the body of the page
        // assigns width and height
        // activates zoom/pan and tooltips
        const svg = d3
          .select("#viz")
          .append("svg")
          .attr("width", screen_width)
          .attr("height", screen_height)
          .call(zoom)
          .call(tip);

        // append group element
        const g = svg.append("g");

        // declare a dag layout
        var tree = d3
          .sugiyama()
          // .layering(d3.layeringLongestPath())
          // .nodeSize([40, 140])
          .nodeSize([y_sep, x_sep])
          // .decross(d3.decrossDfs())
          .coord(d3.coordGreedy()); // using greedy here as quad takes a ridiculous amount of time
          // .gap([1, 1]);
          // .coord(d3.coordQuad().linkCurve(1).nodeCurve(1).vertStrong(0).vertWeak(1));
          // removed separation as its no longer supported in d3-dag v1.1


        // make dag from edge list
        let dag = d3.graphConnect()(data.links); // this used to be d3.dagConnect() but it's now d3.graphConnect()


        // in order to make the family tree work, the dag
        // must be a node with id undefined. create that node if
        // not done automaticaly
        if (dag.id != undefined) {
          root = dag.copy(); // 2024-09 not sure if this is still a valid method on the updated library but no error is being thrown as of yet
          root.id = undefined;
          root.children_copy = [dag];
          dag = root;
        }

        // prepare node data
        // dag.nodes() returns a generator so we need to convert it to an array
        let root = null;
        var all_nodes = Array.from(dag.nodes()); // was dag.descendants but based on var name presuming it's all nodes
        all_nodes.forEach((n) => {
          n.id = n.data;
          n.data = data.persons[n.id] ? data.persons[n.id] : data.unions[n.id];
          n._children = [ ...n.children() ]; // all nodes collapsed by default
          n.children_copy = [];
          n.inserted_nodes = [];
          n.inserted_roots = [];
          n.neighbors = [];
          n.visible = false;
          n.inserted_connections = [];
          // slight optimization to avoid looping twice
          if (n.id === data.start) {
            root = n;
          }
        });

        // find root node and assign data
        if (root) {
          root.visible = true;
          root.neighbors = getNeighbors(root);
        }


        if (startXModifier != -1) {
          root.x0 = startXModifier;
        }
        if (startYModifier != -1) {
          root.y0 = startYModifier;
        }

        // overwrite dag root nodes
        dag.children_copy = [root];

        // draw dag, expand different layouts for different diagram
        uncollapse(root);
        for (const nodeId of startExpanded) {
          uncollapse(all_nodes.find((n) => n.id == nodeId));
        }
        for (const pair of startExpandedIds) {
          uncollapseById(all_nodes.find((n) => n.id == pair[0]), undefined, pair[1]);
        }


        update(root);

        const transform = d3.zoomIdentity
          .translate(-root.y0+y_sep, -root.x0+x_sep)
          .scale(1);
        svg.call(zoom.transform, transform);



        // collapse a node
        function collapse(d) {
          d.neighbors = getNeighbors(d);
          // remove root nodes and circle-connections
          var remove_inserted_root_nodes = (n) => {
            // remove all inserted root nodes
            dag.children_copy = dag.children_copy.filter(
              (c) => !n.inserted_roots.includes(c)
            );
            // remove inserted connections
            n.inserted_connections.forEach((arr) => {
              // check existence to prevent double entries
              // which will cause crashes
              if (arr[0].children_copy.includes(arr[1])) {
                arr[0]._children.push(arr[1]);
                arr[0].children_copy.remove(arr[1]);
              }
            });
            // repeat for all inserted nodes
            n.inserted_nodes.forEach(remove_inserted_root_nodes);
          };
          remove_inserted_root_nodes(d);

          // collapse neighbors which are visible and have been inserted by this node
          d.neighbors.forEach((n) => {
            if (n.visible && d.inserted_nodes.includes(n)) {
              // tag invisible
              n.visible = false;
              // if child, delete connection
              if (d.children_copy.includes(n)) {
                d._children.push(n);
                d.children_copy.remove(n);
              }
              // if parent, delete connection
              if (n.children_copy.includes(d)) {
                n._children.push(d);
                n.children_copy.remove(d);
              }
              // if union, collapse the union
              if (n.data.isUnion) {
                collapse(n);
              }
              // remove neighbor handle from clicked node
              d.inserted_nodes.remove(n);
            }
          });
        }

        /**
         * For ticket #9413, unique implement for Natalie requested to show Marcantonio's two wifes
         * @param d
         * @param make_roots
         */
        function uncollapseById(d, make_roots, id) {
          if (d == undefined) return;

          var collapsed_neighbors = d.neighbors.filter((n) => !n.visible);
          collapsed_neighbors.forEach((n) => {
            if (n.id === id) {
              // collect neighbor data
              n.neighbors = getNeighbors(n);
              // tag visible
              n.visible = true;
              // if child, make connection
              if (d._children.includes(n)) {
                d.children_copy.push(n);
                d._children.remove(n);
              }
              // if parent, make connection
              if (n._children.includes(d)) {
                n.children_copy.push(d);
                n._children.remove(d);
                // insert root nodes if flag is set
                if (make_roots && !d.inserted_roots.includes(n)) {
                  d.inserted_roots.push(n);
                }
              }
              // if union, uncollapse the union
              if (n.data.isUnion) {
                uncollapse(n, true);
              }
              // save neighbor handle in clicked node
              d.inserted_nodes.push(n);
            }
          });
          // make sure this step is done only once
          if (!make_roots) {
            var add_root_nodes = (n) => {
              // add previously inserted root nodes (partners, parents)
              n.inserted_roots.forEach((p) => dag.children_copy.push(p));
              // add previously inserted connections (circles)
              n.inserted_connections.forEach((arr) => {
                // check existence to prevent double entries
                // which will cause crashes
                if (arr[0]._children.includes(arr[1])) {
                  arr[0].children_copy.push(arr[1]);
                  arr[0]._children.remove(arr[1]);
                }
              });
              // repeat with all inserted nodes
              n.inserted_nodes.forEach(add_root_nodes);
            };
            add_root_nodes(d);
          }
        }

        // uncollapse a node
        function uncollapse(d, make_roots) {
          if (d == undefined) return;
          // neighbor nodes that are already visible (happens when
          // circles occur): make connections, save them to
          // destroy / rebuild on collapse
          d.neighbors = getNeighbors(d);
          // compress extended and collapsed neighbors into one loop for optimization
          d.neighbors.forEach((n) => {
            if (n.visible) {
              if (d._children.includes(n)) {
                d.inserted_connections.push([d, n]);
              }
              // if parent, make connection
              if (n._children.includes(d)) {
                d.inserted_connections.push([n, d]);
              }
            }
            else {
              // neighbor nodes that are invisible: make visible, make connections,
              // add root nodes, add to inserted_nodes
              n.neighbors = getNeighbors(n);
              // tag visible
              n.visible = true;
              // if child, make connection
              if (d._children.includes(n)) {
                d.children_copy.push(n);
                d._children.remove(n);
              }
              // if parent, make connection
              if (n._children.includes(d)) {
                n.children_copy.push(d);
                n._children.remove(d);
                // insert root nodes if flag is set
                if (make_roots & !d.inserted_roots.includes(n)) {
                  d.inserted_roots.push(n);
                }
              }
              // if union, uncollapse the union
              if (n.data?.isUnion) {
                uncollapse(n, true);
              }
              // save neighbor handle in clicked node
              d.inserted_nodes.push(n); 
            }
          });

          // make sure this step is done only once
          if (!make_roots) {
            var add_root_nodes = (n) => {
              // add previously inserted root nodes (partners, parents)
              n.inserted_roots.forEach((p) => dag.children_copy.push(p));
              // add previously inserted connections (circles)
              n.inserted_connections.forEach((arr) => {
                // check existence to prevent double entries
                // which will cause crashes
                if (arr[0]._children.includes(arr[1])) {
                  arr[0].children_copy.push(arr[1]);
                  arr[0]._children.remove(arr[1]);
                }
              });
              // repeat with all inserted nodes
              n.inserted_nodes?.forEach(add_root_nodes);
            };
            add_root_nodes(d);
          }
        }

        function is_extendable(node) {
          return node.neighbors.filter((n) => !n.visible).length > 0;
        }

        function getNeighbors(node, error) {
          if (error) throw error;
          if (node.data?.isUnion) {
            let temp = getChildren(node).concat(getPartners(node));
            return temp;
          } else {
            let temp = getOwnUnions(node).concat(getParentUnions(node));
            return temp;
          }
        }

        function getParentUnions(node) {
          if (node == undefined) return [];
          if (node.data?.isUnion) return [];
          var u_id = node.data?.parent_union;
          if (u_id) {
            var union = all_nodes.find((n) => n.id == u_id);
            return [union].filter((u) => u != undefined);
          } else return [];
        }

        function getParents(node) {
          var parents = [];
          if (node.data?.isUnion) {
            node.data?.partner.forEach((p_id) =>
              parents.push(all_nodes.find((n) => n.id == p_id))
            );
          } else {
            var parent_unions = getParentUnions(node);
            parent_unions.forEach(
              (u) => (parents = parents.concat(getParents(u)))
            );
          }
          return parents.filter((p) => p != undefined);
        }

        function getOtherPartner(node, union_data) {
          var partner_id = union_data.partner.find(
            (p_id) => (p_id != node.id) & (p_id != undefined)
          );
          return all_nodes.find((n) => n.id == partner_id);
        }

        function getPartners(node) {
          var partners = [];
          // return both partners if node argument is a union
          if (node.data?.isUnion) {
            node.data?.partner.forEach((p_id) =>
              partners.push(all_nodes.find((n) => n.id == p_id))
            );
          }
          // return other partner of all unions if node argument is a person
          else {
            var own_unions = getOwnUnions(node);
            own_unions.forEach((u) => {
              partners.push(getOtherPartner(node, u.data));
            });
          }
          return partners.filter((p) => p != undefined);
        }

        function getOwnUnions(node) {
          if (node.data?.isUnion) return [];
          unions = [];
          node.data?.own_unions.forEach((u_id) =>
            unions.push(all_nodes.find((n) => n.id == u_id))
          );
          return unions.filter((u) => u != undefined);
        }

        function getChildren(node) {
          let children = [];
          if (node.data?.isUnion) {
            node.children_copy = [ ...node.children() ];
            children = node.children_copy;
          } else {
            node.data.own_unions = getOwnUnions(node);
            node.data.own_unions.forEach(
              (u) => (children = children.concat(getChildren(u)))
            );
          }
          // sort children by birth year, filter undefined
          children = children
            .filter((c) => c != undefined)
            .sort((a, b) =>
              Math.sign((getBirthYear(a) || 0) - (getBirthYear(b) || 0))
            );
          return children;
        }

        function getBirthYear(node) {
          return new Date(node.data?.birthyear || NaN).getFullYear();
        }

        function getDeathYear(node) {
          return new Date(node.data?.deathyear || NaN).getFullYear();
        }

        function find_path(n) {
          var parents = getParents(n);
          var found = false;
          var result = null;
          parents.forEach((p) => {
            if (p && !found) {
              if (p.id == "profile-89285291") {
                found = true;
                result = [p, n];
              } else {
                result = find_path(p);
                if (result) {
                  found = true;
                  result.push(n);
                }
              }
            }
          });
          return result;
        }

        function update(source) {
          // Assigns the x and y position for the nodes
          tree(dag);

          


          let nodes = Array.from(dag.nodes()).filter((n) => n.visible);
          let links = Array.from(dag.links()).filter((n) => n.source.visible && n.target.visible);

          // ****************** Nodes section ***************************

          // Update the nodes...
          var node = g.selectAll("g.node").data(nodes, function (d) {
            return d.id || (d.id = ++i);
          });

          // Enter any new nodes at the parent's previous position.
          var timeout;
          var nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
              return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click)
            .on("mouseover", tip.show)
            //.on('mouseout', tip.hide)
            .on("mouseout", function (d) {
              var context = this;
              var args = [].slice.call(arguments);
              args.push(this);
              clearTimeout(timeout);
              timeout = setTimeout(function () {
                tip.hide.apply(context, args);
              }, 2000);
            })
            .attr("visible", true);

          // Add Circle for the nodes
          nodeEnter
            .append("rect")
            .attr("class", "node")
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("x", nodeX)
            .attr("y", nodeY)
            .attr("rx", 5)
            .style("fill", function (d) {
              return d.data.familyColor;
            });

          nodeEnter
            .append("svg:image")
            .attr("xlink:href", function (d) {
              if (d.data.isUnion) return;
              if (d.data.class.includes("dragoman") == true) {
                basePath =
                  "http://dragomans.digital.utsc.utoronto.ca/sites/default/files/dragomans/images/";
                return (href = basePath + "icon_dragoman_hat.png");
              }
            })
            .attr("x", function (d) {
              return nodeX + 97;
            })
            .attr("y", function (d) {
              return nodeY + 5;
            })
            .attr("height", 25)
            .attr("width", 25);

          nodeEnter
            .append("svg:image")
            .attr("xlink:href", function (d) {
              if (d.data.isUnion) return;
              if (
                d.data.class.includes("hasPortrait") == true &&
                d.data.class.includes("showPortrait") == true
              ) {
                basePath =
                  "http://dragomans.digital.utsc.utoronto.ca/sites/default/files/dragomans/images/";
                return (href = basePath + "icon_portrait.png");
              }
            })
            .attr("x", function (d) {
              return nodeX - 25;
            })
            .attr("y", function (d) {
              return nodeY + 5;
            })
            .attr("height", 25)
            .attr("width", 25);

          // Add names as node labels
          nodeEnter
            .append("text")
            .attr("dy", ".35em")
            .attr("x", nodeX + 5)
            .attr("y", nodeY + 10)
            .attr("text-anchor", "start")
            .text(function (d) {
              if (d.data.isUnion) return;
              return d.data.forename;
            })

            .append("tspan")
            .attr("dy", "1.25em")
            .attr("x", nodeX + 5)
            .attr("text-anchor", "start")
            .text(function (d) {
              if (d.data.isUnion) return;
              return d.data.surname;
            });

          // UPDATE
          var nodeUpdate = nodeEnter.merge(node);

          // Transition to the proper position for the node
          nodeUpdate
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
              return "translate(" + d.y + "," + d.x + ")";
            });

          // Update the node attributes and style
          nodeUpdate
            .select("rect.node")
            .attr(
              "width",
              (d) => rectWidth * !d.data.isUnion + 0 * d.data.isUnion
            )
            .attr(
              "height",
              (d) => rectHeight * !d.data.isUnion + 0 * d.data.isUnion
            )
            .style("stroke", function (d) {
              return is_extendable(d) ? "black" : "transparent";
            })
            .style("stroke-dasharray", "0.25em")
            .attr("cursor", "pointer");

          // Remove any exiting nodes
          var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
              return "translate(" + source.y + "," + source.x + ")";
            })
            .attr("visible", false)
            .remove();

          // On exit reduce the node circles size to 0
          nodeExit.select("circle").attr("r", 2e-6);

          // On exit reduce the opacity of text labels
          nodeExit.select("text").style("fill-opacity", 2e-6);

          // ****************** Links section ***************************

          // Update the links...
          var link = g.selectAll("path.link").data(links, function (d) {
            return d.source.id + d.target.id;
          });

          // Enter any new links at the parent's previous position.
          var linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            //.style("stroke", function(d){return d.target.data.familyColor})
            .attr("d", function (d) {
              var o = { x: source.x0, y: source.y0 };
              return diagonal(o, o);
            });

          // UPDATE
          var linkUpdate = linkEnter.merge(link);

          // Transition back to the parent element position
          linkUpdate
            .transition()
            .duration(duration)
            .attr("d", (d) => diagonal(d.source, d.target));

          // Remove any exiting links
          var linkExit = link
            .exit()
            .transition()
            .duration(duration)
            .attr("d", function (d) {
              var o = { x: source.x, y: source.y };
              return diagonal(o, o);
            })
            .remove();

          // Store the old positions for transition.
          nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });

          // Creates a curved (diagonal) path from parent to the child nodes
          function diagonal(s, d) {
            path = `M ${s.y} ${s.x}
                        C ${(s.y + d.y + 200) / 2} ${s.x},
                            ${(s.y + d.y - 30) / 2} ${d.x},
                            ${d.y} ${d.x}`;
            return path;
          }

          // Toggle unions, children, partners on click.
          function click(d) {
            // do nothing if node is union
            if (d.data.isUnion) {
              return
            }

            // uncollapse if there are uncollapsed unions / children / partners
            if (is_extendable(d)) {
              uncollapse(d);
             }
            // collapse if fully uncollapsed
            else {
              collapse(d);
            }

            const x = d.x;
            const y = d.y;
          
          
            // Apply the transformation to the g element
            const transform = d3.zoomIdentity
            .translate(-y+textY, -x+textX)
            .scale(1);
            svg.call(zoom.transform, transform);
            // g.transition()
            //    .duration(750)
            //    .attr("transform", `translate(${-y+textY}, ${-x+textX}) scale(1)`);
            update(d);
          }
        }

        // ****************** Legends section ***************************
        var textX = 40,
          textY = 480,
          noteX = 690,
          rectX = textX - 30,
          rectY = textY - 10,
          alignment = 15,
          width = 23,
          height = 10,
          icon_width = 20,
          icon_height = 20;

        // legend for portrait and dragoman icon
        if (data.start == kinDiagram3) {
          svg
            .append("image")
            .attr("x", noteX + 295)
            .attr("y", textY + 3 * alignment)
            .attr("width", icon_width)
            .attr("height", icon_height)
            .attr("xlink:href", function (d) {
              basePath =
                "http://dragomans.digital.utsc.utoronto.ca/sites/default/files/dragomans/images/";
              return basePath + "icon_portrait.png";
            });
          svg
            .append("text")
            .attr("x", noteX + 295 + icon_width)
            .attr("y", textY + 4 * alignment)
            .text("Portrait")
            .style("font-size", "15px")
            .attr("alignment-baseline", "middle")
            .style("fill", "black");
        }
        svg
          .append("image")
          .attr("x", noteX + 295)
          .attr("y", textY + 5 * alignment)
          .attr("width", icon_width)
          .attr("height", icon_height)
          .attr("xlink:href", function (d) {
            basePath =
              "http://dragomans.digital.utsc.utoronto.ca/sites/default/files/dragomans/images/";
            return basePath + "icon_dragoman_hat.png";
          });
        svg
          .append("text")
          .attr("x", noteX + 295 + icon_width)
          .attr("y", textY + 6 * alignment)
          .text("Dragoman")
          .style("font-size", "15px")
          .attr("alignment-baseline", "middle")
          .style("fill", "black");

        // legend for note
        svg
          .append("text")
          .attr("x", noteX)
          .attr("y", textY + 8 * alignment)
          .text(
            "Click on individual names with dotted borders to expand the view"
          )
          .style("font-size", "15px")
          .attr("alignment-baseline", "middle")
          .style("fill", "black");
        svg
          .append("text")
          .attr("x", noteX)
          .attr("y", textY + 9 * alignment)
          .text("Pan and zoom using the mouse")
          .style("font-size", "15px")
          .attr("alignment-baseline", "middle")
          .style("fill", "black");

        /* legend for node color by surname
    svg.append("text").attr("x", rectX).attr("y", textY + 0*alignment).text("Node Color by Surname:").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 1*alignment).text("Borisi").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 2*alignment).text("Brutti").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 3*alignment).text("Mascellini").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 4*alignment).text("Mamuca della Torre").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 5*alignment).text("Tarsia").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 6*alignment).text("Carli").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 7*alignment).text("Theÿls").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 8*alignment).text("Pisani").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 9*alignment).text("Olivieri").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("text").attr("x", textX).attr("y", textY + 10*alignment).text("Other").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
    svg.append("rect").attr("x", rectX).attr("y", rectY + 1*alignment).attr("width",width).attr("height",height).style("fill","#A6692B");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 2*alignment).attr("width",width).attr("height",height).style("fill","#749983");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 3*alignment).attr("width",width).attr("height",height).style("fill","#A69F4C");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 4*alignment).attr("width",width).attr("height",height).style("fill","#5B6658");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 5*alignment).attr("width",width).attr("height",height).style("fill","#B39D91");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 6*alignment).attr("width",width).attr("height",height).style("fill","#2E4F59");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 7*alignment).attr("width",width).attr("height",height).style("fill","#A63D33");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 8*alignment).attr("width",width).attr("height",height).style("fill","#593640");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 9*alignment).attr("width",width).attr("height",height).style("fill","#374E99");
    svg.append("rect").attr("x", rectX).attr("y", rectY + 10*alignment).attr("width",width).attr("height",height).style("fill","#C0C0C0");
    */
      });
    });
}
