# ShortCircuit Lab

A browser schematic editor and DC circuit simulator with an MCP server that can build, inspect, visualize, and solve the same circuit model.

## Run the workbench

Requires Node.js 18 or newer. No package install is needed.

```sh
npm start
```

Open [http://localhost:4173](http://localhost:4173). The starter page contains a 5 V source and 1 kΩ resistor. Click parts in the Components list to add them. Click a terminal dot and then another terminal dot to wire them. Select a part to edit its value. Press **Run simulation** (or Ctrl/⌘+Enter) to solve.

The current schematic is saved in this browser's local storage. **New** starts a blank schematic.

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
- `circuit_add_component` places `resistor`, `lamp`, `voltage`, `current`, or `ground` components. Coordinates are schematic pixels in a 1000 × 600 viewBox. Defaults: 1 kΩ resistor, 100 Ω lamp, 5 V source, 5 mA source.
- `circuit_connect` connects two component terminals. Resistor, lamp, and current source terminals are `a` and `b`; voltage source terminals are `+` and `−`; ground uses `gnd`. Each component ID is returned when it is added.
- `circuit_simulate` returns DC node voltages and per-component voltage, current, and power. A ground symbol is required.
- `circuit_visualize` returns the current schematic as SVG markup.
- `circuit_inspect` returns the model and its wires.

Each MCP server process owns an in-memory circuit for its lifetime. Browser local storage and an MCP process do not share circuit state.

For a Docker-based MCP client, run `docker compose --profile mcp run --rm -T mcp` from this project directory as the server command. For a Node-based client, run `node /absolute/path/to/shortCircuit/mcp-server.js`.

## Simulation scope

The solver uses modified nodal analysis for ideal voltage/current sources and linear resistors. Lamps are modeled as resistors with the chosen resistance. It reports a useful error for floating or singular circuits. It does not yet model transient behavior, capacitors, inductors, or nonlinear semiconductor devices.
# shortCircuit
