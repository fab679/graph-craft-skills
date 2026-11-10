---
name: graph-craft-drive-canvas
description: Drive the live graph-craft canvas over MCP — camera, selection, layout, shortest paths, algorithms, styling, pins, groups, notes, view filters, tabs, panels, history and export.
---

# Drive the live canvas

`canvas_command` needs an **editor** key. Commands travel over the board's SSE stream and are **fire-and-forget**: if no board is open they are dropped. Data writes remain durable in Dgraph.

Node references (`node`, `nodes`, `from`, `to`) accept ids **or** labels. Group references accept a group id **or** name.

## Camera and selection

```jsonc
{"action":"fit"}
{"action":"focus","node":"Elena Marsh"}
{"action":"details","node":"Elena Marsh"}
{"action":"select","nodes":["Elena Marsh","Warehouse 7"]}
{"action":"select_all"}
{"action":"select_neighbours"}
{"action":"invert"}
{"action":"select_edge","edge":"<edge id>"}
{"action":"find","query":"Elena"}
{"action":"focus_mode","hops":20,"hideOthers":true}   // hops: 0–20; 0 turns focus off
{"action":"zoom","zoom":1.4}
{"action":"pan","panX":120,"panY":-40}
{"action":"pan_to","x":-120,"y":-60}
{"action":"fit_rect","x":-200,"y":-150,"w":600,"h":500}
{"action":"map_focus","lat":42.3601,"lng":-71.0589}
{"action":"move","node":"Elena Marsh","x":420,"y":-80}
{"action":"node_duplicate","node":"Elena Marsh","offsetX":40,"offsetY":40}
```

Agent `select` is **visual-only**; it does not open the manual multi-select Details panel. Use `details` when you want the panel.

## Layout, paths and algorithms

```jsonc
{"action":"layout","layout":"force"}       // force, radial, grid, geo, ...
{"action":"path","from":"Elena Marsh","to":"Jeremy Bowers","pathMode":"k","k":3,"directed":true,"rels":["WORKS_AT","NEAR"]}
{"action":"algo","algo":"pagerank","directed":true}
{"action":"algo","algo":"communities","resolution":1.4}
{"action":"clear_overlay"}
```

- `path` supports `pathMode` (`shortest`/`all`/`k`), `k`, `directed`, `weightProp`, `rels`. It switches the Analyze panel to path mode and applies the overlay. If an endpoint is missing it loads the active graph once.
- `algo`: `path`, `wave`, `components`, `communities`, `pagerank`, `betweenness`, `closeness`, `degree`, `eigenvector`, `cycles`, `hits`.
- Algorithm options: `maxDepth`, `damping`, `normBetw`, `wassermanFaust`, `eigIters`, `normHits`, `resolution`, `degMode`.

## Styling, pins, groups and notes

```jsonc
{"action":"style_node","nodes":["Elena Marsh"],"color":"#e11d48","icon":"user","caption":"Elena"}
{"action":"style_type","type":"Person","color":"#6366f1"}
{"action":"style_edge","type":"KNOWS","color":"#10b981"}
{"action":"reset_style","resetScope":"node","node":"Elena Marsh"}
{"action":"pin","nodes":["Elena Marsh"]}
{"action":"unpin","nodes":["Elena Marsh"]}

{"action":"group_create","nodes":["Elena Marsh","Warehouse 7"],"groupName":"Warehouse lead","groupColor":"#6366f1"}
{"action":"group_details","group":"Warehouse lead"}
{"action":"group_description","group":"Warehouse lead","description":"Warehouse access + CCTV + vehicle"}
{"action":"group_members","group":"Warehouse lead","groupAdd":["Nora Ellison"],"groupRemove":["Ford Transit"]}
{"action":"group_collapse","group":"Warehouse lead"}
{"action":"group_expand","group":"Warehouse lead"}
{"action":"group_visibility","group":"Warehouse lead","visibility":"hidden"}
{"action":"group_rename","group":"Warehouse lead","groupName":"Warehouse cell"}
{"action":"group_delete","group":"Warehouse cell"}
{"action":"group_color","group":"Warehouse lead","groupColor":"#dc2626"}
{"action":"group_move","group":"Warehouse lead","direction":"top"}

{"action":"note_add","node":"Elena Marsh","note":"Verify CCTV 7-C"}
{"action":"note_edit","node":"Elena Marsh","noteId":"<note id>","note":"Checked CCTV 7-C"}
{"action":"note_delete","node":"Elena Marsh","noteId":"<note id>"}
```

`style_*` accept `color`, `icon`, `image`, `caption`. `reset_style` takes `resetScope` (`node`/`type`). `group_move` takes `direction` (`top`/`bottom`/`up`/`down`).

## View, tools, tabs, panels, history and export

```jsonc
{"action":"hide","hiddenTypes":["Event"],"hiddenRels":["CHECKED_IN_EVENT"]}
{"action":"time","timeOn":true,"timeKey":"date","timeFrom":0,"timeTo":0}
{"action":"time_play","playing":true}
{"action":"time_step","step":0.1}
{"action":"basemap","basemap":true}
{"action":"render_mode","renderMode":"canvas"}
{"action":"theme","theme":"dark"}
{"action":"accent","accent":"forest"}
{"action":"tool","tool":"select"}
{"action":"select_shape","selectShape":"lasso"}

{"action":"tab_new"}
{"action":"tab_switch","tab":"<tab id>"}
{"action":"tab_close","tab":"<tab id>"}
{"action":"rename","name":"Investigation v2"}
{"action":"panel","panel":"analyze"}
{"action":"panel","panel":null}

{"action":"canvas_clear"}
{"action":"graph_load","graph":"Investigation"}
{"action":"graph_delete","graph":"Investigation copy"}
{"action":"export","format":"svg"}
{"action":"export_json"}
{"action":"node_add","x":120,"y":-40,"label":"Note","type":"Note","properties":{"source":"agent"}}
{"action":"settings","captionProp":"name","paletteSeed":0,"defaultLayout":"force"}
{"action":"undo"}
{"action":"redo"}
```

- `export` triggers a browser download of the current view (`svg` or `png`); `export_json` downloads the board document.
- `panel` opens a dock panel (`explore`, `find`, `layers`, `layout`, `focus`, `analyze`, `time`, `groups`, `db`, `file`) or closes it with `null`.
- `canvas_clear` starts an empty board. `graph_load` loads a named graph from Dgraph.
- `theme` and `accent` change the board appearance; `render_mode` switches canvas/WebGL.

## Delivery rules

- A command sent while no board is open is **dropped**. There is no acknowledgement channel yet.
- If a command references a node that is not in the open graph, it no-ops.
- Canvas-only changes (styles, groups, notes, pins, tabs, view filters, positions) live in the board document. The user must **Save** to persist them to Dgraph.
- Prefer `focus`, `select`, `path` and `group_create` for live explanations; they are visible immediately and do not mutate data.
