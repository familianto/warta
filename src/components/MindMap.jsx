import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const COLOR_PALETTE = [
  "#378ADD", "#1D9E75", "#7F77DD", "#BA7517", "#D94F4F",
  "#2DB5A0", "#C75DAB", "#5B8C3E", "#D4822D", "#6A6ADB",
];
const DEFAULT_COLOR = "#888780";

function buildTagColorMap(nodes) {
  const tags = [];
  for (const node of nodes) {
    for (const tag of node.tags || []) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  const map = {};
  tags.forEach((tag, i) => {
    map[tag] = COLOR_PALETTE[i % COLOR_PALETTE.length];
  });
  return map;
}

function getNodeColor(tags, tagColors) {
  if (!tags || tags.length === 0) return DEFAULT_COLOR;
  return tagColors[tags[0]] || DEFAULT_COLOR;
}

export default function MindMap({ nodes, edges }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const tagColors = buildTagColorMap(nodes || []);

  // Track dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: Math.max(500, rect.height),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !nodes || nodes.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Count connections per node
    const connectionCount = {};
    nodes.forEach((n) => (connectionCount[n.id] = 0));
    edges.forEach((e) => {
      connectionCount[e.source] = (connectionCount[e.source] || 0) + 1;
      connectionCount[e.target] = (connectionCount[e.target] || 0) + 1;
    });

    // Prepare data (deep copy for D3 mutation)
    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges.map((e) => ({ ...e }));

    // Compute curve offsets for parallel edges between same node pair
    const pairCount = {};
    simEdges.forEach((e) => {
      const key = [e.source, e.target].sort().join(":::");
      pairCount[key] = (pairCount[key] || 0) + 1;
    });
    const pairIndex = {};
    simEdges.forEach((e) => {
      const key = [e.source, e.target].sort().join(":::");
      pairIndex[key] = (pairIndex[key] || 0) + 1;
      const total = pairCount[key];
      const idx = pairIndex[key];
      // Spread offsets symmetrically: -1, 0, 1 for 3 edges; -0.5, 0.5 for 2, etc.
      e._curveOffset = total === 1 ? 0 : ((idx - 1) / (total - 1) - 0.5) * 2;
    });

    // Force simulation
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink(simEdges)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Zoom
    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "var(--color-surface, #f9fafb)")
      .style("color", "var(--color-text, #1a1a2e)")
      .style("border", "1px solid var(--color-border, #e5e7eb)")
      .style("border-radius", "8px")
      .style("padding", "8px 12px")
      .style("font-size", "13px")
      .style("line-height", "1.5")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
      .style("opacity", 0)
      .style("z-index", 10);

    // Edges
    const edgeGroup = g
      .append("g")
      .selectAll("g")
      .data(simEdges)
      .join("g");

    const CURVE_STRENGTH = 50;

    const lines = edgeGroup
      .append("path")
      .attr("fill", "none")
      .attr("stroke", (d) => (d.type === "manual" ? "#888" : "#ccc"))
      .attr("stroke-width", (d) => (d.type === "manual" ? 2 : 1.5))
      .attr("stroke-dasharray", (d) => (d.type === "manual" ? "none" : "5,5"))
      .attr("class", "edge-line");

    const edgeLabels = edgeGroup
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "10px")
      .attr("fill", "var(--color-text-secondary, #6b7280)")
      .attr("class", "edge-label");

    // Helper: compute curved path control point
    function getCurvePoint(d) {
      const sx = d.source.x, sy = d.source.y;
      const tx = d.target.x, ty = d.target.y;
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      const dx = tx - sx, dy = ty - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Perpendicular offset
      const offset = d._curveOffset * CURVE_STRENGTH;
      const nx = -dy / len, ny = dx / len;
      return { cx: mx + nx * offset, cy: my + ny * offset };
    }

    // Nodes
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "pointer");

    // Drag behavior
    const drag = d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag);

    // Node circles
    const circles = nodeGroup
      .append("circle")
      .attr("r", (d) => {
        const count = connectionCount[d.id] || 0;
        return 10 + count * 4;
      })
      .attr("fill", (d) => getNodeColor(d.tags, tagColors))
      .attr("stroke", "var(--color-bg, #ffffff)")
      .attr("stroke-width", 2)
      .attr("class", "node-circle");

    // Node labels
    const labels = nodeGroup
      .append("text")
      .text((d) => d.title)
      .attr("dx", (d) => {
        const count = connectionCount[d.id] || 0;
        return 10 + count * 4 + 6;
      })
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("font-weight", 500)
      .attr("fill", "var(--color-text, #1a1a2e)")
      .attr("class", "node-label");

    // Hover interaction
    nodeGroup
      .on("mouseenter", (event, d) => {
        const connectedIds = new Set();
        connectedIds.add(d.id);
        simEdges.forEach((e) => {
          const src = typeof e.source === "object" ? e.source.id : e.source;
          const tgt = typeof e.target === "object" ? e.target.id : e.target;
          if (src === d.id) connectedIds.add(tgt);
          if (tgt === d.id) connectedIds.add(src);
        });

        nodeGroup.style("opacity", (n) =>
          connectedIds.has(n.id) ? 1 : 0.15
        );
        edgeGroup.style("opacity", (e) => {
          const src = typeof e.source === "object" ? e.source.id : e.source;
          const tgt = typeof e.target === "object" ? e.target.id : e.target;
          return src === d.id || tgt === d.id ? 1 : 0.08;
        });

        const count = connectionCount[d.id] || 0;
        tooltip
          .html(
            `<strong>${d.title}</strong><br/>` +
              `Tags: ${d.tags.join(", ")}<br/>` +
              `Koneksi: ${count} artikel`
          )
          .style("opacity", 1);
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current.getBoundingClientRect();
        tooltip
          .style("left", event.clientX - rect.left + 12 + "px")
          .style("top", event.clientY - rect.top - 10 + "px");
      })
      .on("mouseleave", () => {
        nodeGroup.style("opacity", 1);
        edgeGroup.style("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // Click to navigate
    nodeGroup.on("click", (event, d) => {
      if (event.defaultPrevented) return; // ignore drag
      window.location.href = d.url;
    });

    // Tick
    simulation.on("tick", () => {
      lines.attr("d", (d) => {
        const { cx, cy } = getCurvePoint(d);
        return `M${d.source.x},${d.source.y} Q${cx},${cy} ${d.target.x},${d.target.y}`;
      });

      edgeLabels
        .attr("x", (d) => getCurvePoint(d).cx)
        .attr("y", (d) => getCurvePoint(d).cy);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [nodes, edges, dimensions]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", minHeight: "500px", position: "relative" }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: "block", width: "100%", minHeight: "500px" }}
      />
    </div>
  );
}
