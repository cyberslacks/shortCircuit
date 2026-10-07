# ShortCircuit Lab

A browser schematic editor and DC circuit simulator with an MCP server that can build, inspect, visualize, and solve the same circuit model.

## Run the workbench

Requires Node.js 18 or newer. No package install is needed.

```sh
npm start
```

Open [http://localhost:4173](http://localhost:4173). The starter page contains a 5 V source and 1 kΩ resistor. Click parts in the Components list to add them. Click a terminal dot and then another terminal dot to wire them. Select a part to edit its value. Press **Run simulation** (or Ctrl/⌘+Enter) to solve.

Projects are saved by the local server in `data/projects.json`, so the browser and MCP server work on the same project library. Use the project menu to switch projects, **Save as…** to keep a named copy, and **Delete** to remove the current project. **New** starts a blank project. **Export SVG** downloads the current schematic as a standalone SVG file. Existing browser-only projects are copied into the shared store the first time the app connects.

### Run with Docker

```sh
docker compose up --build -d
```

The workbench is published on `http://localhost:4173` on the host. Stop it with `docker compose down`.

## Connect over MCP

The stdio server uses the MCP tools protocol and has no third party dependencies. Add a server entry to your MCP client, substituting the full path to this directory:

```json
{
  "mcpServers": {
    "shortcircuit-lab": {
      "command": "node",
      "args": ["/absolute/path/to/shortCircuit/mcp-server.js"]
    }
  }
}
```

Available tools:

- `circuit_new` creates a fresh named circuit.
- `circuit_add_component` places parts from the library: breadboard; resistors, ceramic/electrolytic capacitors, supercapacitor, inductor, fuse, switch; diode, LED, Schottky, Zener, TVS, MOV; 12 V/5 V buck modules, 3.3 V regulator, P-channel MOSFET; Ford NTC temperature sender, fuel sender, oil pressure transducer, LM1815 tach VR conditioner, LDR, relay/driver, 3-pin sensor and 4-pin connectors; BAT54S clamp, 74HC165, SN65HVD230, MCP2515, TCA9548A, ESP32-P4/S3 boards, SSD1306 OLED; voltage/current sources, lamp, and ground. Coordinates are schematic pixels in a 1000 × 600 viewBox. The MCP server rejects coordinates that overlap another component by less than 20 pixels; omit coordinates to let it choose a clear position. Component values and ratings can be set in the tool arguments or properties panel.
- `circuit_connect` connects two component terminals. Two-terminal passive parts use `a` and `b`; diode-family parts use `a` and `k`; voltage sources use `+` and `−`; buck/regulator pins use `vin`, `gnd`, and `vout`. Breadboard holes use `r01a` through `r30j`, and rails use `tpa`–`tpj`, `tna`–`tnj`, `bpa`–`bpj`, and `bna`–`bnj`. Each five-hole row bank and each power rail is internally connected.
- `circuit_simulate` returns DC node voltages and component voltage, current, and power. Capacitors act as open circuits at DC; diodes and clamps use piecewise DC models; buck/regulator modules use regulated-output DC macro models with input loading. It does not calculate switching waveforms, MOSFET switching, IC logic, or capacitor charge/discharge transients. Those parts remain available as pin-level schematic symbols. A ground symbol is required.
- `circuit_visualize` returns the current schematic as SVG markup.
- `circuit_inspect` returns the model and its wires.

MCP includes `circuit_project_list`, `circuit_project_open`, `circuit_project_save`, and `circuit_project_delete` to manage the shared projects. Component additions and wires save automatically. The MCP process and browser must point to the same `data/projects.json`; Docker Compose mounts one shared volume for both services. For a Docker-based MCP client, run `docker compose --profile mcp run --rm -T mcp` from this project directory as the server command. For a Node-based client, run `node /absolute/path/to/shortCircuit/mcp-server.js` from this project directory.

## Simulation scope

The component library includes parts from the 1988 Ford F-350 digital dash power and P4/S3 wiring plans. Breadboard five-hole banks and power rails are electrically common. The DC solver uses modified nodal analysis for sources, resistive parts, and the library's approximate diode and regulated-output models. Capacitors are open circuits in DC analysis; inductors use their configured series resistance. Temperature, fuel, and light senders are editable fixed-resistance equivalents; transducers, tach conditioners, relays, and IC modules are pin-level symbols. It reports errors for floating/singular circuits, converter input range violations, and converter output overcurrent. Transient waveforms, MOSFET switching, and IC logic simulation are not modeled yet.
# shortCircuit
