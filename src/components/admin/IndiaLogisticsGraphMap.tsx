"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Truck,
  Train,
  Plane,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  X,
  Boxes,
  Zap,
} from "lucide-react";
import {
  INDIA_29_CITIES,
  INDIA_LOGISTICS_EDGES,
  IndiaCityNode,
  IndiaZone,
  resolveCityToNode,
  resolveHubIdToNode,
  getUpNextRoutingOptions,
  UpNextRouteOption,
} from "@/lib/india-logistics-graph";
import { Order, TransportMode } from "@/types";

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface IndiaLogisticsGraphMapProps {
  order?: Order;
  activeHubId: string;
  selectedNextHubId?: string;
  onSelectNextHub?: (hubId: string, nodeCode: string, cityName: string) => void;
  onApplyRouteOption?: (option: UpNextRouteOption) => void;
  isCompact?: boolean;
  className?: string;
}

export function IndiaLogisticsGraphMap({
  order,
  activeHubId,
  selectedNextHubId,
  onSelectNextHub,
  onApplyRouteOption,
  isCompact = false,
  className = "",
}: IndiaLogisticsGraphMapProps) {
  // Filter state for graph corridors
  const [filterMode, setFilterMode] = useState<"all" | "train" | "truck" | "plane">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredNode, setHoveredNode] = useState<IndiaCityNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"map" | "upnext">("map");

  // Determine current active node
  const currentNode = useMemo(() => resolveHubIdToNode(activeHubId), [activeHubId]);

  // Determine customer destination node
  const destNode = useMemo(
    () => resolveCityToNode(order?.customer?.city, order?.customer?.state),
    [order?.customer?.city, order?.customer?.state]
  );

  // Determine selected next hop node
  const nextHopNode = useMemo(() => {
    if (selectedNextHubId) {
      return resolveHubIdToNode(selectedNextHubId);
    }
    return destNode;
  }, [selectedNextHubId, destNode]);

  // Pre-calculated Up Next Route Options
  const upNextOptions = useMemo(
    () => getUpNextRoutingOptions(activeHubId, order?.customer),
    [activeHubId, order?.customer]
  );

  // Set of traversed nodes if order has completed legs
  const traversedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (order?.route) {
      for (const leg of order.route) {
        if (leg.status === "completed") {
          const n = resolveHubIdToNode(leg.hubId);
          set.add(n.id);
        }
      }
    }
    return set;
  }, [order?.route]);

  // Active path sequence of node IDs: Current -> Next -> Destination
  const activePathNodeIds = useMemo(() => {
    const list: string[] = [currentNode.id];
    if (nextHopNode.id !== currentNode.id) {
      list.push(nextHopNode.id);
    }
    if (destNode.id !== currentNode.id && destNode.id !== nextHopNode.id) {
      list.push(destNode.id);
    }
    return list;
  }, [currentNode.id, nextHopNode.id, destNode.id]);

  // Filtered edges based on selected corridor filter
  const filteredEdges = useMemo(() => {
    if (filterMode === "all") return INDIA_LOGISTICS_EDGES;
    return INDIA_LOGISTICS_EDGES.filter((e) => e.modes.includes(filterMode));
  }, [filterMode]);

  // Search filtered node IDs
  const matchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    return new Set(
      INDIA_29_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.zone.toLowerCase().includes(q)
      ).map((c) => c.id)
    );
  }, [searchQuery]);

  // Zone Color Palettes
  const getZoneBorderColor = (zone: IndiaZone) => {
    switch (zone) {
      case "North":
        return "#3b82f6"; // blue
      case "Central":
        return "#f59e0b"; // amber
      case "West":
        return "#a855f7"; // purple
      case "East":
        return "#f97316"; // orange
      case "South":
        return "#10b981"; // emerald
      case "Northeast":
        return "#ec4899"; // pink
      default:
        return "#71717a";
    }
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-950 text-white font-mono overflow-hidden transition-all shadow-2xl flex flex-col ${
        isFullscreen ? "fixed inset-4 z-50 max-w-none" : "w-full"
      } ${className}`}
    >
      {/* Top Controls Toolbar */}
      <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="font-bold text-zinc-100 flex items-center gap-2">
              <span>India Logistics Network Graph (29 Nodes)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                48 Multi-Modal Corridors
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-sans">
              Interactive node topology: Click any city node to assign as the next transit hub.
            </div>
          </div>
        </div>

        {/* Tab Selector: Graph Map vs Up Next Recommendations */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "map"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upnext")}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "upnext"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Up Next Options ({upNextOptions.length})</span>
          </button>
        </div>

        {/* Filter buttons & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edge Mode Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                filterMode === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All Modes
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("train")}
              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                filterMode === "train" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-zinc-500 hover:text-amber-400"
              }`}
            >
              <Train className="w-3 h-3" />
              <span>Rail (DFC)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("plane")}
              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                filterMode === "plane" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30" : "text-zinc-500 hover:text-cyan-400"
              }`}
            >
              <Plane className="w-3 h-3" />
              <span>Air Cargo</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("truck")}
              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                filterMode === "truck" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-zinc-500 hover:text-emerald-400"
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>Road Trunk</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search 29 cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 w-36 sm:w-44"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === "map" ? (
        <div className="relative flex-1 bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
          {/* Left Canvas: Interactive SVG India Network Graph */}
          <div className="flex-1 relative flex items-center justify-center p-2 min-h-[520px] md:min-h-[620px] overflow-hidden select-none bg-radial from-zinc-900/50 to-zinc-950">
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px]" />

            <svg
              viewBox="100 20 820 980"
              className="w-full h-full max-h-[720px] filter drop-shadow-md"
              style={{ maxHeight: isFullscreen ? "85vh" : "620px" }}
            >
              <defs>
                {/* Glow Filter for Active Path */}
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Linear Gradients for multi-modal links */}
                <linearGradient id="active-path-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* 1. Inactive Transport Network Edges */}
              <g className="edges-layer opacity-40">
                {filteredEdges.map((edge, idx) => {
                  const fromNode = INDIA_29_CITIES.find((c) => c.id === edge.from);
                  const toNode = INDIA_29_CITIES.find((c) => c.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const isEdgeOnActivePath =
                    (activePathNodeIds.includes(edge.from) && activePathNodeIds.includes(edge.to));

                  // Skip if active (drawn separately with higher z-index)
                  if (isEdgeOnActivePath) return null;

                  const strokeColor = edge.modes.includes("plane")
                    ? "#06b6d4" // cyan
                    : edge.modes.includes("train")
                    ? "#eab308" // yellow/amber
                    : "#10b981"; // emerald

                  const isCurved = edge.modes.includes("plane");
                  const midX = (fromNode.x + toNode.x) / 2 - (isCurved ? 30 : 0);
                  const midY = (fromNode.y + toNode.y) / 2 - (isCurved ? 35 : 0);

                  const pathD = isCurved
                    ? `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`
                    : `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;

                  return (
                    <path
                      key={`edge-${idx}`}
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={edge.modes.includes("plane") ? "1.2" : "1.8"}
                      strokeDasharray={
                        edge.modes.includes("plane")
                          ? "4 4"
                          : edge.modes.includes("train")
                          ? "6 3"
                          : "none"
                      }
                      className="transition-all hover:stroke-white hover:opacity-100 hover:stroke-[3]"
                    >
                      <title>{`${fromNode.name} ➔ ${toNode.name} (${edge.corridorName})`}</title>
                    </path>
                  );
                })}
              </g>

              {/* 2. Active Consignment Path Formation (Glow Highlighted) */}
              <g className="active-path-layer">
                {activePathNodeIds.map((nodeId, idx) => {
                  if (idx === activePathNodeIds.length - 1) return null;
                  const nextId = activePathNodeIds[idx + 1];
                  const fromNode = INDIA_29_CITIES.find((c) => c.id === nodeId);
                  const toNode = INDIA_29_CITIES.find((c) => c.id === nextId);
                  if (!fromNode || !toNode) return null;

                  const midX = (fromNode.x + toNode.x) / 2 - 25;
                  const midY = (fromNode.y + toNode.y) / 2 - 25;

                  return (
                    <g key={`active-leg-${idx}`}>
                      {/* Outer Glow Line */}
                      <path
                        d={`M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="7"
                        opacity="0.4"
                        filter="url(#glow-purple)"
                      />
                      {/* Animated Foreground Dash */}
                      <path
                        d={`M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`}
                        fill="none"
                        stroke="url(#active-path-grad)"
                        strokeWidth="3.5"
                        strokeDasharray="8 6"
                        className="animate-pulse"
                      />
                    </g>
                  );
                })}
              </g>

              {/* 3. The 29 City Nodes */}
              <g className="nodes-layer">
                {INDIA_29_CITIES.map((node) => {
                  const isCurrent = node.id === currentNode.id;
                  const isDest = node.id === destNode.id;
                  const isNextHop = node.id === nextHopNode.id && !isCurrent;
                  const isTraversed = traversedNodeIds.has(node.id);
                  const isHovered = hoveredNode?.id === node.id;
                  const isMatched = matchedNodeIds.size === 0 || matchedNodeIds.has(node.id);

                  const zoneColor = getZoneBorderColor(node.zone);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className={`cursor-pointer transition-transform duration-150 ${
                        isHovered ? "scale-125" : ""
                      } ${!isMatched ? "opacity-30" : "opacity-100"}`}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => {
                        if (onSelectNextHub) {
                          onSelectNextHub(node.hubId, node.code, node.name);
                        }
                      }}
                    >
                      {/* Pulse Ripple for Active / Next / Destination Hubs */}
                      {isCurrent && (
                        <circle
                          r="20"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          className="animate-ping opacity-60"
                        />
                      )}
                      {isNextHop && (
                        <circle
                          r="18"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          className="animate-ping opacity-60"
                        />
                      )}
                      {isDest && (
                        <circle
                          r="18"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Outer Ring */}
                      <circle
                        r={node.isMajorGateway ? "14" : "11"}
                        fill={
                          isCurrent
                            ? "#78350f" // dark amber
                            : isNextHop
                            ? "#581c87" // dark purple
                            : isDest
                            ? "#064e3b" // dark emerald
                            : "#18181b" // zinc 900
                        }
                        stroke={
                          isCurrent
                            ? "#f59e0b"
                            : isNextHop
                            ? "#c084fc"
                            : isDest
                            ? "#34d399"
                            : isTraversed
                            ? "#10b981"
                            : zoneColor
                        }
                        strokeWidth={isCurrent || isNextHop || isDest ? "2.5" : "1.8"}
                        filter={
                          isCurrent
                            ? "url(#glow-amber)"
                            : isNextHop
                            ? "url(#glow-purple)"
                            : isDest
                            ? "url(#glow-cyan)"
                            : undefined
                        }
                      />

                      {/* Center Node Icon / Badge */}
                      {isTraversed ? (
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fontSize="9"
                          fill="#34d399"
                          fontWeight="bold"
                        >
                          ✓
                        </text>
                      ) : isCurrent ? (
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fontSize="8"
                          fill="#fef3c7"
                          fontWeight="bold"
                        >
                          📍
                        </text>
                      ) : isDest ? (
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fontSize="8"
                          fill="#6ee7b7"
                          fontWeight="bold"
                        >
                          🏁
                        </text>
                      ) : (
                        <text
                          textAnchor="middle"
                          dy="3"
                          fontSize="7.5"
                          fill={isMatched ? "#f4f4f5" : "#71717a"}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.code}
                        </text>
                      )}

                      {/* City Name Label below node */}
                      <text
                        textAnchor="middle"
                        y={node.isMajorGateway ? "23" : "20"}
                        fontSize="9"
                        fontWeight={isCurrent || isNextHop || isDest ? "bold" : "normal"}
                        fill={
                          isCurrent
                            ? "#fcd34d"
                            : isNextHop
                            ? "#e9d5ff"
                            : isDest
                            ? "#6ee7b7"
                            : isHovered
                            ? "#ffffff"
                            : "#a1a1aa"
                        }
                        className="pointer-events-none drop-shadow"
                      >
                        {node.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating Node Details Card on Hover */}
            {hoveredNode && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 p-3.5 rounded-2xl bg-zinc-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-md space-y-2 pointer-events-auto text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getZoneBorderColor(hoveredNode.zone) }}
                    />
                    <span className="font-bold text-white text-sm">
                      {hoveredNode.name} [{hoveredNode.code}]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {hoveredNode.zone} Zone
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 space-y-1">
                  <div>
                    State: <strong className="text-zinc-200">{hoveredNode.state}</strong> · Tier: <span className="text-purple-300 font-semibold">{hoveredNode.populationTier}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Arterial: {hoveredNode.arterialCorridor}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {hoveredNode.hasAirport && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] flex items-center gap-1">
                        <Plane className="w-2.5 h-2.5" /> Airport
                      </span>
                    )}
                    {hoveredNode.hasRailJunction && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1">
                        <Train className="w-2.5 h-2.5" /> Rail DFC
                      </span>
                    )}
                    {hoveredNode.hasNationalHighway && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1">
                        <Truck className="w-2.5 h-2.5" /> Highway
                      </span>
                    )}
                  </div>
                </div>

                {onSelectNextHub && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectNextHub(hoveredNode.hubId, hoveredNode.code, hoveredNode.name);
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Set {hoveredNode.name} as Next Hub</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Active Consignment Waypoint Breadcrumbs & Legend */}
          <div className="w-full md:w-80 bg-zinc-900/60 border-t md:border-t-0 md:border-l border-zinc-800 p-4 space-y-4 flex flex-col justify-between text-xs">
            <div className="space-y-4">
              {/* Active Consignment Context */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-400 uppercase">Waybill Mission</span>
                  <span className="font-mono text-purple-400 font-bold">
                    #{order?.orderNumber || "ACTIVE CONSIGNMENT"}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-300 space-y-1">
                  <div>
                    Current Node:{" "}
                    <strong className="text-amber-400">
                      {currentNode.name} [{currentNode.code}]
                    </strong>
                  </div>
                  <div>
                    Assigned Next:{" "}
                    <strong className="text-purple-300">
                      {nextHopNode.name} [{nextHopNode.code}]
                    </strong>
                  </div>
                  <div>
                    Final Destination:{" "}
                    <strong className="text-emerald-400">
                      {destNode.name} ({order?.customer?.city || "Customer City"})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Mode Corridors Legend */}
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-[11px]">
                <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                  Corridor Visual Legend
                </span>
                <div className="space-y-1.5 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-amber-400 border-t border-dashed border-amber-300" />
                    <span>Dedicated Freight Rail (Indian Railways DFC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-cyan-400 border-t border-dotted border-cyan-300" />
                    <span>Air Cargo Priority Express Flights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-emerald-400" />
                    <span>National Highway Expressways (FASTag)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-emerald-400 animate-pulse" />
                    <span className="font-bold text-purple-300">Active Package Formed Path</span>
                  </div>
                </div>
              </div>

              {/* Node State Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-zinc-950 border border-amber-500/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="text-amber-200">Current Station</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-purple-500/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="text-purple-200">Next Assigned</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-emerald-200">Final Destination</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-blue-500/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-blue-200">Regional Gateway</span>
                </div>
              </div>
            </div>

            {/* Switch to Up Next Tab trigger */}
            <button
              type="button"
              onClick={() => setActiveTab("upnext")}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>View Smart "Up Next" Pre-Routes</span>
            </button>
          </div>
        </div>
      ) : (
        /* Tab 2: Simplified "Up Next" Route Options Cards */
        <div className="p-4 sm:p-6 space-y-4 max-h-[650px] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Automated "Up Next" Route Options (No Guesswork)</span>
              </h4>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Multi-modal path calculated from <strong>{currentNode.name}</strong> ➔{" "}
                <strong>{destNode.name} ({order?.customer?.city || "Customer City"})</strong>. Select any option to configure route immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Back to Map View</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upNextOptions.map((opt) => {
              const isModeTrain = opt.transitMode === "train";
              const isModePlane = opt.transitMode === "plane";
              const isModeTruck = opt.transitMode === "truck";

              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    opt.recommended
                      ? "bg-purple-950/20 border-purple-500/50 hover:border-purple-500/80 shadow-lg shadow-purple-950/30"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Title & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isModePlane
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                              : isModeTrain
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isModePlane ? (
                            <Plane className="w-4 h-4" />
                          ) : isModeTrain ? (
                            <Train className="w-4 h-4" />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-100 text-xs">{opt.title}</div>
                          <div className="text-[10px] text-zinc-400 font-sans">
                            {opt.corridorName}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 border ${
                          opt.recommended
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    {/* Path Formation Breadcrumbs */}
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto">
                      <span className="text-zinc-500 text-[10px] font-bold">PATH:</span>
                      {opt.fullPathNodes.map((nCode, nIdx) => (
                        <React.Fragment key={nCode}>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              nIdx === 0
                                ? "bg-amber-500/20 text-amber-300 font-bold"
                                : nIdx === 1
                                ? "bg-purple-500/20 text-purple-300 font-bold"
                                : nIdx === opt.fullPathNodes.length - 1
                                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {nCode}
                          </span>
                          {nIdx < opt.fullPathNodes.length - 1 && (
                            <span className="text-zinc-600 text-[10px]">➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-zinc-500 block">EST. TRANSIT</span>
                        <strong className="text-zinc-200">{opt.durationText}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-zinc-500 block">DISTANCE</span>
                        <strong className="text-zinc-200">{opt.distanceKm} km</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-zinc-500 block">FLEET / ID</span>
                        <strong className="text-purple-300">{opt.vehiclePlateOrId}</strong>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  {/* 1-Click Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyRouteOption) {
                        onApplyRouteOption(opt);
                      } else if (onSelectNextHub) {
                        onSelectNextHub(opt.targetHubId, opt.targetNodeCode, opt.targetCity);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md ${
                      opt.recommended
                        ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Select & Apply Route ({opt.targetCity})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

