"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Truck,
  Train,
  Plane,
  Ship,
  Bike,
  Package,
  Boxes,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Radio,
  ShieldCheck,
  Phone,
  Mail,
  Navigation,
  RefreshCw,
  X,
  Eye,
  Sparkles,
  Layers,
  Compass,
  Zap,
} from "lucide-react";
import {
  Order,
  TransportMode,
  LogisticsHub,
} from "@/types";
import {
  STANDARD_HUBS,
  CENTRAL_STOCK_CENTER,
  getHubById,
  formatLogisticsJourneyLogs,
  getDirectionCorridorDecision,
  LogisticsJourneyStep,
} from "@/lib/logistics-service";
import { IndiaLogisticsGraphMap } from "@/components/admin/IndiaLogisticsGraphMap";
import {
  getUpNextRoutingOptions,
  UpNextRouteOption,
  resolveCityToNode,
  resolveHubIdToNode,
} from "@/lib/india-logistics-graph";

// ============================================================================
// 1. FINAL DESTINATION HOVER CARD (RICH POPUP ON HOVER & CLICK-TO-PIN)
// ============================================================================

interface FinalDestinationHoverCardProps {
  order: Order;
  children?: React.ReactNode;
  isCloseToHub?: boolean;
  className?: string;
}

export function FinalDestinationHoverCard({
  order,
  children,
  isCloseToHub = false,
  className = "",
}: FinalDestinationHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const customer = order.customer || {
    fullName: "Customer",
    email: "customer@ancwave.com",
    contact: "+91 81055 42318",
    address: "Destination Doorstep",
    city: "City",
    state: "State",
    zipCode: "000000",
    country: "India",
  };

  const corridor = getDirectionCorridorDecision(customer);
  const itemsSummary = order.items && order.items.length > 0
    ? order.items.map((it) => `${it.name} (x${it.quantity || 1})`).join(", ")
    : "ancwave High-Fidelity Audio Hardware (x1)";

  const isVisible = isHovered || isPinned;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element (defaults to clickable pill if no custom children) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsPinned(!isPinned);
        }}
        className="cursor-pointer select-none inline-flex items-center"
      >
        {children || (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border shadow-xs ${
              isPinned
                ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/30"
                : isHovered
                ? "bg-emerald-950/80 text-emerald-200 border-emerald-500/60 shadow-emerald-500/10"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60 hover:text-emerald-200"
            }`}
            title="Hover or click to view complete final destination address, recipient contact & delivery corridor"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">
              {customer.city}, {customer.state}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-normal underline decoration-dotted">
              {isPinned ? "[Pinned 📌]" : "[Hover 👁️]"}
            </span>
          </span>
        )}
      </div>

      {/* Floating Detailed Destination Card */}
      {isVisible && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/98 text-zinc-100 border border-zinc-700/80 shadow-2xl backdrop-blur-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase block">
                  FINAL DELIVERY DESTINATION
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{customer.city}, {customer.state}</span>
                  <span className="text-[10px] font-mono text-zinc-400 font-normal">({customer.country || "India"})</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1 rounded-lg text-[10px] font-mono px-1.5 transition ${
                  isPinned
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
                title={isPinned ? "Unpin card" : "Pin card open"}
              >
                {isPinned ? "Pinned" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPinned(false);
                  setIsHovered(false);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recipient Card */}
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
            <div className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
              RECIPIENT & CONTACT INTEL
            </div>
            <div className="font-bold text-zinc-100 flex items-center justify-between">
              <span>{customer.fullName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                CONSIGNMENT: {order.orderNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
              {customer.contact && (
                <a
                  href={`tel:${customer.contact}`}
                  className="flex items-center gap-1.5 text-emerald-400 hover:underline"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate">{customer.contact}</span>
                </a>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Complete Doorstep Address */}
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1 text-xs">
            <div className="text-[10px] font-mono text-zinc-500 uppercase font-semibold flex items-center justify-between">
              <span>DOORSTEP SHIPPING ADDRESS</span>
              <span className="text-zinc-400 font-mono">PIN: {customer.zipCode}</span>
            </div>
            <p className="text-zinc-200 font-medium leading-relaxed text-xs">
              {customer.address}
            </p>
            <div className="text-[11px] text-zinc-400 font-mono pt-0.5">
              {customer.city}, {customer.state} · {customer.zipCode}
            </div>
          </div>

          {/* Strategic Corridor & Delivery Instructions */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block uppercase">STRATEGIC CORRIDOR</span>
              <span className="text-purple-300 font-bold truncate block" title={corridor.directionLabel}>
                {corridor.directionLabel}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block uppercase">SCHEDULED WINDOW</span>
              <span className="text-amber-300 font-bold truncate block">
                {order.localDelivery?.deliverySlot || "Afternoon Window (14-18h)"}
              </span>
            </div>
          </div>

          {/* Proximity & Verification Footer */}
          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>5-Min OTP & Dual-Photo PoD Gate Handover</span>
            </span>
            <span className="text-zinc-500">
              {isCloseToHub ? "Local Radius ✓" : "Trunk Line-Haul"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. PACKAGE ROUTE WAYPOINT RIBBON (ORIGIN ➔ PREVIOUS HUBS ➔ CURRENT ➔ NEXT ➔ FINAL)
// ============================================================================

interface PackageRouteWaypointRibbonProps {
  order: Order;
  activeHubId?: string;
  onOpenAuditModal?: (order: Order) => void;
  isAddressClose?: boolean;
}

export function PackageRouteWaypointRibbon({
  order,
  activeHubId,
  onOpenAuditModal,
  isAddressClose = false,
}: PackageRouteWaypointRibbonProps) {
  const route = order.route && order.route.length > 0 ? order.route : [];
  const corridor = getDirectionCorridorDecision(order.customer);

  // Extract completed previous legs
  const completedLegs = route.filter((l) => l.status === "completed");
  
  // Find current leg
  const currentLeg = route.find(
    (l) => l.status === "received" || l.status === "sorting" || l.status === "loading" || l.status === "dispatched"
  ) || route[0];

  // Determine if package is at Central Packing Station (Origin)
  const isAtCentralPackingStation =
    activeHubId === "STOCK-CTR-01" ||
    activeHubId === "STK-CTR-01" ||
    order.currentHubId === "STOCK-CTR-01" ||
    order.hubQueueStatus === "packaging" ||
    (!order.deliveryStatus || order.deliveryStatus === "processing" || order.deliveryStatus === "order_created");

  const originName = "Central Packing Station (Nagpur Zero-Mile)";
  const originDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Origin";

  const nextDestinationName = isAddressClose
    ? "Customer Doorstep (Last-Mile)"
    : (order.nextHub || "Regional Gateway");

  return (
    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs font-mono shadow-inner">
      {/* Top Banner: Where it came from history & Where it goes next */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-zinc-500 uppercase font-bold text-[10px]">Route Path:</span>
          {/* Origin badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            <Boxes className="w-3 h-3 text-amber-400" />
            <span>Origin: STK-CTR-01 ({originDate})</span>
          </span>

          <span className="text-zinc-600">➔</span>

          {/* Previous traversed hubs (if any) */}
          {completedLegs.length > 0 ? (
            completedLegs.map((leg, i) => (
              <React.Fragment key={leg.hubId || i}>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-700"
                  title={`Traversed: ${leg.hubName} (${leg.region}) via ${leg.transportMode || "Fleet"}`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{leg.hubCode || leg.hubId} ✓</span>
                </span>
                <span className="text-zinc-600">➔</span>
              </React.Fragment>
            ))
          ) : (
            <span className="text-zinc-500 text-[10px]">[Direct Dispatch Corridor]</span>
          )}

          {/* Current Station Badge (Glowing active state) */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-bold border shadow-xs ${
              isAtCentralPackingStation
                ? "bg-amber-500/25 text-amber-200 border-amber-500/50 shadow-amber-500/20"
                : "bg-blue-500/25 text-blue-200 border-blue-500/50 shadow-blue-500/20"
            }`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              isAtCentralPackingStation ? "bg-amber-400" : "bg-blue-400"
            }`} />
            <span>
              HERE: {order.currentHub || (isAtCentralPackingStation ? "Nagpur Stock Depot" : "Active Dock")}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/50 text-white uppercase font-normal">
              {order.hubQueueStatus || "Active"}
            </span>
          </span>

          <span className="text-purple-400 font-bold">➔</span>

          {/* Next Hop Destination */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold">
            <ArrowRight className="w-3 h-3 text-purple-400" />
            <span>Next: {nextDestinationName}</span>
            {order.transitMode && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 uppercase font-normal">
                {order.transitMode}
              </span>
            )}
          </span>

          <span className="text-zinc-600">➔</span>

          {/* Final Destination with Hover Card */}
          <FinalDestinationHoverCard order={order} isCloseToHub={isAddressClose}>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold hover:bg-emerald-500/30 transition">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Final: {order.customer?.city || "Destination"}</span>
              <span className="text-[9px] text-emerald-300 underline font-normal">[Hover Details]</span>
            </span>
          </FinalDestinationHoverCard>
        </div>

        {/* Modal Trigger for Full Telematics */}
        {onOpenAuditModal && (
          <button
            type="button"
            onClick={() => onOpenAuditModal(order)}
            className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer ml-auto"
            title="Open comprehensive telemetry & supply chain waybill audit modal"
          >
            <span>Audit Waybill & Telematics</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Origin History & Where it Goes Next Text Line */}
      <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-3 text-[11px] text-zinc-400">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-500 font-bold text-[10px] uppercase">Where it came from:</span>
          <span className="text-amber-300 font-semibold">{originName}</span>
          <span className="text-zinc-600">·</span>
          <span>Corridor: <strong className="text-zinc-300">{corridor.directionLabel}</strong></span>
          {completedLegs.length > 0 && (
            <>
              <span className="text-zinc-600">·</span>
              <span>
                Previous Hubs: <strong className="text-emerald-400 font-semibold">{completedLegs.map(l => l.hubName).join(" ➔ ")}</strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 font-bold text-[10px] uppercase">Where it goes next:</span>
          <strong className="text-purple-300 font-bold">{nextDestinationName}</strong>
          {order.vehicleNo && (
            <span className="text-[10px] text-zinc-400 font-mono">[{order.vehicleNo}]</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. EXPANDABLE TRANSPORT ROUTE LOGS DRAWER (INLINE STEP-BY-STEP CHECKPOINTS)
// ============================================================================

interface PackageTransportLogsDrawerProps {
  order: Order;
  onOpenAuditModal?: (order: Order) => void;
  isInitiallyOpen?: boolean;
}

export function PackageTransportLogsDrawer({
  order,
  onOpenAuditModal,
  isInitiallyOpen = false,
}: PackageTransportLogsDrawerProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const journeySteps: LogisticsJourneyStep[] = formatLogisticsJourneyLogs(order);

  const completedStepsCount = journeySteps.filter((s) => s.status === "completed").length;

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/60 overflow-hidden text-xs font-mono">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-900/60 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-bold text-zinc-200">
            Transport Logs & Route History
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
            {completedStepsCount} of {journeySteps.length} Milestones Complete
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline">
            {isOpen ? "Collapse History ▲" : "Expand Logs & Telematics ▼"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded Logs Body */}
      {isOpen && (
        <div className="p-3 border-t border-zinc-800 space-y-3 bg-zinc-950/90 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">
              Complete Consignment Telematics & Waybill Journey Log:
            </span>
            {onOpenAuditModal && (
              <button
                type="button"
                onClick={() => onOpenAuditModal(order)}
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold underline cursor-pointer"
              >
                <span>Full Telematics Audit View ↗</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {journeySteps.map((step, idx) => {
              const isCompleted = step.status === "completed";
              const isInProgress = step.status === "in_progress";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition ${
                    isCompleted
                      ? "bg-zinc-900/70 border-emerald-500/20 text-zinc-300"
                      : isInProgress
                      ? "bg-purple-950/30 border-purple-500/40 text-purple-100 shadow-sm"
                      : isFailed
                      ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                      : "bg-zinc-900/30 border-zinc-800/80 text-zinc-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isCompleted
                          ? "bg-emerald-400"
                          : isInProgress
                          ? "bg-purple-400 animate-pulse"
                          : isFailed
                          ? "bg-rose-400"
                          : "bg-zinc-600"
                      }`} />
                      <span className="font-bold text-xs truncate text-zinc-100">
                        {step.title}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 border ${
                        isCompleted
                          ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                          : isInProgress
                          ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
                          : isFailed
                          ? "bg-rose-950/70 text-rose-300 border-rose-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {step.badge || (isCompleted ? "Completed" : isInProgress ? "In Progress" : "Pending")}
                    </span>
                  </div>

                  {step.details && (
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed pl-4">
                      {step.details}
                    </p>
                  )}

                  {(step.inTime || step.outTime) && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500 mt-1.5 pl-4">
                      {step.inTime && <span>In: <strong className="text-zinc-300">{step.inTime}</strong></span>}
                      {step.inTime && step.outTime && <span>•</span>}
                      {step.outTime && <span>Out: <strong className="text-zinc-300">{step.outTime}</strong></span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. SORTING & REROUTING CONTROLLER BAR (PER-PACKAGE ROUTE ASSIGNMENT & REROUTE)
// ============================================================================

interface SortingRerouteBarProps {
  order: Order;
  activeHubId: string;
  allHubs: LogisticsHub[];
  targetHubId: string;
  onTargetHubChange: (orderNumber: string, nextHubId: string) => void;
  transitMode: TransportMode;
  onTransitModeChange: (orderNumber: string, mode: TransportMode) => void;
  vehicleNo: string;
  onVehicleNoChange: (orderNumber: string, plate: string) => void;
  isAddressClose: boolean;
  onToggleAddressClose: (orderNumber: string) => void;
  onConfirmSorting: (orderNumber: string) => void;
  onRerouteOnly?: (orderNumber: string, nextHubId: string, mode: TransportMode, plate: string) => void;
  isLoading?: boolean;
}

export function SortingRerouteBar({
  order,
  activeHubId,
  allHubs,
  targetHubId,
  onTargetHubChange,
  transitMode,
  onTransitModeChange,
  vehicleNo,
  onVehicleNoChange,
  isAddressClose,
  onToggleAddressClose,
  onConfirmSorting,
  onRerouteOnly,
  isLoading = false,
}: SortingRerouteBarProps) {
  const currentHub = getHubById(activeHubId, allHubs) || STANDARD_HUBS[0];
  const assignedNextHub = getHubById(targetHubId, allHubs);

  const [showGraphMap, setShowGraphMap] = useState<boolean>(false);
  const upNextOptions = React.useMemo(
    () => getUpNextRoutingOptions(activeHubId, order.customer),
    [activeHubId, order.customer]
  );

  // Filter available hubs (excluding active hub itself)
  const availableTargetHubs = allHubs.filter((h) => h.id.toLowerCase() !== activeHubId.toLowerCase());

  return (
    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-3 font-mono text-xs shadow-inner">
      {/* Top Bar: Routing & Rerouting Mission */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-zinc-200">
            Sorting Dock Assignment & Route Dispatcher
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
            Active Consignment: {order.orderNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* India Graph Node Network Map Toggle */}
          <button
            type="button"
            onClick={() => setShowGraphMap(!showGraphMap)}
            className={`text-[10px] px-2.5 py-1 rounded-xl font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              showGraphMap
                ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30"
                : "bg-purple-950/40 text-purple-300 border-purple-500/40 hover:border-purple-400"
            }`}
            title="Open interactive 29-city India logistics node graph map"
          >
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>{showGraphMap ? "Hide India Map" : "🗺️ View India Graph Map (29 Nodes)"}</span>
          </button>

          {/* Address Close to Hub Toggle */}
          <button
            type="button"
            onClick={() => onToggleAddressClose(order.orderNumber)}
            className={`text-[10px] px-2.5 py-1 rounded-xl font-bold border transition cursor-pointer ${
              isAddressClose
                ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200"
            }`}
            title="Toggle whether destination address is close enough for direct last-mile delivery rider"
          >
            address close to hub [{isAddressClose ? "true ➔ Doorstep" : "false ➔ Transit Hub"}]
          </button>
        </div>
      </div>

      {/* Interactive 29-City India Logistics Graph & Path Formation */}
      {showGraphMap && (
        <div className="pt-1 pb-2 animate-in fade-in duration-200">
          <IndiaLogisticsGraphMap
            order={order}
            activeHubId={activeHubId}
            selectedNextHubId={targetHubId}
            onSelectNextHub={(hubId) => {
              onTargetHubChange(order.orderNumber, hubId);
            }}
            onApplyRouteOption={(opt) => {
              onTargetHubChange(order.orderNumber, opt.targetHubId);
              onTransitModeChange(order.orderNumber, opt.transitMode);
              onVehicleNoChange(order.orderNumber, opt.vehiclePlateOrId);
              if (opt.id.includes("lastmile")) {
                if (!isAddressClose) onToggleAddressClose(order.orderNumber);
              } else {
                if (isAddressClose) onToggleAddressClose(order.orderNumber);
              }
            }}
          />
        </div>
      )}

      {/* Automated "Up Next" Route Guidance Cards (Zero Confusion Quick-Picks) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">
              Smart "Up Next" Pre-Routes (Multi-Modal Graph Engine)
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-sans">
            Click any card to auto-fill routing & transport fleet
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {upNextOptions.slice(0, 3).map((opt) => {
            const isSelected = targetHubId === opt.targetHubId && transitMode === opt.transitMode;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  onTargetHubChange(order.orderNumber, opt.targetHubId);
                  onTransitModeChange(order.orderNumber, opt.transitMode);
                  onVehicleNoChange(order.orderNumber, opt.vehiclePlateOrId);
                  if (opt.id.includes("lastmile")) {
                    if (!isAddressClose) onToggleAddressClose(order.orderNumber);
                  } else {
                    if (isAddressClose) onToggleAddressClose(order.orderNumber);
                  }
                }}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? "bg-purple-900/40 border-purple-400 ring-1 ring-purple-400 shadow-md shadow-purple-950/40"
                    : opt.recommended
                    ? "bg-purple-950/20 border-purple-500/40 hover:border-purple-400"
                    : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {opt.transitMode === "plane" ? (
                      <Plane className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : opt.transitMode === "train" ? (
                      <Train className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-zinc-100 text-[11px] truncate">
                      {opt.targetCity}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 border ${
                      opt.recommended
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400 truncate">
                  {opt.corridorName}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 border-t border-zinc-800/80 pt-1">
                  <span className="text-zinc-500">{opt.durationText}</span>
                  <span className="text-purple-300 font-bold">{opt.vehiclePlateOrId}</span>
                  <span className={`font-bold ${isSelected ? "text-emerald-300" : "text-emerald-400"}`}>
                    {isSelected ? "Active ✓" : "1-Click Apply ➔"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reroute & Target Assignment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Next Destination Hub Selector (or Doorstep Gate if close) */}
        <div className="sm:col-span-5 space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
            {isAddressClose ? "Destination Endpoint:" : "Route / Reroute Next Destination Hub:"}
          </label>
          {isAddressClose ? (
            <div className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center justify-between">
              <span>Customer Doorstep Handover</span>
              <span className="text-[10px] font-normal text-emerald-400 font-mono">
                Last-Mile Fleet
              </span>
            </div>
          ) : (
            <select
              value={targetHubId}
              onChange={(e) => onTargetHubChange(order.orderNumber, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-purple-500/40 text-white font-bold text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="" disabled>Select Target Destination Hub...</option>
              {availableTargetHubs.map((h) => (
                <option key={h.id} value={h.id} className="bg-zinc-950 text-zinc-200">
                  {h.code} · {h.name} ({h.region})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fleet Transport Mode */}
        <div className="sm:col-span-4 space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
            Transport Fleet Mode:
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: "van", label: "Van", icon: Truck },
              { id: "truck", label: "Truck", icon: Truck },
              { id: "train", label: "Train", icon: Train },
              { id: "plane", label: "Air", icon: Plane },
              { id: "bike", label: "Bike", icon: Bike },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = transitMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onTransitModeChange(order.orderNumber, m.id as TransportMode)}
                  className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-[9px] font-bold transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-400 shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-3 h-3 mb-0.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Plate / Identifier */}
        <div className="sm:col-span-3 space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
            Fleet Plate / Rake ID:
          </label>
          <input
            type="text"
            value={vehicleNo}
            onChange={(e) => onVehicleNoChange(order.orderNumber, e.target.value.toUpperCase())}
            placeholder={transitMode === "train" ? "IR-12302" : transitMode === "plane" ? "FLT-6E-204" : "DL-01-TRK-9000"}
            className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded-xl text-white uppercase focus:outline-none focus:border-purple-400 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Action Buttons: Confirm & Move to Loading vs Reroute Only */}
      <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-400">
          Target Destination: <strong className="text-purple-300 font-bold">{isAddressClose ? "Doorstep Gate" : (assignedNextHub?.name || targetHubId)}</strong> via <strong className="text-zinc-200 uppercase">{transitMode}</strong>
        </div>

        <div className="flex items-center gap-2">
          {onRerouteOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onRerouteOnly(order.orderNumber, targetHubId, transitMode, vehicleNo)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Update package routing destination immediately without moving it to the loading bay yet"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Save Reroute Only</span>
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirmSorting(order.orderNumber)}
            className={`px-4 py-2 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50 ${
              isAddressClose
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                : "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>
              {isAddressClose
                ? "Stage for Last-Mile Loading ➔"
                : "Confirm Route ➔ Move to Loading Bay"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { IndiaLogisticsGraphMap };

