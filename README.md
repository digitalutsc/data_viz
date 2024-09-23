# data_viz
This module allows for the representation of JSON data in two types of diagrams.
1. Network Diagram
2. Kinship Diagram
## Requirements
This module requires Drupal core 8.8 and above.
## Installation and Configuration
Clone the repository into your Drupal modules folder or install with Composer. Enable the module and define a new view mode for Media, and then change the viewer for file in Media Types to show diagram of your choice.
## Expected Form of Input JSON file
### Kinship
- `start` which identifies which node is the starting node
- `persons` which contains all the node data as a dictionary
    - Each entry is a node ID (i.e. `I0127`)
        - `id` String
        - `class` String
        - `forename` String
        - `surname` String
        - `PID` String
        - `portrait` String
        - `birthyear` String
        - `deathyear` String
        - `own_unions` Array[String]
        - `parent_union` String
        - `familyColor` String
- `unions` a dictionary of the unions and the nodes they connect
    - Each entry is a link ID (i.e. `F0001`)
        - `id` String
        - `partner` Array[String]
        - `children` Array[String]
- `links` a 2D array linking unions to persons
    - Each entry is an Array[String] that contains two strings 
        - {`union ID`}
        - {`node ID`}
- `startExpanded` an Array[String] which correspond to nodes which should be expanded initially
- `startExpandedIds` a 2D array to allow custom behavior of expanding a node but only making a specific node visible
    - Each entry contains two strings, one of the node to expand, one of the union corresponding to the node you wish to make visible
### Network
- `nodes` An array of dictionaries 
    - `id` Integer
    - `label` String
    - `dragoman_count` Integer
    - `node_size` Integer
    - `subjecthood` String
    - `dragoman_service` String
    - `Polygon` Integer
    - `employed in Instanbul? (only include if y)` "y"/"n"
- `links` An array of dictionaries
    - `source` Integer
    - `target` Integer
    - `weight` Integer


