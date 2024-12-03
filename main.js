document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('map-container');
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    const data = { nodes, edges };
    const options = {
        layout: {
            improvedLayout: true,
        },
        physics: {
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 200,
                springConstant: 0.04,
            },
            stabilization: {
                iterations: 250,
            },
        },
        interaction: {
            multiselect: true,
            zoomView: true,
            dragView: true,
        },
        edges: {
            arrows: { to: false },
            smooth: true,
        },
    };

    const network = new vis.Network(container, data, options);
    let nextId = 1;

    // Add Person
    document.getElementById('add-person').addEventListener('click', () => {
        const personName = prompt('Enter the name of the person:');
        if (personName) {
            nodes.add({
                id: nextId++,
                label: personName,
                group: 'person',
                color: { background: '#4CAF50', border: '#2E7D32' },
            });
        }
    });

    // Add Context
    document.getElementById('add-context').addEventListener('click', () => {
        const contextName = prompt('Enter the name of the context (e.g., School, Work):');
        if (contextName) {
            nodes.add({
                id: nextId++,
                label: contextName,
                group: 'context',
                color: { background: '#2196F3', border: '#0D47A1' },
            });
        }
    });

    // Add Connection
    document.getElementById('add-connection').addEventListener('click', () => {
        const selectedNodes = network.getSelectedNodes();
        if (selectedNodes.length !== 2) {
            alert('Please select two nodes to create a connection.');
            return;
        }

        const [fromId, toId] = selectedNodes;
        const connectionType = confirm(
            'Is this an indirect connection? (e.g., "Through another person/context")'
        );

        if (connectionType) {
            const intermediaryName = prompt('Enter the name of the intermediary (e.g., "Through John"):');
            if (intermediaryName) {
                const intermediaryId = nextId++;
                nodes.add({
                    id: intermediaryId,
                    label: intermediaryName,
                    group: 'intermediary',
                    color: { background: '#FF9800', border: '#F57C00' },
                });

                edges.add({ from: fromId, to: intermediaryId, width: 2 });
                edges.add({ from: intermediaryId, to: toId, width: 2 });

            }
        } else {
            const connectionDetails = prompt('Enter additional details for this connection (optional):');

            edges.add({
                from: fromId,
                to: toId,
                label: connectionDetails || '',
                font: { align: 'top' },
            });
        }
    });

    // Delete Selected Nodes or Edges
    document.getElementById('delete-item').addEventListener('click', () => {
        const selectedNodes = network.getSelectedNodes();
        const selectedEdges = network.getSelectedEdges();

        if (selectedNodes.length > 0) {
            nodes.remove(selectedNodes);
        }

        if (selectedEdges.length > 0) {
            edges.remove(selectedEdges);
        }
    });

    // Customize Individual Node/Edge Colors
    document.getElementById('customize-colors').addEventListener('click', () => {
        const selectedNodes = network.getSelectedNodes();
        const selectedEdges = network.getSelectedEdges();

        if (selectedNodes.length > 0) {
            const nodeColor = prompt('Enter the new color for the selected node(s) (e.g., #FF0000):');
            if (nodeColor) {
                selectedNodes.forEach(nodeId => {
                    nodes.update({
                        id: nodeId,
                        color: { background: nodeColor, border: nodeColor },
                    });
                });
            }
        } else if (selectedEdges.length > 0) {
            const edgeColor = prompt('Enter the new color for the selected edge(s) (e.g., #FF0000):');
            if (edgeColor) {
                selectedEdges.forEach(edgeId => {
                    edges.update({
                        id: edgeId,
                        width: 5,
                        color: { color: edgeColor },
                    });
                });
            }
        } else {
            const backgroundColor = prompt('Enter the background color for the map (e.g., #FFFFFF):');
            if (backgroundColor) {
                container.style.backgroundColor = backgroundColor;
            }
        }
    });

    // Save Map
    document.getElementById('save-map').addEventListener('click', () => {
        const data = {
            nodes: nodes.get(),
            edges: edges.get(),
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'connection_map.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Map saved as JSON file!');
    });

    // Load Map
    document.getElementById('load-map').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const loadedData = JSON.parse(e.target.result);

                nodes.clear();
                edges.clear();

                nodes.add(loadedData.nodes);
                edges.add(loadedData.edges);

                const maxNodeId = Math.max(...loadedData.nodes.map((node) => node.id), 0);
                nextId = maxNodeId + 1;
            };
            reader.readAsText(file);
        });
        input.click();
    });

    // Download Map as PNG
    document.getElementById('download-map').addEventListener('click', () => {
        html2canvas(container).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'connection_map.png';
            link.click();
        });
    });

    // Layout Selector Logic
    const layoutSelector = document.getElementById("layout-selector");
    layoutSelector.addEventListener("change", (e) => {
        const layoutType = e.target.value;

        switch (layoutType) {

            case "circular":
                const positions = network.getPositions();
                const radius = 500;
                const nodeIds = nodes.getIds();
                nodeIds.forEach((nodeId, index) => {
                    const angle = (2 * Math.PI * index) / nodeIds.length;
                    positions[nodeId] = {
                        x: radius * Math.cos(angle),
                        y: radius * Math.sin(angle),
                    };
                });
                nodes.update(
                    nodeIds.map((id) => ({
                        id: id,
                        x: positions[id].x,
                        y: positions[id].y,
                    }))
                );
                break;

            case "grid":
                const gridSpacing = 200;
                const gridPositions = {};
                const ids = nodes.getIds();
                ids.forEach((id, index) => {
                    gridPositions[id] = {
                        x: (index % 5) * gridSpacing,
                        y: Math.floor(index / 5) * gridSpacing,
                    };
                });
                nodes.update(
                    ids.map((id) => ({
                        id: id,
                        x: gridPositions[id].x,
                        y: gridPositions[id].y,
                    }))
                );
                break;

            default:
                network.setOptions({
                    layout: {hierarchical: false},
                    physics: true,
                });
                break;
        }
    });
});
