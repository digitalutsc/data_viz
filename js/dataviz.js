/*jQuery(window).load(function(){

	var viewerDiv = jQuery(".islandora-binary-object-content").first();
	var object_pid = Drupal.settings.islandora_dataviz.pid;

	if (object_pid == "dragomans:93") {
	  viewerDiv.empty().append('<div width="1120" height="900" id="viz"></div>');
		data = "/sites/default/files/dragomans/data/viz1.json";
		showNetworkDiagram(data);
  } else if (object_pid == "dragomans:94") {
    viewerDiv.empty().append('<div width="1120" height="900" id="viz"></div>');
    data = "/sites/default/files/dragomans/data/viz2.json";
    showNetworkDiagram(data);
  } else if (object_pid == "dragomans:40") {
    viewerDiv.empty().append('<div height="700" id="kingship-diagram-1" width="800"></div>');
	data = "/sites/default/files/dragomans/data/kinship1.js";
	showKinshipDiagram(data);
  } else if (object_pid == "dragomans:41") {
    viewerDiv.empty().append('<div height="700" id="kingship-diagram-1" width="800"></div>');
    data = "/sites/default/files/dragomans/data/kinship2.js";
    showKinshipDiagram(data);
  } else if (object_pid == "dragomans:64") {
    viewerDiv.empty().append('<div height="700" id="kingship-diagram-1" width="800"></div>' +
    '<div class="row">' +
    '<div class="column"><img alt="kingship_diagram3b" src="https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/dragomans/images/kinship_diagram_3b.png" width="95%"></div>' +
    '<div class="column"><img alt="kingship_diagram3d" src="https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/dragomans/images/kinship_diagram_3d.png" width="100%"></div>' +
    '</div>');
    data = "/sites/default/files/dragomans/data/kinship3.js";
    showKinshipDiagram(data);
  }

});
*/

(function ($, Drupal, drupalSettings) {
  "use strict";
  Drupal.behaviors.jsDataVizTest = {
    attach: function (context, settings) {
      $(".js-var", context)
        .once()
        .each(function () {
          $(".js-var").first().empty().append('<div id="viz"></div>');

          if (settings.data_viz.type == "Network")
            showNetworkDiagram(settings.data_viz.path);
          else if (settings.data_viz.type == "Kinship")
            showKinshipDiagram(settings.data_viz.path);
        });
    },
  };
})(jQuery, Drupal, drupalSettings);
