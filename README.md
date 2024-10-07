# Duke Map Viewer
A tool for viewing and filtering Duke Nukem 3D maps.

# DEMO
https://phcs93.github.io/duke-map-viewer/

# TO-DO

- map filtering
  - consider netduke32 ctf/tdm maps -> check how its done

- tile
  - render tile animation
  - optimize number of defs and patterns => create an unique id for each comnbination

- floor
  - render tile alignment (based on sector first wall or not)
  - render tile panning

- sprites
  - render spawn angle
  - render player 1

- fix grp serialization -> it doesnt consider files not added to "this.Files"