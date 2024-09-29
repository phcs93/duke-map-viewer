# Duke Map Viewer
A tool for viewing and filtering Duke Nukem 3D maps.

# DEMO
https://phcs93.github.io/duke-map-viewer/

# TO-DO

- floor
  - render tile alignment (based on sector first wall or not)
  - render tile panning
  - render tile animation

- sprites
  - render spawn angle
  - render camera aligned sprites Y as y - height
  - render sprite animation
  - render "multiplayer only" sprites?
  - render all non item sprites like floor sprites and decoration sprites
  - render player 1
  - double check if floor aligned sprites are being rendered with corret size

- fix rendering order based on z and element type
  - first render all sectors based on floorz
  - then -> render all decorative sprites based on z
  - then -> render all items above everything