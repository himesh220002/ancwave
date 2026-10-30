"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  STANDARD_HUBS,
  CENTRAL_STOCK_CENTER,
  getHubById,
  getHubOperationsQueue,
  COURIER_PROVIDERS_CATALOG,
  formatLogisticsJourneyLogs,
  generateRtoReverseRoute,
  LogisticsJourneyStep,
} from "@/lib/logistics-service";
import {
  Cpu,
  RefreshCw,
  Flame,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Undo2,
  Package,
  ShoppingBag,
  Zap,
  Save,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Radio,
  Tag,
  Plus,
  Trash2,
  Sliders,
  Layers,
  Star,
  Check,
  ExternalLink,
  Camera,
  Boxes,
  Key,
  Users,
  Crown,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  User as UserIcon,
  Upload,
  PackagePlus,
  Truck,
  FolderPlus,
  FolderKanban,
  Filter,
  Phone,
  Mail,
  QrCode,
  X,
  ChevronRight,
  ChevronDown,
  Grid,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  MapPin,
  Command,
  Bike,
  Bike as Bicycle,
  Van,
  Train,
  Ship,
  Plane,
  ArrowDownLeft,
  ArrowUpRight,
  Navigation,
  FileText,
  CheckCheck,
  AlertCircle,
  Compass,
  Calendar,
  GripVertical,
} from "lucide-react";
import {
  ProductData,
  Order,
  TransportMode,
  IVariant,
  IVariantGroup,
  IVariantColor,
  childVariantsToVariantGroups,
  variantGroupsToChildVariants,
  Review,
  IReview,
  ECOMMERCE_CATEGORIES,
  RailFreightDetails,
  AirCargoDetails,
  OceanFreightDetails,
  LocalDeliveryDetails,
  CourierServiceDetails,
  DispatchCategory,
  LogisticsHub,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

const DEFAULT_REVALIDATE_SECRET = "ancwave_revalidation_secret_token_2026";

export interface INewProdColor {
  id: string;
  color: string;
  hex: string;
  sku: string;
  stock: number;
  price: number;
  images: string[];
}

export interface INewProdArchitecture {
  id: string;
  name: string;
  price: number;
  variantSpecs: Array<{ key: string; value: string }>;
  colors: INewProdColor[];
}

export default function AdminPage() {
  const {
    user,
    isAdmin,
    isOwner,
    isLoading,
    isDayTokenVerified,
    verifyDayPasscode,
    lockDashboard,
    setIsAuthModalOpen,
    logout,
    refreshUser,
    login,
    signup,
  } = useAuth();
  type AdminTab =
    | "dashboard"
    | "inventory"
    | "orders"
    | "variation-engine"
    | "shipping"
    | "delivery"
    | "reviews"
    | "team";

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [globalSearchInput, setGlobalSearchInput] = useState<string>("");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("form-01");
  const [product, setProduct] = useState<ProductData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [reviews, setReviews] = useState<(Review & IReview)[]>([]);

  // Order Console & Refund Trigger States
  const [isProcessingRefund, setIsProcessingRefund] = useState<string | null>(null);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState<string | null>(null);
  const [orderDeliveryEdits, setOrderDeliveryEdits] = useState<{
    [orderNumber: string]: {
      deliveryStatus?: string;
      currentHub?: string;
      trackingNumber?: string;
      transitMode?: TransportMode;
      vehicleNo?: string;
      note?: string;
      isSaving?: boolean;
      savingStatus?: string;
    };
  }>({});
  const [orderNewEvent, setOrderNewEvent] = useState<{
    [orderNumber: string]: {
      title?: string;
      description?: string;
      isAdding?: boolean;
    };
  }>({});

  // Multi-Hub Destination Routing & Queue Operations State
  const [activeHubId, setActiveHubId] = useState<string>("HUB-DEL-01");
  const [hubTab, setHubTab] = useState<"incoming" | "received" | "sorting" | "loading" | "outgoing" | "gate" | "rto">("incoming");
  const [waybillScanInput, setWaybillScanInput] = useState<string>("");
  const [filterDestinationHub, setFilterDestinationHub] = useState<string>("all");
  const [activeContainerId, setActiveContainerId] = useState<string>("DEL-CCU-101");
  const [targetDestinationHubId, setTargetDestinationHubId] = useState<string>("HUB-CCU-01");
  const [hubActionLoading, setHubActionLoading] = useState<string | null>(null);

  // Sorting Dock: Address Close to Hub Logic (Default: FALSE)
  const [isAddressCloseToHub, setIsAddressCloseToHub] = useState<boolean>(false);
  const [perOrderAddressClose, setPerOrderAddressClose] = useState<Record<string, boolean>>({});

  // Gate Handover: Condition 1 (Acceptance) vs Condition 2 (Refusal/Exception RTO)
  const [selectedGateCondition, setSelectedGateCondition] = useState<"condition_1_acceptance" | "condition_2_refusal">("condition_1_acceptance");
  const [gateExceptionReason, setGateExceptionReason] = useState<"damaged_package" | "customer_out_of_station" | "customer_refused">("damaged_package");
  const [gateExceptionNote, setGateExceptionNote] = useState<string>("");
  const [isSubmittingGateException, setIsSubmittingGateException] = useState<boolean>(false);
  const [rtoActionLoading, setRtoActionLoading] = useState<string | null>(null);

  // Delivery Hub & Doorstep Gate Verification State
  const [deliverySelectedOrderId, setDeliverySelectedOrderId] = useState<string>("ANC-763954");
  const [transitMode, setTransitMode] = useState<TransportMode>("truck");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [hubName, setHubName] = useState<string>("Delhi National Fulfillment Hub");
  const [hubRegion, setHubRegion] = useState<string>("Delhi NCR, IN");
  const [nextHubName, setNextHubName] = useState<string>("Kolkata Eastern Logistics Hub");
  const [nextHubRegion, setNextHubRegion] = useState<string>("West Bengal, IN");
  const [manifestVerified, setManifestVerified] = useState<boolean>(true);
  const [isTransitLogging, setIsTransitLogging] = useState<boolean>(false);
  const [otpTriggered, setOtpTriggered] = useState<boolean>(false);

  // Train (Indian Railways PMS) Primary & Additional Fields
  const [trainNumber, setTrainNumber] = useState<string>("");
  const [trainDateTime, setTrainDateTime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [showRailExtraDetails, setShowRailExtraDetails] = useState<boolean>(false);
  const [railParcelId, setRailParcelId] = useState<string>("");
  const [railPwbNumber, setRailPwbNumber] = useState<string>("");
  const [railConsignmentGroupId, setRailConsignmentGroupId] = useState<string>("");
  const [railSourceStation, setRailSourceStation] = useState<string>("");
  const [railDestStation, setRailDestStation] = useState<string>("");
  const [railArrivalTime, setRailArrivalTime] = useState<string>("");
  const [railFreightScale, setRailFreightScale] = useState<"Scale-R" | "Scale-P" | "Scale-S">("Scale-R");
  const [railSpaceAllocation, setRailSpaceAllocation] = useState<"F-SLR" | "R-SLR" | "VPU" | "VP" | "WAGON">("F-SLR");
  const [railLoadingManifestId, setRailLoadingManifestId] = useState<string>("");

  // Flight (Air Cargo IATA) Primary & Additional Fields
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [flightDateTime, setFlightDateTime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [showAirExtraDetails, setShowAirExtraDetails] = useState<boolean>(false);
  const [airAwbNumber, setAirAwbNumber] = useState<string>("");
  const [airSourceAirport, setAirSourceAirport] = useState<string>("");
  const [airDestAirport, setAirDestAirport] = useState<string>("");
  const [airUldId, setAirUldId] = useState<string>("");
  const [airBayLocation, setAirBayLocation] = useState<"Forward Hold (FWD-01)" | "Aft Hold (AFT-02)" | "Bulk Cargo Bay" | "Main Deck">("Forward Hold (FWD-01)");
  const [airFlightManifest, setAirFlightManifest] = useState<string>("");

  // In-House & Strategic Courier Partner Fields (ANC Custom Delivery at Top)
  const [courierProvider, setCourierProvider] = useState<"anc_custom" | "bluedart" | "delhivery" | "shiprocket" | "shadowfax" | "indiapost" | "xpressbees" | "dtdc">("anc_custom");
  const [courierTrackingAwb, setCourierTrackingAwb] = useState<string>("");
  const [showCourierExtraDetails, setShowCourierExtraDetails] = useState<boolean>(false);
  const [courierRiderName, setCourierRiderName] = useState<string>("");
  const [courierRiderContact, setCourierRiderContact] = useState<string>("");

  // Ship (Maritime Ocean Cargo) Primary & Additional Fields
  const [vesselName, setVesselName] = useState<string>("");
  const [vesselImo, setVesselImo] = useState<string>("");
  const [shipDateTime, setShipDateTime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [shipContainerId, setShipContainerId] = useState<string>("");
  const [shipSealNumber, setShipSealNumber] = useState<string>("");
  const [showShipExtraDetails, setShowShipExtraDetails] = useState<boolean>(false);
  const [shipSourcePort, setShipSourcePort] = useState<string>("");
  const [shipDestPort, setShipDestPort] = useState<string>("");
  const [shipVoyageNumber, setShipVoyageNumber] = useState<string>("");
  const [shipBillOfLading, setShipBillOfLading] = useState<string>("");
  const [shipShippingLine, setShipShippingLine] = useState<string>("");
  const [shipBerthLocation, setShipBerthLocation] = useState<string>("");
  const [shipManifestId, setShipManifestId] = useState<string>("");

  // Local Delivery / Out For Delivery Fleet (Bike, Van, Truck)
  const [deliveryDriverName, setDeliveryDriverName] = useState<string>("");
  const [deliveryDriverContact, setDeliveryDriverContact] = useState<string>("");
  const [deliveryVehiclePlate, setDeliveryVehiclePlate] = useState<string>("");
  const [deliverySlot, setDeliverySlot] = useState<string>("Afternoon Window (14:00 - 18:00)");
  const [showLocalFleetExtra, setShowLocalFleetExtra] = useState<boolean>(false);
  const [deliveryFleetProvider, setDeliveryFleetProvider] = useState<string>("");
  const [deliveryRunSheetId, setDeliveryRunSheetId] = useState<string>("");

  // Architecture Comparison Reference Drawer
  const [showFreightArchitectureRef, setShowFreightArchitectureRef] = useState<boolean>(false);

  const [deliveryGateStatus, setDeliveryGateStatus] = useState<"in_transit" | "gate_reached" | "otp_sent" | "otp_verified" | "delivered">("in_transit");
  const [deliveryOtpValue, setDeliveryOtpValue] = useState<string>("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("849201");
  const [deliveryOtpRemainingSeconds, setDeliveryOtpRemainingSeconds] = useState<number>(300);
  const [labelProof, setLabelProof] = useState<{
    file: File | null;
    dataUrl: string | null;
    name: string;
    size: number;
  } | null>(null);
  const [productProof, setProductProof] = useState<{
    file: File | null;
    dataUrl: string | null;
    name: string;
    size: number;
  } | null>(null);
  const [isFinalizingPod, setIsFinalizingPod] = useState<boolean>(false);
  const [auditWaybillModalOrder, setAuditWaybillModalOrder] = useState<Order | null>(null);
  const [podModalImage, setPodModalImage] = useState<{
    src: string;
    title: string;
    subtitle: string;
    name?: string;
    size?: number;
  } | null>(null);

  // Deny Loading (Revert to Sorting Dock) Modal State
  const [denyLoadingModalOrder, setDenyLoadingModalOrder] = useState<Order | null>(null);
  const [denyLoadingReason, setDenyLoadingReason] = useState<string>("🏷️ Mislabeled Destination / Routing");
  const [customDenyNotes, setCustomDenyNotes] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPodModalImage(null);
      }
    };
    if (podModalImage) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [podModalImage]);

  // Dynamic Hubs Directory & Registration State
  const [hubsList, setHubsList] = useState<LogisticsHub[]>(STANDARD_HUBS);
  const [showRegisterHubModal, setShowRegisterHubModal] = useState<boolean>(false);
  const [newHubCode, setNewHubCode] = useState<string>("");
  const [newHubName, setNewHubName] = useState<string>("");
  const [newHubRegion, setNewHubRegion] = useState<string>("");
  const [newHubCoverage, setNewHubCoverage] = useState<string>("");
  const [newHubRole, setNewHubRole] = useState<string>("");
  const [newHubType, setNewHubType] = useState<LogisticsHub["type"]>("regional_gateway");
  const [newHubCountry, setNewHubCountry] = useState<string>("India");
  const [isRegisteringHub, setIsRegisteringHub] = useState<boolean>(false);

  // Fetch all standard and dynamic hubs on mount
  useEffect(() => {
    async function loadHubs() {
      try {
        const res = await fetch("/api/hubs");
        const data = await res.json();
        if (data.success && Array.isArray(data.hubs) && data.hubs.length > 0) {
          setHubsList(data.hubs);
        }
      } catch (err) {
        console.error("Error fetching hubs from /api/hubs:", err);
      }
    }
    loadHubs();
  }, []);

  const handleRegisterDynamicHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newHubCode.trim() || !newHubName.trim() || !newHubRegion.trim()) {
      toast({
        type: "error",
        title: "Required Fields Missing",
        description: "Please provide Hub Code, Facility Name, and Region.",
      });
      return;
    }
    setIsRegisteringHub(true);
    try {
      const res = await fetch("/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newHubCode,
          name: newHubName,
          region: newHubRegion,
          coverageArea: newHubCoverage,
          strategicRole: newHubRole,
          type: newHubType,
          country: newHubCountry,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHubsList(data.hubs);
        toast({
          type: "success",
          title: "Hub Registered",
          description: data.message || `Strategic Hub ${newHubName} [${newHubCode.toUpperCase()}] registered!`,
        });
        setShowRegisterHubModal(false);
        setNewHubCode("");
        setNewHubName("");
        setNewHubRegion("");
        setNewHubCoverage("");
        setNewHubRole("");
      } else {
        toast({
          type: "error",
          title: "Registration Failed",
          description: data.error || "Failed to register hub.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err.message || "Network error registering hub.",
      });
    } finally {
      setIsRegisteringHub(false);
    }
  };

  const handleDeleteDynamicHub = async (hubId: string, hubName: string) => {
    if (!confirm(`Are you sure you want to decommission dynamic hub "${hubName}"?`)) return;
    try {
      const res = await fetch(`/api/hubs?id=${encodeURIComponent(hubId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setHubsList(data.hubs);
        if (activeHubId === hubId) {
          setActiveHubId("HUB-DEL-01");
        }
        toast({
          type: "success",
          title: "Hub Decommissioned",
          description: data.message || `Hub ${hubName} decommissioned.`,
        });
      } else {
        toast({
          type: "error",
          title: "Action Failed",
          description: data.error || "Failed to remove hub.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err.message || "Network error removing hub.",
      });
    }
  };

  // URL & LocalStorage Persistence: Keep user on exact tab and open order on refresh
  const [hasHydratedLocation, setHasHydratedLocation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const today = new Date().toISOString().split("T")[0];
      setTrainDateTime(`${today}T14:05`);
      setFlightDateTime(`${today}T09:30`);
    } catch {
      // client date init fallback
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get("tab") as AdminTab | null;
      const orderFromUrl = params.get("order") || params.get("orderId");
      const slugFromUrl = params.get("slug") || params.get("product");
      const hubFromUrl = params.get("hub");

      const savedTab = localStorage.getItem("ancwave_admin_active_tab") as AdminTab | null;
      const savedOrder = localStorage.getItem("ancwave_admin_expanded_order");
      const savedSlug = localStorage.getItem("ancwave_admin_selected_slug");
      const savedHub = localStorage.getItem("ancwave_admin_active_hub");

      const validTabs: AdminTab[] = [
        "dashboard",
        "orders",
        "delivery",
        "inventory",
        "variation-engine",
        "shipping",
        "reviews",
        "team",
      ];

      const initialTab =
        tabFromUrl && validTabs.includes(tabFromUrl)
          ? tabFromUrl
          : savedTab && validTabs.includes(savedTab)
            ? savedTab
            : null;

      if (initialTab) {
        setActiveTab(initialTab);
      }

      const initialOrder = orderFromUrl || savedOrder;
      if (initialOrder) {
        setExpandedOrderId(initialOrder);
      }

      const initialSlug = slugFromUrl || savedSlug;
      if (initialSlug) {
        setSelectedSlug(initialSlug);
      }

      const initialHub = hubFromUrl || savedHub;
      if (initialHub) {
        setActiveHubId(initialHub);
      }
    } catch (e) {
      console.warn("Location hydration notice:", e);
    } finally {
      setHasHydratedLocation(true);
    }
  }, []);

  // Sync activeTab to URL and localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedLocation) return;
    try {
      localStorage.setItem("ancwave_admin_active_tab", activeTab);

      const url = new URL(window.location.href);
      if (activeTab === "dashboard") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", activeTab);
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.warn("Tab sync notice:", e);
    }
  }, [activeTab, hasHydratedLocation]);

  // Sync expandedOrderId to URL and localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedLocation) return;
    try {
      const url = new URL(window.location.href);

      if (expandedOrderId) {
        const matchedOrder = orders.find(
          (o) => o.id === expandedOrderId || o.orderNumber === expandedOrderId
        );
        const orderIdentifier = matchedOrder?.orderNumber || expandedOrderId;
        localStorage.setItem("ancwave_admin_expanded_order", orderIdentifier);
        url.searchParams.set("order", orderIdentifier);
      } else {
        localStorage.removeItem("ancwave_admin_expanded_order");
        url.searchParams.delete("order");
        url.searchParams.delete("orderId");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.warn("Order sync notice:", e);
    }
  }, [expandedOrderId, orders, hasHydratedLocation]);

  // Sync selectedSlug to URL and localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedLocation) return;
    try {
      localStorage.setItem("ancwave_admin_selected_slug", selectedSlug);

      const url = new URL(window.location.href);
      if (selectedSlug && selectedSlug !== "form-01") {
        url.searchParams.set("slug", selectedSlug);
      } else {
        url.searchParams.delete("slug");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.warn("Slug sync notice:", e);
    }
  }, [selectedSlug, hasHydratedLocation]);

  // Sync activeHubId to URL and localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedLocation) return;
    try {
      localStorage.setItem("ancwave_admin_active_hub", activeHubId);

      const url = new URL(window.location.href);
      if (activeHubId && activeHubId !== "HUB-DEL-01") {
        url.searchParams.set("hub", activeHubId);
      } else {
        url.searchParams.delete("hub");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.warn("Hub sync notice:", e);
    }
  }, [activeHubId, hasHydratedLocation]);

  // Smooth scroll into view when restoring an open order
  useEffect(() => {
    if (expandedOrderId && activeTab === "orders" && orders.length > 0) {
      const timer = setTimeout(() => {
        const el =
          document.getElementById(`order-console-${expandedOrderId}`) ||
          document.getElementById(`order-row-${expandedOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [expandedOrderId, activeTab, orders.length]);

  // Computed Hub Queue for the active hub station
  const hubQueue = useMemo(() => {
    return getHubOperationsQueue(orders, activeHubId);
  }, [orders, activeHubId]);

  // Precomputed operational queue breakdown [incoming, received, sorting, loading, outgoing, gateHandover]
  // and sum of the 5 core hub operations for every hub (standard & dynamic)
  const allHubsQueueStats = useMemo(() => {
    return hubsList.map((h) => {
      const q = getHubOperationsQueue(orders, h.id);
      const inCount = q.totals.incoming;
      const recCount = q.totals.received;
      const sortCount = q.totals.sorting;
      const loadCount = q.totals.loading;
      const outCount = q.totals.outgoing;
      const gateCount = q.totals.gateHandover;
      const sum5 = inCount + recCount + sortCount + loadCount + outCount;
      const totalAll = sum5 + gateCount;
      const countsArray = [inCount, recCount, sortCount, loadCount, outCount, gateCount];
      return {
        hub: h,
        queue: q,
        inCount,
        recCount,
        sortCount,
        loadCount,
        outCount,
        gateCount,
        sum5,
        totalAll,
        countsArray,
        formattedArray: `[${countsArray.join(",")}]`,
      };
    });
  }, [orders, hubsList]);

  const activeHubStats = useMemo(() => {
    return (
      allHubsQueueStats.find((s) => s.hub.id === activeHubId) || {
        hub: getHubById(activeHubId, hubsList) || hubsList[0],
        queue: hubQueue,
        inCount: hubQueue.totals.incoming,
        recCount: hubQueue.totals.received,
        sortCount: hubQueue.totals.sorting,
        loadCount: hubQueue.totals.loading,
        outCount: hubQueue.totals.outgoing,
        gateCount: hubQueue.totals.gateHandover,
        sum5:
          hubQueue.totals.incoming +
          hubQueue.totals.received +
          hubQueue.totals.sorting +
          hubQueue.totals.loading +
          hubQueue.totals.outgoing,
        totalAll: hubQueue.totals.totalActive,
        countsArray: [
          hubQueue.totals.incoming,
          hubQueue.totals.received,
          hubQueue.totals.sorting,
          hubQueue.totals.loading,
          hubQueue.totals.outgoing,
          hubQueue.totals.gateHandover,
        ],
        formattedArray: `[${hubQueue.totals.incoming},${hubQueue.totals.received},${hubQueue.totals.sorting},${hubQueue.totals.loading},${hubQueue.totals.outgoing},${hubQueue.totals.gateHandover}]`,
      }
    );
  }, [allHubsQueueStats, activeHubId, hubQueue]);

  const isCentralPackingActive = activeHubId === "STOCK-CTR-01" || activeHubId === "STK-CTR-01";

  const centralPackingStats = useMemo(() => {
    return (
      allHubsQueueStats.find((s) => s.hub.id === "STOCK-CTR-01" || s.hub.id === "STK-CTR-01") || {
        hub: CENTRAL_STOCK_CENTER,
        queue: getHubOperationsQueue(orders, "STOCK-CTR-01"),
        inCount: 0,
        recCount: 0,
        sortCount: 0,
        loadCount: 0,
        outCount: 0,
        gateCount: 0,
        sum5: 0,
        totalAll: 0,
        countsArray: [0, 0, 0, 0, 0, 0],
        formattedArray: "[0,0,0,0,0,0]",
      }
    );
  }, [allHubsQueueStats, orders]);

  // Quick select items for compact button-driven control unit
  const vehicleModes = [
    { id: "bike" as const, label: "Bike", icon: Bicycle },
    { id: "van" as const, label: "Van", icon: Van },
    { id: "truck" as const, label: "Truck", icon: Truck },
    { id: "train" as const, label: "Train", icon: Train },
    { id: "ship" as const, label: "Ship", icon: Ship },
    { id: "plane" as const, label: "Plane", icon: Plane },
  ];

  // Daily Passcode Gate State
  const [passcodeInput, setPasscodeInput] = useState<string>("ancwave-ops-secure-2026");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState<boolean>(false);

  // Dedicated Admin Authentication Gateway State
  const [adminAuthTab, setAdminAuthTab] = useState<"signin" | "signup">("signin");
  const [adminEmail, setAdminEmail] = useState<string>("owner@ancwave.com");
  const [adminPassword, setAdminPassword] = useState<string>("ownerpassword123");
  const [adminName, setAdminName] = useState<string>("");
  const [adminRegistrationPasscode, setAdminRegistrationPasscode] = useState<string>("ancwave-ops-secure-2026");
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState<boolean>(false);

  // Team Management State (Owner Exclusive)
  const [teamUsers, setTeamUsers] = useState<
    { id: string; email: string; name: string; role: string; createdAt: string }[]
  >([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");
  const [isSearchingTeam, setIsSearchingTeam] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Inventory Inputs
  const [stockInput, setStockInput] = useState<number>(4);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(true);
  const [revalidateSecret, setRevalidateSecret] = useState<string>(DEFAULT_REVALIDATE_SECRET);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  // Variation Engine State
  const [masterProductId, setMasterProductId] = useState<string>("ANC-FORM-01");
  const [masterName, setMasterName] = useState<string>("");
  const [masterDescription, setMasterDescription] = useState<string>("");
  const [masterType, setMasterType] = useState<string>("Over-Ear Headphones");
  const [masterBasePrice, setMasterBasePrice] = useState<number>(349);
  const [masterBaseDiscount, setMasterBaseDiscount] = useState<number>(0);
  const [adminCurrencyMode, setAdminCurrencyMode] = useState<"USD" | "INR">("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(95.26);
  const [autoCascadePrice, setAutoCascadePrice] = useState<boolean>(true);
  const [quickPriceInput, setQuickPriceInput] = useState<number>(349);
  const [globalSpecsList, setGlobalSpecsList] = useState<{ key: string; value: string }[]>([]);
  const [childVariants, setChildVariants] = useState<IVariant[]>([]);
  const [variantGroups, setVariantGroups] = useState<IVariantGroup[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState<boolean>(false);

  // Global Shipping Method Pricing Fixtures
  const [generalDeliveryPriceUsd, setGeneralDeliveryPriceUsd] = useState<number>(0);
  const [generalDeliveryPriceInr, setGeneralDeliveryPriceInr] = useState<number>(0);
  const [expressDeliveryPriceUsd, setExpressDeliveryPriceUsd] = useState<number>(15);
  const [expressDeliveryPriceInr, setExpressDeliveryPriceInr] = useState<number>(1200);
  const [isSavingShipping, setIsSavingShipping] = useState<boolean>(false);

  // AWS Live EventBridge & Lambda Testing State
  const [isTestingAws, setIsTestingAws] = useState<boolean>(false);
  const [awsTestResult, setAwsTestResult] = useState<any>(null);

  const handleRunAwsTest = async () => {
    setIsTestingAws(true);
    try {
      const res = await fetch("/api/admin/aws-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-all",
          orderNumber: "ANC-TEST-" + Math.floor(100000 + Math.random() * 900000),
          totalUSD: 361,
        }),
      });
      const data = await res.json();
      setAwsTestResult(data);
      if (data.success) {
        toast({
          type: "success",
          title: "AWS EventBridge & Lambda Succeeded",
          description: `Event: ${data.eventBridge?.eventId} · Lambda executed in ${data.lambda?.durationMs}ms (Status: 200)`,
        });
      } else {
        toast({
          type: "error",
          title: "AWS Test Notice",
          description: data.error || "Failed to trigger AWS test",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err?.message || "Could not reach AWS tester endpoint",
      });
    } finally {
      setIsTestingAws(false);
    }
  };

  // Dedicated Variant Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<ProductData | null>(null);
  const [variantStockDrafts, setVariantStockDrafts] = useState<Record<string, number>>({});
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);

  // Restock Pipeline Process State (In-Progress Procurement POs)
  const [restockPipelineOpenSku, setRestockPipelineOpenSku] = useState<string | null>(null);
  const [restockTargetQtyInput, setRestockTargetQtyInput] = useState<Record<string, number>>({});
  const [restockLeadDaysInput, setRestockLeadDaysInput] = useState<Record<string, number>>({});
  const [restockReceiveQtyInput, setRestockReceiveQtyInput] = useState<Record<string, number>>({});
  const [isProcessingRestockPipeline, setIsProcessingRestockPipeline] = useState<boolean>(false);

  // Dynamic Product Creator Modal State (10 Top-Selling E-Commerce Categories)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [newProdCategory, setNewProdCategory] = useState<string>("apparel-fashion");
  const [newProdName, setNewProdName] = useState<string>("");
  const [newProdSlug, setNewProdSlug] = useState<string>("");
  const [newProdModel, setNewProdModel] = useState<string>("ORGANIC HEAVYWEIGHT 450 GSM");
  const [newProdTagline, setNewProdTagline] = useState<string>("Ultra-dense combed cotton with tailored architectural cut.");
  const [newProdDescription, setNewProdDescription] = useState<string>(
    "Crafted from 100% sustainable combed cotton. Designed with dual variant architectures: A1 (Regular Fit) and A2 (Oversized Streetwear Fit)."
  );
  const [newProdPrice, setNewProdPrice] = useState<number>(120);
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<number>(145);
  const [newProdSpecs, setNewProdSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "Material / Fabric", value: "100% Organic Combed Ring-Spun Cotton" },
    { key: "Fabric Density", value: "450 GSM Heavyweight French Terry" },
    { key: "Fit Architecture", value: "A1 Regular Fit & A2 Streetwear Oversized Cut" },
    { key: "Care Instructions", value: "Cold wash inside out, lay flat to dry" },
  ]);
  const [newProdArchitectures, setNewProdArchitectures] = useState<INewProdArchitecture[]>([
    {
      id: "A1",
      name: "A1 (Regular Fit)",
      price: 120,
      variantSpecs: [{ key: "Fit Cut", value: "Regular Tailored Cut" }],
      colors: [
        { id: "c1", color: "Forest Green", hex: "#2E5339", sku: "PROD-A1-GREEN", stock: 5, price: 120, images: ["/images/lifestyle-workspace.jpg"] },
        { id: "c2", color: "Pitch Black", hex: "#1A1A1A", sku: "PROD-A1-BLACK", stock: 2, price: 120, images: ["/images/hero-graphite.jpg"] },
        { id: "c3", color: "Mineral Blue", hex: "#3B6978", sku: "PROD-A1-BLUE", stock: 4, price: 120, images: ["/images/hero-silver.jpg"] },
      ],
    },
    {
      id: "A2",
      name: "A2 (Oversized Fit)",
      price: 130,
      variantSpecs: [{ key: "Fit Cut", value: "Streetwear Oversized Drop Shoulder" }],
      colors: [
        { id: "c4", color: "Arctic White", hex: "#ECECEC", sku: "PROD-A2-WHITE", stock: 8, price: 130, images: ["/images/hero-sandstone.jpg"] },
        { id: "c5", color: "Forest Green", hex: "#2E5339", sku: "PROD-A2-GREEN", stock: 7, price: 130, images: ["/images/lifestyle-cafe.jpg"] },
      ],
    },
  ]);
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

  const fetchAdminData = async (slugToFetch?: string) => {
    try {
      const target = slugToFetch || selectedSlug;

      // 1. Fetch all products
      let fetchedProductsList: ProductData[] = [];
      const allRes = await fetch("/api/product?all=true");
      if (allRes.ok) {
        const allData = await allRes.json();
        fetchedProductsList = allData.products || [];
        setProducts(fetchedProductsList);
      }

      // 2. Fetch targeted product
      const prodRes = await fetch(`/api/product?slug=${target}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        let p: ProductData | null = data.product;

        // If target product was not found, but we have products in database, auto-select the first product
        if (!p && fetchedProductsList.length > 0) {
          const firstP = fetchedProductsList[0];
          setSelectedSlug(firstP.slug);
          try {
            const retryRes = await fetch(`/api/product?slug=${firstP.slug}`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              p = retryData.product;
            }
          } catch {
            // ignore
          }
        }

        if (p) {
          setProduct(p);
          setStockInput(p.stock ?? 0);
          setDiscountInput(p.activeDiscount || 0);
          setIsFlashSale(p.isFlashSale ?? true);

          // Populate Variation Engine
          setMasterProductId(p.productId || `ANC-${p.id?.toUpperCase() || "01"}`);
          setMasterName(p.name || "");
          setMasterDescription(p.description || "");
          setMasterType(p.type || "Over-Ear Headphones");
          const effProductPrice = p.basePrice || p.price || 99;
          setMasterBasePrice(effProductPrice);
          setQuickPriceInput(effProductPrice);
          setMasterBaseDiscount(p.baseDiscount || 0);

          if (p.globalSpecs) {
            setGlobalSpecsList(
              Object.entries(p.globalSpecs).map(([key, value]) => ({ key, value }))
            );
          } else {
            setGlobalSpecsList([]);
          }

          if (p.variantGroups && p.variantGroups.length > 0) {
            setVariantGroups(p.variantGroups);
            setChildVariants(
              p.childVariants && p.childVariants.length > 0
                ? p.childVariants
                : variantGroupsToChildVariants(p.variantGroups, effProductPrice)
            );
          } else if (p.childVariants && p.childVariants.length > 0) {
            setChildVariants(p.childVariants);
            setVariantGroups(childVariantsToVariantGroups(p.childVariants, effProductPrice));
          } else {
            setVariantGroups([]);
            setChildVariants([]);
          }
        } else {
          setProduct(null as any);
          setVariantGroups([]);
          setChildVariants([]);
        }
      }

      // 3. Fetch completed orders from MongoDB Atlas and store
      try {
        const ordRes = await fetch("/api/orders?all=true");
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders || []);
        } else {
          const fbRes = await fetch("/api/checkout");
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            setOrders(fbData.orders || []);
          }
        }
      } catch (ordErr) {
        console.warn("Failed to fetch admin orders:", ordErr);
      }

      // 4. Fetch reviews for selected product
      const revRes = await fetch(`/api/reviews?productId=${target}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      }

      // 5. Fetch global shipping method pricing fixtures
      const shipRes = await fetch("/api/shipping");
      if (shipRes.ok) {
        const shipData = await shipRes.json();
        if (shipData.success && shipData.shipping) {
          setGeneralDeliveryPriceUsd(shipData.shipping.generalDeliveryPriceUsd ?? 0);
          setGeneralDeliveryPriceInr(shipData.shipping.generalDeliveryPriceInr ?? 0);
          setExpressDeliveryPriceUsd(shipData.shipping.expressDeliveryPriceUsd ?? 15);
          setExpressDeliveryPriceInr(shipData.shipping.expressDeliveryPriceInr ?? 1200);
        }
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedSlug]);

  // Handle master stock adjustment
  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const newPriceNum = Number(quickPriceInput);
      const newPriceInr = Math.round(newPriceNum * exchangeRate);

      // If auto-cascading is enabled, cascade quick price to variant groups
      let payloadVariants = variantGroups;
      if (autoCascadePrice && variantGroups.length > 0) {
        payloadVariants = variantGroups.map((g) => ({
          ...g,
          price: newPriceNum,
          priceInr: newPriceInr,
          colors: g.colors.map((c) => ({
            ...c,
            price: newPriceNum,
            priceInr: newPriceInr,
          })),
        }));
        setVariantGroups(payloadVariants);
      }

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          stock: Number(stockInput),
          price: newPriceNum,
          basePrice: newPriceNum,
          priceInr: newPriceInr,
          activeDiscount: Number(discountInput),
          isFlashSale,
          variantGroups: payloadVariants,
          childVariants: variantGroupsToChildVariants(payloadVariants, newPriceNum),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setMasterBasePrice(newPriceNum);
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        toast({
          type: "success",
          title: "Pricing & Inventory Synced",
          description: `Price set to $${newPriceNum.toFixed(2)} (₹${newPriceInr.toLocaleString("en-IN")}) across ${data.product.stock} units. Edge cache purged.`,
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update real-time stock",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle on-demand Next.js ISR purging using REVALIDATE_SECRET
  const handlePurgeAndRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": revalidateSecret,
        },
        body: JSON.stringify({
          path: `/products/${selectedSlug}`,
          tag: "product-details",
          secret: revalidateSecret,
        }),
      });

      const data = await res.json();
      if (data.revalidated) {
        toast({
          type: "success",
          title: "Next.js ISR Cache Wiped",
          description: `Secret verified · Event ID: ${data.awsEventId}. Edge cache purged.`,
        });
        fetchAdminData();
      } else {
        toast({
          type: "error",
          title: "Revalidation Failed",
          description: data.error || "Secret rejection from edge",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to contact revalidation endpoint",
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  // Quick variant stock adjuster (updates both variantGroups and childVariants)
  const handleQuickVariantStock = async (sku: string, newStock: number) => {
    try {
      const val = Math.max(0, newStock);
      // Optimistic local state update
      setVariantGroups((prev) =>
        prev.map((g) => ({
          ...g,
          colors: g.colors.map((c) => (c.sku === sku ? { ...c, stock: val } : c)),
        }))
      );
      setChildVariants((prev) =>
        prev.map((v) => (v.sku === sku ? { ...v, stock: val } : v))
      );

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          variantSku: sku,
          variantStock: val,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variant Stock Updated",
          description: `SKU ${sku} set to ${val} units. Live product inventory: ${data.product.stock} units.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Stock Update Failed", description: "Could not update variant stock" });
    }
  };

  // --- Hierarchical Variant Architecture & Colorway Studio Helpers ---

  // 1. Add a new Architecture Cut (e.g. A3)
  const handleAddArchitectureGroup = () => {
    const nextNum = variantGroups.length + 1;
    const newArchId = `A${nextNum}`;
    const newArchName = `A${nextNum} (${nextNum === 1 ? "Regular Fit" : nextNum === 2 ? "Oversized Fit" : "Performance Cut"})`;
    const newSku = `${masterProductId}-${newArchId}-BLK`;

    const newGroup: IVariantGroup = {
      id: newArchId,
      name: newArchName,
      specOverride: newArchName,
      price: masterBasePrice,
      discount: masterBaseDiscount,
      colors: [
        {
          id: `${newArchId}-C1`,
          sku: newSku,
          color: "Pitch Black",
          hex: "#1A1A1A",
          price: masterBasePrice,
          discount: 0,
          stock: 5,
          images: ["/images/hero-graphite.jpg"],
        },
      ],
    };

    const updated = [...variantGroups, newGroup];
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
    toast({
      type: "success",
      title: "Architecture Created",
      description: `Added "${newArchName}" with 1 initial colorway. Click "+ Add Color" to add more colors.`,
    });
  };

  // 2. Remove an entire Architecture
  const handleRemoveArchitectureGroup = (groupId: string) => {
    if (variantGroups.length <= 1) {
      toast({
        type: "info",
        title: "Minimum 1 Architecture Required",
        description: "Products must have at least one variant architecture.",
      });
      return;
    }
    const updated = variantGroups.filter((g) => g.id !== groupId);
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 3. Update Architecture Header
  const handleUpdateArchitectureName = (groupId: string, newName: string) => {
    const updated = variantGroups.map((g) =>
      g.id === groupId ? { ...g, name: newName, specOverride: newName } : g
    );
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleCascadePriceToAllVariants = (priceUsd: number, priceInr?: number) => {
    const inrVal =
      priceInr ??
      (priceUsd < 1
        ? Number((priceUsd * exchangeRate).toFixed(2))
        : Math.round(priceUsd * exchangeRate));
    const updated = variantGroups.map((g) => ({
      ...g,
      price: priceUsd,
      priceInr: inrVal,
      colors: g.colors.map((c) => ({
        ...c,
        price: priceUsd,
        priceInr: inrVal,
      })),
    }));
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, priceUsd));
    toast({
      type: "success",
      title: "Price Cascaded to All Variants",
      description: `All ${updated.length} architectures & colorways updated to $${priceUsd.toFixed(2)} (₹${inrVal.toLocaleString("en-IN")}). Click Save to persist live.`,
    });
  };

  const handleBasePriceChangeUSD = (newUsd: number) => {
    setMasterBasePrice(newUsd);
    setQuickPriceInput(newUsd);
    if (autoCascadePrice) {
      const inrVal =
        newUsd < 1
          ? Number((newUsd * exchangeRate).toFixed(2))
          : Math.round(newUsd * exchangeRate);
      const updated = variantGroups.map((g) => ({
        ...g,
        price: newUsd,
        priceInr: inrVal,
        colors: g.colors.map((c) => ({
          ...c,
          price: newUsd,
          priceInr: inrVal,
        })),
      }));
      setVariantGroups(updated);
      setChildVariants(variantGroupsToChildVariants(updated, newUsd));
    } else {
      setChildVariants(variantGroupsToChildVariants(variantGroups, newUsd));
    }
  };

  const handleBasePriceChangeINR = (newInr: number) => {
    const newUsd = Number((newInr / exchangeRate).toFixed(2));
    setMasterBasePrice(newUsd);
    setQuickPriceInput(newUsd);
    if (autoCascadePrice) {
      const updated = variantGroups.map((g) => ({
        ...g,
        price: newUsd,
        priceInr: newInr,
        colors: g.colors.map((c) => ({
          ...c,
          price: newUsd,
          priceInr: newInr,
        })),
      }));
      setVariantGroups(updated);
      setChildVariants(variantGroupsToChildVariants(updated, newUsd));
    } else {
      setChildVariants(variantGroupsToChildVariants(variantGroups, newUsd));
    }
  };

  const handleQuickRazorpayTestPreset = (inrAmount: number) => {
    const usd = Number((inrAmount / exchangeRate).toFixed(2));
    setMasterBasePrice(usd);
    setQuickPriceInput(usd);
    const updated = variantGroups.map((g) => ({
      ...g,
      price: usd,
      priceInr: inrAmount,
      colors: g.colors.map((c) => ({
        ...c,
        price: usd,
        priceInr: inrAmount,
      })),
    }));
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, usd));
    toast({
      type: "info",
      title: `⚡ Razorpay Test Price Applied: ₹${inrAmount}`,
      description: `Base price and all variants updated to ₹${inrAmount} (~$${usd}). Click "Save Master & Child Variants" to persist live.`,
    });
  };

  const handleUpdateArchitecturePrice = (groupId: string, price: number, priceInr?: number) => {
    const inrVal = priceInr ?? Math.round(price * exchangeRate);
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        price: Math.max(0, price),
        priceInr: Math.max(0, inrVal),
        colors: g.colors.map((c) => ({
          ...c,
          price: Math.max(0, price),
          priceInr: Math.max(0, inrVal),
        })),
      };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // Shipping Method Pricing Fixtures Handlers
  const handleGeneralPriceChangeUSD = (val: number) => {
    setGeneralDeliveryPriceUsd(val);
    setGeneralDeliveryPriceInr(Math.round(val * exchangeRate));
  };

  const handleGeneralPriceChangeINR = (val: number) => {
    setGeneralDeliveryPriceInr(val);
    setGeneralDeliveryPriceUsd(Number((val / exchangeRate).toFixed(2)));
  };

  const handleExpressPriceChangeUSD = (val: number) => {
    setExpressDeliveryPriceUsd(val);
    setExpressDeliveryPriceInr(Math.round(val * exchangeRate));
  };

  const handleExpressPriceChangeINR = (val: number) => {
    setExpressDeliveryPriceInr(val);
    setExpressDeliveryPriceUsd(Number((val / exchangeRate).toFixed(2)));
  };

  const handleSaveShippingFixtures = async () => {
    setIsSavingShipping(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generalDeliveryPriceUsd,
          generalDeliveryPriceInr,
          expressDeliveryPriceUsd,
          expressDeliveryPriceInr,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Shipping Pricing Fixtures Saved",
          description: `General Delivery: $${generalDeliveryPriceUsd} (₹${generalDeliveryPriceInr}) · Express: $${expressDeliveryPriceUsd} (₹${expressDeliveryPriceInr})`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to Save Shipping Pricing",
        description: err.message || "Could not update shipping fixtures",
      });
    } finally {
      setIsSavingShipping(false);
    }
  };

  // 4. Add a Colorway to a specific Architecture
  const handleAddColorToArchitecture = (groupId: string, initialColor = "New Color", initialStock = 5) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const cleanName = initialColor.trim() || `Color ${g.colors.length + 1}`;
      const code = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || `C${g.colors.length + 1}`;
      const newSku = `${masterProductId}-${g.id.toUpperCase()}-${code}`;
      const colorLower = cleanName.toLowerCase();
      const hex = colorLower.includes("green") ? "#2E5339" :
        colorLower.includes("black") ? "#1A1A1A" :
          colorLower.includes("blue") ? "#3B6978" :
            colorLower.includes("white") ? "#ECECEC" :
              colorLower.includes("red") ? "#DC2626" :
                colorLower.includes("grey") || colorLower.includes("gray") ? "#6B7280" :
                  colorLower.includes("sandstone") || colorLower.includes("beige") ? "#D4B996" :
                    "#4F46E5";

      const newColor: IVariantColor = {
        id: `${g.id}-${newSku}`,
        sku: newSku,
        color: cleanName,
        hex,
        price: g.price || masterBasePrice,
        priceInr: g.priceInr || Math.round((g.price || masterBasePrice) * exchangeRate),
        discount: g.discount || 0,
        stock: Math.max(0, initialStock),
        images: ["/images/hero-silver.jpg"],
      };

      return {
        ...g,
        colors: [...g.colors, newColor],
      };
    });

    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
    toast({
      type: "success",
      title: "Colorway Added",
      description: `Added "${initialColor}" to ${groupId}.`,
    });
  };

  // 5. Remove a Colorway from Architecture
  const handleRemoveColorFromArchitecture = (groupId: string, colorIndex: number) => {
    const targetGroup = variantGroups.find((g) => g.id === groupId);
    if (targetGroup && targetGroup.colors.length <= 1) {
      toast({
        type: "info",
        title: "Minimum 1 Colorway Required",
        description: "Each architecture must maintain at least one colorway.",
      });
      return;
    }
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      newColors.splice(colorIndex, 1);
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 6. Update Colorway details
  const handleUpdateArchitectureColor = (
    groupId: string,
    colorIndex: number,
    field: keyof IVariantColor,
    val: any
  ) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      if (field === "price") {
        newColors[colorIndex] = {
          ...newColors[colorIndex],
          price: val,
          priceInr:
            val < 1
              ? Number((val * exchangeRate).toFixed(2))
              : Math.round(val * exchangeRate),
        };
      } else if (field === "priceInr") {
        newColors[colorIndex] = {
          ...newColors[colorIndex],
          priceInr: val,
          price: Number((val / exchangeRate).toFixed(2)),
        };
      } else {
        newColors[colorIndex] = { ...newColors[colorIndex], [field]: val };
      }
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 7. Multi-Image Asset Management for Architecture Colors
  const [uploadingColorKey, setUploadingColorKey] = useState<string | null>(null);

  const handleAddImageToColor = (groupId: string, colorIndex: number, url = "/images/hero-silver.jpg") => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = newColors[colorIndex].images || [];
      newColors[colorIndex] = { ...newColors[colorIndex], images: [...curImages, url] };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleUpdateImageInColor = (groupId: string, colorIndex: number, imgIndex: number, newUrl: string) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = [...(newColors[colorIndex].images || [])];
      curImages[imgIndex] = newUrl;
      newColors[colorIndex] = { ...newColors[colorIndex], images: curImages };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleRemoveImageFromColor = (groupId: string, colorIndex: number, imgIndex: number) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = [...(newColors[colorIndex].images || [])];
      if (curImages.length <= 1) {
        toast({
          type: "info",
          title: "Minimum 1 Photo Required",
          description: "Each colorway requires at least one primary showcase image.",
        });
        return g;
      }
      curImages.splice(imgIndex, 1);
      newColors[colorIndex] = { ...newColors[colorIndex], images: curImages };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const [draggedImage, setDraggedImage] = useState<{ groupId: string; colorIndex: number; imgIndex: number } | null>(null);
  const [dragOverImage, setDragOverImage] = useState<{ groupId: string; colorIndex: number; imgIndex: number } | null>(null);

  const handleReorderImagesInColor = (groupId: string, colorIndex: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = [...(newColors[colorIndex].images || [])];
      if (fromIdx < 0 || fromIdx >= curImages.length || toIdx < 0 || toIdx >= curImages.length) return g;
      const [moved] = curImages.splice(fromIdx, 1);
      curImages.splice(toIdx, 0, moved);
      newColors[colorIndex] = { ...newColors[colorIndex], images: curImages };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleColorDirectS3Upload = async (
    groupId: string,
    colorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadKey = `${groupId}-${colorIndex}`;
    setUploadingColorKey(uploadKey);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const presignRes = await fetch("/api/aws/s3-presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `variant-${groupId}-${colorIndex}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`,
            contentType: file.type || "image/jpeg",
            folder: "products",
          }),
        });
        const resJson = await presignRes.json();
        const presignData = resJson.data || resJson;
        if (!resJson.success || !presignData.uploadUrl) {
          throw new Error(resJson.error || "Failed to generate S3 upload signature");
        }

        let uploadedUrl = presignData.publicUrl;
        try {
          const uploadRes = await fetch(presignData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
          });

          if (!uploadRes.ok) throw new Error(`Direct S3 upload failed (Status: ${uploadRes.status})`);
        } catch (directErr) {
          console.warn("Direct S3 upload notice, forwarding via server S3 proxy:", directErr);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("key", presignData.fileKey);
          const fallbackRes = await fetch("/api/reviews/mock-upload", {
            method: "POST",
            body: formData,
          });
          const fallbackData = await fallbackRes.json();
          if (!fallbackData.success || !fallbackData.publicUrl) {
            throw new Error(fallbackData.error || "Both direct S3 and server proxy upload failed");
          }
          uploadedUrl = fallbackData.publicUrl;
        }

        uploadedUrls.push(uploadedUrl);
      }

      const updated = variantGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newColors = [...g.colors];
        const curImages = newColors[colorIndex].images || [];
        newColors[colorIndex] = { ...newColors[colorIndex], images: [...curImages, ...uploadedUrls] };
        return { ...g, colors: newColors };
      });

      setVariantGroups(updated);
      setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));

      toast({
        type: "success",
        title: "S3 Photos Uploaded",
        description: `Attached ${uploadedUrls.length} image(s) to colorway.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Upload Failed",
        description: err.message || "Failed to upload image to S3 bucket.",
      });
    } finally {
      setUploadingColorKey(null);
      e.target.value = "";
    }
  };

  // Global specs helper
  const handleSpecChange = (index: number, key: string, value: string) => {
    const updated = [...globalSpecsList];
    updated[index] = { key, value };
    setGlobalSpecsList(updated);
  };

  const handleAddSpecRow = () => {
    setGlobalSpecsList([...globalSpecsList, { key: "New Spec", value: "Value" }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    const updated = [...globalSpecsList];
    updated.splice(index, 1);
    setGlobalSpecsList(updated);
  };

  // Save full master product & hierarchical variant groups
  const handleSaveVariationEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVariants(true);
    try {
      const globalSpecsRecord = globalSpecsList.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
        return acc;
      }, {} as Record<string, string>);

      const basePriceNum = Number(masterBasePrice);
      const basePriceInr = Math.round(basePriceNum * exchangeRate);
      const syncedChildVariants = variantGroupsToChildVariants(variantGroups, basePriceNum);

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          productId: masterProductId,
          name: masterName,
          description: masterDescription,
          type: masterType,
          basePrice: basePriceNum,
          price: basePriceNum,
          priceInr: basePriceInr,
          baseDiscount: Number(masterBaseDiscount),
          globalSpecs: globalSpecsRecord,
          variantGroups,
          childVariants: syncedChildVariants,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variation Engine Synced",
          description: `Saved ${variantGroups.length} architectures with ${data.product.childVariants?.length || 0} colors. Live stock: ${data.product.stock} units. ISR purged.`,
        });
      } else {
        toast({ type: "error", title: "Save Failed", description: data.error || "Could not save variation engine." });
      }
    } catch {
      toast({ type: "error", title: "Save Failed", description: "Failed to persist variation engine configuration" });
    } finally {
      setIsSavingVariants(false);
    }
  };

  // Open Dedicated Variant Restock Modal
  const openRestockModal = (target: ProductData) => {
    setRestockTargetProduct(target);
    const drafts: Record<string, number> = {};
    if (target.variantGroups && target.variantGroups.length > 0) {
      target.variantGroups.forEach((g) => {
        g.colors.forEach((c) => {
          drafts[c.sku] = c.stock;
        });
      });
    } else if (target.childVariants && target.childVariants.length > 0) {
      target.childVariants.forEach((v) => {
        drafts[v.sku] = v.stock;
      });
    } else if (target.variants && target.variants.length > 0) {
      target.variants.forEach((v, i) => {
        const sku = `${target.productId || target.id.toUpperCase()}-VAR-${i + 1}`;
        drafts[sku] = Math.max(1, Math.floor(target.stock / target.variants.length));
      });
    }
    setVariantStockDrafts(drafts);
    setIsRestockModalOpen(true);
  };

  // Add a Colorway directly from the Restock Modal with instant persistence
  const handleModalAddColor = async (groupIdOrName: string, colorName: string, stock: number) => {
    if (!restockTargetProduct) return;
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "addColor",
          groupId: groupIdOrName,
          color: {
            color: colorName,
            stock: Math.max(0, stock),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        const updatedDrafts = { ...variantStockDrafts };
        data.product.childVariants?.forEach((v: IVariant) => {
          if (updatedDrafts[v.sku] === undefined) {
            updatedDrafts[v.sku] = v.stock;
          }
        });
        setVariantStockDrafts(updatedDrafts);
        setStockInput(data.product.stock);

        toast({
          type: "success",
          title: "Color Added & Revalidated",
          description: `Added "${colorName}" (${stock} units) to ${groupIdOrName}.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Add Color Failed", description: "Could not add color to architecture." });
    }
  };

  // Remove a Colorway directly from the Restock Modal
  const handleModalRemoveColor = async (sku: string) => {
    if (!restockTargetProduct) return;
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "removeColor",
          variantSku: sku,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) setVariantGroups(data.product.variantGroups);
        if (data.product.childVariants) setChildVariants(data.product.childVariants);
        const updatedDrafts = { ...variantStockDrafts };
        delete updatedDrafts[sku];
        setVariantStockDrafts(updatedDrafts);
        setStockInput(data.product.stock);

        toast({
          type: "success",
          title: "Colorway Removed",
          description: `Removed SKU ${sku}.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Remove Failed", description: "Could not remove colorway." });
    }
  };

  // Submit Batch Variant Restock to API
  const handleSaveBatchRestock = async () => {
    if (!restockTargetProduct) return;
    setIsSubmittingRestock(true);
    try {
      const variantUpdates = Object.entries(variantStockDrafts).map(([sku, stock]) => ({
        sku,
        stock: Math.max(0, Number(stock) || 0),
      }));

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          variantUpdates,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        toast({
          type: "success",
          title: "Variants Restocked Successfully",
          description: `Updated ${restockTargetProduct.name} across ${variantUpdates.length} colors. Live stock: ${data.product.stock} units.`,
        });
        setIsRestockModalOpen(false);
        await fetchAdminData(restockTargetProduct.slug);
      } else {
        toast({
          type: "error",
          title: "Restock Failed",
          description: data.error || "Could not update variant stock.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Restock Error",
        description: err.message || "Failed to update variant stock.",
      });
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Restock Pipeline: Apply Restock Process (In-Progress PO)
  const handleApplyRestockProcess = async (sku: string) => {
    if (!restockTargetProduct) return;
    const targetQty = restockTargetQtyInput[sku] ?? 5;
    const leadTimeDays = restockLeadDaysInput[sku] ?? 5;
    setIsProcessingRestockPipeline(true);
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "apply-restock-process",
          variantSku: sku,
          targetQty,
          leadTimeDays,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) setVariantGroups(data.product.variantGroups);
        if (data.product.childVariants) setChildVariants(data.product.childVariants);
        setRestockPipelineOpenSku(null);
        toast({
          type: "success",
          title: "Restock Pipeline Initiated",
          description: `Ordered ${targetQty} units for SKU ${sku} (est. ${leadTimeDays} days lead time). Restock pipeline is now active.`,
        });
        await fetchAdminData(restockTargetProduct.slug);
      } else {
        toast({
          type: "error",
          title: "Pipeline Failed",
          description: data.error || "Could not start restock pipeline.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Pipeline Error",
        description: err.message || "Failed to start restock pipeline.",
      });
    } finally {
      setIsProcessingRestockPipeline(false);
    }
  };

  // Restock Pipeline: Receive Arrived Stock (Partial or Complete)
  const handleReceiveRestockStock = async (sku: string, maxRemaining: number) => {
    if (!restockTargetProduct) return;
    const receivedQty = restockReceiveQtyInput[sku] ?? Math.min(maxRemaining, 3);
    if (receivedQty <= 0) return;
    setIsProcessingRestockPipeline(true);
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "receive-restock-stock",
          variantSku: sku,
          receivedQty,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) setVariantGroups(data.product.variantGroups);
        if (data.product.childVariants) setChildVariants(data.product.childVariants);
        const matchingVariant = data.product.childVariants?.find((v: any) => v.sku === sku);
        if (matchingVariant) {
          setVariantStockDrafts((prev) => ({
            ...prev,
            [sku]: matchingVariant.stock,
          }));
        }
        const remaining = matchingVariant?.restockProcess?.remainingQty ?? 0;
        toast({
          type: "success",
          title: remaining === 0 ? "Restock Completed!" : "Stock Received & Added",
          description: `+${receivedQty} units added to live stock! ${remaining > 0 ? `${remaining} units still in pipeline.` : "All units delivered."}`,
        });
        await fetchAdminData(restockTargetProduct.slug);
      } else {
        toast({
          type: "error",
          title: "Check-in Failed",
          description: data.error || "Could not check in received stock.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Check-in Error",
        description: err.message || "Failed to check in received stock.",
      });
    } finally {
      setIsProcessingRestockPipeline(false);
    }
  };

  // Restock Pipeline: Cancel Restock Process
  const handleCancelRestockProcess = async (sku: string) => {
    if (!restockTargetProduct) return;
    setIsProcessingRestockPipeline(true);
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "cancel-restock-process",
          variantSku: sku,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) setVariantGroups(data.product.variantGroups);
        if (data.product.childVariants) setChildVariants(data.product.childVariants);
        toast({
          type: "info",
          title: "Restock Pipeline Cancelled",
          description: `Cancelled restock process for SKU ${sku}.`,
        });
        await fetchAdminData(restockTargetProduct.slug);
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Cancel Error",
        description: err.message || "Failed to cancel restock pipeline.",
      });
    } finally {
      setIsProcessingRestockPipeline(false);
    }
  };

  // Category Selector in Product Creator Modal
  const handleCategorySelect = (catSlug: string) => {
    setNewProdCategory(catSlug);
    const cat = ECOMMERCE_CATEGORIES.find((c) => c.slug === catSlug);
    if (cat) {
      setNewProdSpecs([...cat.defaultSpecs]);
      const firstItem = cat.topSellingItems.split(",")[0].trim();
      setNewProdModel(firstItem.toUpperCase());
      setNewProdTagline(`Premium ${cat.name} engineered for exceptional durability, comfort and style.`);
      setNewProdDescription(`High-grade ${cat.name.toLowerCase()} manufactured with premium materials and rigorous quality testing.`);
    }
  };

  // Architecture & Colorway Studio Helpers for Dynamic Product Creation
  const handleNewProdAddArchitecture = () => {
    const nextNum = newProdArchitectures.length + 1;
    const nextId = `A${nextNum}`;
    setNewProdArchitectures((prev) => [
      ...prev,
      {
        id: nextId,
        name: `${nextId} (Edition ${nextNum})`,
        price: newProdPrice || 120,
        variantSpecs: [],
        colors: [
          {
            id: `color-${Date.now()}-1`,
            color: "Pitch Black",
            hex: "#1A1A1A",
            sku: `PROD-${nextId}-BLK`,
            stock: 5,
            price: newProdPrice || 120,
            images: ["/images/hero-graphite.jpg"],
          },
        ],
      },
    ]);
  };

  const handleNewProdRemoveArchitecture = (archIdx: number) => {
    if (newProdArchitectures.length <= 1) {
      toast({
        type: "error",
        title: "Architecture Required",
        description: "Product must have at least one architecture cut.",
      });
      return;
    }
    setNewProdArchitectures((prev) => prev.filter((_, idx) => idx !== archIdx));
  };

  const handleNewProdAddColor = (archIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const nextColorNum = arch.colors.length + 1;
      const archId = arch.id || `A${archIdx + 1}`;
      const defaultHex = nextColorNum === 2 ? "#ECECEC" : nextColorNum === 3 ? "#3B6978" : "#2563EB";
      const defaultName = nextColorNum === 2 ? "Arctic White" : nextColorNum === 3 ? "Mineral Blue" : `Color ${nextColorNum}`;

      arch.colors = [
        ...arch.colors,
        {
          id: `color-${Date.now()}-${nextColorNum}`,
          color: defaultName,
          hex: defaultHex,
          sku: `PROD-${archId}-${defaultName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || nextColorNum}`,
          stock: 5,
          price: arch.price || newProdPrice || 120,
          images: ["/images/hero-silver.jpg"],
        },
      ];
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdRemoveColor = (archIdx: number, colorIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      if (arch.colors.length <= 1) {
        toast({
          type: "error",
          title: "Color Required",
          description: "Architecture cut must have at least one colorway.",
        });
        return prev;
      }
      arch.colors = arch.colors.filter((_, idx) => idx !== colorIdx);
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateColor = (
    archIdx: number,
    colorIdx: number,
    field: "color" | "hex" | "sku" | "stock" | "price",
    value: any
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const colors = [...arch.colors];
      colors[colorIdx] = {
        ...colors[colorIdx],
        [field]: value,
      };
      arch.colors = colors;
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateArchitecture = (
    archIdx: number,
    field: "name" | "id" | "price",
    value: any
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      updated[archIdx] = {
        ...updated[archIdx],
        [field]: value,
      };
      return updated;
    });
  };

  // Spec Divergence / Override Handlers for Architecture Cuts
  const handleNewProdAddSpecOverride = (archIdx: number, specKey: string, defaultValue = "") => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const currentSpecs = arch.variantSpecs || [];
      if (currentSpecs.some((s) => s.key.toLowerCase() === specKey.toLowerCase())) {
        toast({
          type: "info",
          title: "Already Diverged",
          description: `"${specKey}" is already overridden in this architecture cut.`,
        });
        return prev;
      }
      const globalMatch = newProdSpecs.find((s) => s.key.toLowerCase() === specKey.toLowerCase());
      arch.variantSpecs = [
        ...currentSpecs,
        {
          key: specKey,
          value: defaultValue || globalMatch?.value || "Divergent Specification Value",
        },
      ];
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdRemoveSpecOverride = (archIdx: number, specIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      arch.variantSpecs = (arch.variantSpecs || []).filter((_, i) => i !== specIdx);
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateSpecOverride = (
    archIdx: number,
    specIdx: number,
    field: "key" | "value",
    val: string
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const specs = [...(arch.variantSpecs || [])];
      specs[specIdx] = { ...specs[specIdx], [field]: val };
      arch.variantSpecs = specs;
      updated[archIdx] = arch;
      return updated;
    });
  };

  // Load Example Product A Variant Structure (A1 & A2)
  const handleLoadProductAExample = () => {
    setNewProdCategory("apparel-fashion");
    setNewProdName("Product A - Studio Minimalist Hoodie");
    setNewProdSlug("product-a");
    setNewProdModel("ORGANIC HEAVYWEIGHT 450 GSM");
    setNewProdTagline("Ultra-dense combed cotton with tailored architectural cut.");
    setNewProdDescription("Crafted from 100% sustainable combed cotton. Features dual architectural cuts: A1 (Regular Fit) and A2 (Oversized Streetwear Fit).");
    setNewProdPrice(120);
    setNewProdOriginalPrice(145);
    setNewProdSpecs([
      { key: "Material / Fabric", value: "100% Organic Combed Ring-Spun Cotton" },
      { key: "Fabric Density", value: "450 GSM Heavyweight French Terry" },
      { key: "Fit Architecture", value: "A1 Regular Fit & A2 Streetwear Oversized Cut" },
      { key: "Care Instructions", value: "Cold wash inside out, lay flat to dry" },
      { key: "Origin", value: "Ethically milled and tailored in Portugal" },
    ]);
    setNewProdArchitectures([
      {
        id: "A1",
        name: "A1 (Regular Fit)",
        price: 120,
        variantSpecs: [{ key: "Fit Cut", value: "Regular Tailored Cut" }],
        colors: [
          { id: "c-a1-1", sku: "PROD-A1-GREEN", color: "Forest Green", hex: "#2E5339", stock: 5, price: 120, images: ["/images/lifestyle-workspace.jpg"] },
          { id: "c-a1-2", sku: "PROD-A1-BLACK", color: "Pitch Black", hex: "#1A1A1A", stock: 2, price: 120, images: ["/images/hero-graphite.jpg"] },
          { id: "c-a1-3", sku: "PROD-A1-BLUE", color: "Mineral Blue", hex: "#3B6978", stock: 4, price: 120, images: ["/images/hero-silver.jpg"] },
        ],
      },
      {
        id: "A2",
        name: "A2 (Oversized Fit)",
        price: 130,
        variantSpecs: [{ key: "Fit Cut", value: "Streetwear Oversized Drop Shoulder" }],
        colors: [
          { id: "c-a2-1", sku: "PROD-A2-WHITE", color: "Arctic White", hex: "#ECECEC", stock: 8, price: 130, images: ["/images/hero-sandstone.jpg"] },
          { id: "c-a2-2", sku: "PROD-A2-GREEN", color: "Forest Green", hex: "#2E5339", stock: 7, price: 130, images: ["/images/lifestyle-cafe.jpg"] },
        ],
      },
    ]);
    toast({
      type: "info",
      title: "Product A Architecture Loaded",
      description: "A1 {Green: 5, Black: 2, Blue: 4} & A2 {White: 8, Green: 7} loaded.",
    });
  };

  // Load Example Nova X1 Flagship Smartphone (Dual Architecture Spec Overrides)
  const handleLoadNovaSmartphoneExample = () => {
    setNewProdCategory("electronics-accessories");
    setNewProdName("Nova X1 Flagship Smartphone");
    setNewProdSlug("nova-x1-smartphone");
    setNewProdModel("X1 SERIES FLAGSHIP 5G");
    setNewProdTagline("Powerful smartphone built for all-day performance with dual display architectures.");
    setNewProdDescription("Nova X1 delivers flagship-grade Snapdragon 8 performance with dual architectural formats: A1 Large Display Edition (6.0\", 5500mAh, Gorilla Glass Victus) and A2 Compact Edition (5.5\", 4700mAh, Dragon Shield Glass).");
    setNewProdPrice(499);
    setNewProdOriginalPrice(599);
    setNewProdSpecs([
      { key: "Brand", value: "Nova" },
      { key: "Processor", value: "Snapdragon 8 Series" },
      { key: "RAM", value: "8GB LPDDR5X" },
      { key: "Storage", value: "128GB UFS 4.0" },
      { key: "Rear Camera", value: "50MP Main + 12MP Ultra-Wide" },
      { key: "Front Camera", value: "16MP HDR" },
      { key: "OS", value: "Android 16" },
      { key: "Fast Charging", value: "65W Wired Fast Charging" },
      { key: "Network", value: "5G Dual SIM + Wi-Fi 7" },
      { key: "Fingerprint", value: "Ultrasonic In-Display" },
      { key: "Water Resistance", value: "IP68 Certified" },
    ]);
    setNewProdArchitectures([
      {
        id: "A1",
        name: "Large Display Edition",
        price: 499,
        variantSpecs: [
          { key: "Display Size", value: "6.0 inch LTPO AMOLED" },
          { key: "Screen Protection", value: "Corning Gorilla Glass Victus" },
          { key: "Battery Capacity", value: "5500mAh Dual-Cell" },
          { key: "Weight", value: "210g" },
        ],
        colors: [
          { id: "c-a1-blk", sku: "NVX1-A1-BLK", color: "Midnight Black", hex: "#101010", stock: 35, price: 499, images: ["/images/hero-graphite.jpg"] },
          { id: "c-a1-blu", sku: "NVX1-A1-BLU", color: "Ocean Blue", hex: "#1565C0", stock: 22, price: 499, images: ["/images/hero-silver.jpg"] },
          { id: "c-a1-slv", sku: "NVX1-A1-SLV", color: "Titanium Silver", hex: "#C0C0C0", stock: 18, price: 519, images: ["/images/lifestyle-workspace.jpg"] },
        ],
      },
      {
        id: "A2",
        name: "Compact Edition",
        price: 449,
        variantSpecs: [
          { key: "Display Size", value: "5.5 inch Compact AMOLED" },
          { key: "Screen Protection", value: "Dragon Shield Glass" },
          { key: "Battery Capacity", value: "4700mAh High-Density" },
          { key: "Weight", value: "185g" },
        ],
        colors: [
          { id: "c-a2-grn", sku: "NVX1-A2-GRN", color: "Forest Green", hex: "#2E7D32", stock: 30, price: 449, images: ["/images/lifestyle-cafe.jpg"] },
          { id: "c-a2-wht", sku: "NVX1-A2-WHT", color: "Pearl White", hex: "#FAFAFA", stock: 16, price: 459, images: ["/images/hero-sandstone.jpg"] },
          { id: "c-a2-red", sku: "NVX1-A2-RED", color: "Crimson Red", hex: "#B71C1C", stock: 11, price: 469, images: ["/images/lifestyle-urban.jpg"] },
        ],
      },
    ]);
    toast({
      type: "info",
      title: "Nova X1 Smartphone Architecture Loaded",
      description: "A1 (6.0\" / 5500mAh Victus) & A2 (5.5\" / 4700mAh Dragon Shield) loaded with 132 units.",
    });
  };

  // Submit Dynamic New Product
  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast({ type: "error", title: "Product Title Required", description: "Please enter product name." });
      return;
    }

    const totalColorsCount = newProdArchitectures.reduce((sum, a) => sum + (a.colors?.length || 0), 0);
    if (totalColorsCount === 0) {
      toast({ type: "error", title: "Variant Required", description: "Product must have at least one colorway variant." });
      return;
    }

    setIsCreatingProduct(true);
    try {
      const selectedCategoryDef = ECOMMERCE_CATEGORIES.find((c) => c.slug === newProdCategory);
      const generatedSlug = (newProdSlug || newProdName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const globalSpecsRecord = newProdSpecs.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
        return acc;
      }, {} as Record<string, string>);

      // Map newProdArchitectures to IVariantGroup with variantSpecs
      const formattedVariantGroups: IVariantGroup[] = newProdArchitectures.map((arch) => {
        const variantSpecsRecord = (arch.variantSpecs || []).reduce((acc, curr) => {
          if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
          return acc;
        }, {} as Record<string, string>);

        return {
          id: arch.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: arch.name.trim() || `${arch.id} Architecture`,
          specOverride: arch.name.trim() || `${arch.id} Architecture`,
          variantSpecs: Object.keys(variantSpecsRecord).length > 0 ? variantSpecsRecord : undefined,
          price: Number(arch.price) || Number(newProdPrice) || 99,
          discount: 0,
          colors: arch.colors.map((c) => ({
            id: c.id,
            sku: c.sku.trim() || `PROD-${arch.id.toUpperCase()}-${c.color.replace(/[^a-z0-9]+/gi, "").toUpperCase()}`,
            color: c.color.trim() || "Standard",
            hex: c.hex || "#333333",
            stock: Number(c.stock) || 0,
            price: Number(c.price) || Number(arch.price) || Number(newProdPrice) || 99,
            images: c.images && c.images.length > 0 ? c.images : ["/images/hero-silver.jpg"],
          })),
        };
      });

      // Flatten to IVariant for childVariants
      const formattedChildVariants: IVariant[] = [];
      formattedVariantGroups.forEach((vg) => {
        vg.colors.forEach((c) => {
          formattedChildVariants.push({
            sku: c.sku,
            color: c.color,
            specOverride: vg.name,
            variantSpecs: vg.variantSpecs,
            price: c.price ?? vg.price ?? newProdPrice,
            discount: 0,
            stock: c.stock,
            images: c.images,
          });
        });
      });

      const formattedColorVariants = formattedChildVariants.map((v, i) => {
        const matchingHex = formattedVariantGroups
          .flatMap((g) => g.colors)
          .find((c) => c.sku === v.sku)?.hex || "#333333";
        return {
          id: (v.color || `color-${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: v.color || "Standard",
          hex: matchingHex,
          borderHex: "#111111",
          image: v.images?.[0] || "/images/hero-silver.jpg",
          images: v.images && v.images.length > 0 ? v.images : ["/images/hero-silver.jpg"],
          tag: String(i + 1).padStart(2, "0"),
        };
      });

      const totalMasterStock = formattedChildVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

      const payload = {
        name: newProdName.trim(),
        slug: generatedSlug,
        productId: `PROD-${generatedSlug.toUpperCase()}`,
        category: selectedCategoryDef?.name || "General Goods",
        categorySlug: newProdCategory,
        model: newProdModel.trim() || selectedCategoryDef?.topSellingItems?.split(",")[0] || "PREMIUM QUALITY",
        tagline: newProdTagline.trim() || "Engineered with precision and architectural beauty.",
        description: newProdDescription.trim() || "Authentic high-grade product designed for exceptional daily utility.",
        price: Number(newProdPrice) || 99,
        basePrice: Number(newProdPrice) || 99,
        priceInr: Math.round((Number(newProdPrice) || 99) * exchangeRate),
        originalPrice: Number(newProdOriginalPrice) || (Number(newProdPrice) || 99) * 1.25,
        type: selectedCategoryDef?.name || "Standard Goods",
        globalSpecs: globalSpecsRecord,
        stock: totalMasterStock,
        variantGroups: formattedVariantGroups,
        childVariants: formattedChildVariants,
        variants: formattedColorVariants,
      };

      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Product Created & Edge Synchronized!",
          description: `${data.product.name} created with ${data.product.childVariants?.length || 0} variants (${data.product.stock} total units).`,
        });
        setIsNewProductModalOpen(false);
        setSelectedSlug(data.product.slug);
        await fetchAdminData(data.product.slug);
      } else {
        toast({
          type: "error",
          title: "Creation Failed",
          description: data.error || "Unable to save new product.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Error",
        description: err.message || "Failed to create new product.",
      });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Quick Demo Buyer Verification
  const handleQuickDemoVerify = async () => {
    try {
      const res = await fetch("/api/reviews/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedSlug }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Demo Purchase Recorded",
          description: `Order ${data.orderNumber} placed for active user. Review form is now unlocked!`,
        });
        fetchAdminData();
      } else {
        toast({
          type: "error",
          title: "Verification Failed",
          description: data.error || "Please sign in to link demo purchase",
        });
      }
    } catch {
      toast({ type: "error", title: "Error", description: "Failed to create demo purchase" });
    }
  };

  // Fetch team members (Owner only)
  const fetchTeam = async (query = "") => {
    setIsSearchingTeam(true);
    try {
      const res = await fetch(`/api/admin/team?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setTeamUsers(data.users || []);
      } else {
        toast({ type: "error", title: "Team Query Failed", description: data.error });
      }
    } catch {
      toast({ type: "error", title: "Network Error", description: "Could not fetch team members" });
    } finally {
      setIsSearchingTeam(false);
    }
  };

  // Assign or Revoke Admin role (Owner only)
  const handleUpdateUserRole = async (targetEmail: string, newRole: "admin" | "user") => {
    setIsUpdatingRole(targetEmail);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: newRole === "admin" ? "Admin Access Granted" : "Admin Access Revoked",
          description: data.message,
        });
        fetchTeam(teamSearchQuery);
      } else {
        toast({ type: "error", title: "Update Failed", description: data.error });
      }
    } catch {
      toast({ type: "error", title: "Network Error", description: "Failed to update employee role" });
    } finally {
      setIsUpdatingRole(null);
    }
  };

  // Verify daily operations passcode
  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingPasscode(true);
    const result = await verifyDayPasscode(passcodeInput);
    setIsVerifyingPasscode(false);
    if (result.success) {
      toast({
        type: "success",
        title: "24-Hour Day-Token Active",
        description: "Operations passcode verified. Terminal unlocked for 24 hours.",
      });
      fetchAdminData();
      if (isOwner) fetchTeam();
    } else {
      toast({
        type: "error",
        title: "Passcode Rejected",
        description: result.error || "Invalid daily operations passcode.",
      });
    }
  };

  // Lock dashboard immediately
  const handleLock = async () => {
    await lockDashboard();
    toast({
      type: "info",
      title: "Session Locked",
      description: "24-hour day-token cleared. Passcode required to re-enter.",
    });
  };

  // Handle Dedicated Admin Portal Login & Registration
  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminAuthLoading(true);

    if (adminAuthTab === "signup") {
      if (!adminName.trim()) {
        toast({ type: "error", title: "Name Required", description: "Please enter your full name." });
        setIsAdminAuthLoading(false);
        return;
      }
      const res = await signup(adminEmail, adminPassword, adminName, adminRegistrationPasscode);
      setIsAdminAuthLoading(false);
      if (res.success) {
        toast({
          type: "success",
          title: "Admin Account Created",
          description: `Welcome, ${adminName}! Your staff account is authorized. Enter today's passcode to unlock.`,
        });
      } else {
        toast({
          type: "error",
          title: "Registration Failed",
          description: res.error || "Please verify your passcode and credentials.",
        });
      }
    } else {
      const res = await login(adminEmail, adminPassword);
      setIsAdminAuthLoading(false);
      if (res.success) {
        toast({
          type: "success",
          title: "Admin Authenticated",
          description: `Welcome back! Please enter today's 24-hour passcode to proceed.`,
        });
      } else {
        toast({
          type: "error",
          title: "Authentication Failed",
          description: res.error || "Invalid administrator credentials.",
        });
      }
    }
  };

  // Review Cancellation: Approve or Reject
  const handleReviewCancellation = async (
    orderNumber: string,
    decision: "approved" | "rejected",
    notes?: string
  ) => {
    setIsProcessingCancellation(orderNumber);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review-cancellation",
          orderNumber,
          decision,
          adminNotes: notes || (decision === "approved" ? "Approved by Admin" : "Declined by Admin"),
          reviewedBy: user?.name || "Alexander Vance (Admin)",
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        if (decision === "approved") {
          toast({
            type: "success",
            title: "Cancellation Approved",
            description: "Order marked as Cancelled. The 'Trigger Razorpay Refund' button is now active.",
          });
        } else {
          toast({
            type: "success",
            title: "Cancellation Declined",
            description: "The customer's cancellation request has been rejected.",
          });
        }
      } else {
        toast({
          type: "error",
          title: "Action Failed",
          description: data.error || "Could not review cancellation.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to communicate with order service.",
      });
    } finally {
      setIsProcessingCancellation(null);
    }
  };

  // Trigger Razorpay Refund
  const handleTriggerRefund = async (order: Order) => {
    setIsProcessingRefund(order.orderNumber);
    try {
      const res = await fetch("/api/razorpay/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          paymentId: order.razorpayPaymentId,
          amount: order.total,
          notes: "Cancellation approved by admin",
          actor: user?.name || "Alexander Vance (Admin)",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "success",
          title: "⚡ Razorpay Refund Initiated",
          description: `Refund initiated — amount ($${Number(order.total).toFixed(2)}) will be sent back to the customer's account in 2–7 business days. (Refund ID: ${data.refundId})`,
        });
      } else {
        toast({
          type: "error",
          title: "Refund Trigger Failed",
          description: data.error || "Unable to trigger Razorpay refund.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to connect to Razorpay refund gateway.",
      });
    } finally {
      setIsProcessingRefund(null);
    }
  };

  // Update Delivery Status, Hub, & Tracking
  const handleUpdateDelivery = async (orderNumber: string) => {
    const edits = orderDeliveryEdits[orderNumber];
    if (!edits) return;

    setOrderDeliveryEdits((prev) => ({
      ...prev,
      [orderNumber]: { ...prev[orderNumber], isSaving: true },
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-delivery",
          orderNumber,
          deliveryStatus: edits.deliveryStatus,
          currentHub: edits.currentHub,
          trackingNumber: edits.trackingNumber,
          note: edits.note,
          actor: user?.name || "Admin Logistics",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "success",
          title: "Logistics Updated",
          description: `Order #${orderNumber} delivery status and hub updated successfully.`,
        });
      } else {
        toast({
          type: "error",
          title: "Update Failed",
          description: data.error || "Could not update delivery status.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to update delivery logistics.",
      });
    } finally {
      setOrderDeliveryEdits((prev) => ({
        ...prev,
        [orderNumber]: { ...prev[orderNumber], isSaving: false },
      }));
    }
  };

  // Direct Quick Delivery Status Controller (Single-Click Lifecycle Progression)
  const handleQuickStatusUpdate = async (orderNumber: string, targetStatus: string, statusLabel: string) => {
    setOrderDeliveryEdits((prev) => ({
      ...prev,
      [orderNumber]: { ...prev[orderNumber], isSaving: true, savingStatus: targetStatus },
    }));

    try {
      const ord = orders.find((o) => o.orderNumber === orderNumber);
      const edits = orderDeliveryEdits[orderNumber];
      const mode = edits?.transitMode || ord?.transitMode || "van";
      const hub = ord?.currentHub || "Main Fulfillment Facility";

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-delivery",
          orderNumber,
          deliveryStatus: targetStatus,
          transitMode: mode,
          currentHub: hub,
          note: `Delivery lifecycle updated to ${statusLabel} via Quick Status Controller.`,
          actor: user?.name || "Admin Logistics",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "success",
          title: `Status: ${statusLabel}`,
          description: `Consignment #${orderNumber} marked as ${statusLabel}.`,
        });
      } else {
        toast({
          type: "error",
          title: "Update Failed",
          description: data.error || "Could not update delivery status.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to update delivery status.",
      });
    } finally {
      setOrderDeliveryEdits((prev) => ({
        ...prev,
        [orderNumber]: { ...prev[orderNumber], isSaving: false, savingStatus: undefined },
      }));
    }
  };

  // Add Custom Event / Audit Checkpoint Note
  const handleAddOrderEvent = async (orderNumber: string) => {
    const ev = orderNewEvent[orderNumber];
    if (!ev?.title?.trim()) {
      toast({
        type: "error",
        title: "Title Required",
        description: "Please provide a title for the event note.",
      });
      return;
    }

    setOrderNewEvent((prev) => ({
      ...prev,
      [orderNumber]: { ...prev[orderNumber], isAdding: true },
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-event",
          orderNumber,
          title: ev.title,
          description: ev.description || "Administrative checkpoint",
          type: "delivery",
          actor: user?.name || "Alexander Vance (Admin)",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        setOrderNewEvent((prev) => ({
          ...prev,
          [orderNumber]: { title: "", description: "", isAdding: false },
        }));
        toast({
          type: "success",
          title: "Event Logged",
          description: "New status event checkpoint appended to the audit timeline.",
        });
      } else {
        toast({
          type: "error",
          title: "Event Failed",
          description: data.error || "Could not add event note.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to log event note.",
      });
    } finally {
      setOrderNewEvent((prev) => ({
        ...prev,
        [orderNumber]: { ...prev[orderNumber], isAdding: false },
      }));
    }
  };

  // Sync selected order attributes to transit controller
  useEffect(() => {
    const selOrder = orders.find(
      (o) => o.orderNumber === deliverySelectedOrderId || o.id === deliverySelectedOrderId
    );
    if (selOrder) {
      if (selOrder.currentHub) setHubName(selOrder.currentHub);
      if (selOrder.currentRegion) setHubRegion(selOrder.currentRegion);
      if (selOrder.nextHub) setNextHubName(selOrder.nextHub);
      if (selOrder.nextRegion) setNextHubRegion(selOrder.nextRegion);
      if (selOrder.transitMode) setTransitMode(selOrder.transitMode as TransportMode);
      if (selOrder.vehicleNo) setVehicleNo(selOrder.vehicleNo);
      if (selOrder.containerId) setActiveContainerId(selOrder.containerId);
      if (selOrder.nextHubId) setTargetDestinationHubId(selOrder.nextHubId);
      if (selOrder.manifestVerified !== undefined) setManifestVerified(selOrder.manifestVerified);
      if (selOrder.deliveryStatus === "delivered") {
        setDeliveryGateStatus("delivered");
      } else if (selOrder.gateOtpSession?.verified) {
        setDeliveryGateStatus("otp_verified");
      } else if (selOrder.gateOtpSession?.active) {
        setDeliveryGateStatus("otp_sent");
        if (selOrder.gateOtpSession.otp) setGeneratedOtp(selOrder.gateOtpSession.otp);
      } else if (selOrder.deliveryStatus === "out_for_delivery") {
        setDeliveryGateStatus("gate_reached");
      } else {
        setDeliveryGateStatus("in_transit");
      }
    }
  }, [deliverySelectedOrderId, orders]);

  // Enterprise Hub Queue Transition Handler (Scan & Receive, Move to Sorting, Loading Bay, Outbound Dispatch, Deny Loading)
  const handleHubQueueAction = async (
    orderNumber: string,
    queueAction: "receive" | "to_sorting" | "to_loading" | "dispatch" | "container_dispatch" | "deny_loading",
    customDestHubId?: string,
    customTransitMode?: TransportMode,
    customVehicleNo?: string,
    customContainerId?: string,
    denialReason?: string
  ) => {
    const modeToUse = customTransitMode || transitMode;
    const containerToUse = customContainerId !== undefined ? customContainerId : activeContainerId;

    // Resolve active vehicle number based on the selected mode
    const resolvedRoadPlate = deliveryVehiclePlate.trim() || vehicleNo.trim();
    const resolvedVehicleNo =
      customVehicleNo ||
      (modeToUse === "train"
        ? (trainNumber.trim() ? `IR-${trainNumber.trim()}` : "IR-12302")
        : modeToUse === "plane"
        ? (flightNumber.trim() ? `FLT-${flightNumber.trim()}` : "FLT-6E-204")
        : modeToUse === "ship"
        ? (vesselName.trim() ? `${vesselName.trim()}${vesselImo.trim() ? ` [${vesselImo.trim()}]` : ""}` : "MV Ocean Carrier")
        : (resolvedRoadPlate || (modeToUse === "bike" ? "DL-01-BK-4092" : modeToUse === "van" ? "WB-02-VN-8812" : "DL-01-TRK-9000")));

    const [trainDate, trainTime] = trainDateTime.includes("T")
      ? trainDateTime.split("T")
      : [trainDateTime, "14:05"];

    const railFreightPayload: RailFreightDetails = {
      trainNumber: trainNumber.trim() || "12302",
      departureDate: trainDate || new Date().toISOString().split("T")[0],
      departureTime: trainTime || "14:05",
      trainName: trainNumber.trim() ? `Train #${trainNumber.trim()} Express` : "Indian Railways Express Freight",
      sourceStationCode: railSourceStation ? railSourceStation.split(" ")[0] : undefined,
      sourceStationName: railSourceStation.trim() || undefined,
      destinationStationCode: railDestStation ? railDestStation.split(" ")[0] : undefined,
      destinationStationName: railDestStation.trim() || undefined,
      arrivalTime: railArrivalTime.trim() || undefined,
      pwbNumber: railPwbNumber.trim() || undefined,
      parcelId: railParcelId.trim() || undefined,
      consignementGroupId: railConsignmentGroupId.trim() || undefined,
      freightScale: railFreightScale,
      spaceAllocationId: railSpaceAllocation,
      loadingManifestId: railLoadingManifestId.trim() || undefined,
    };

    const [flightDate, flightTime] = flightDateTime.includes("T")
      ? flightDateTime.split("T")
      : [flightDateTime, "09:30"];

    const airCargoPayload: AirCargoDetails = {
      flightNumber: flightNumber.trim() || "6E-204",
      flightDate: flightDate || new Date().toISOString().split("T")[0],
      departureTime: flightTime || "09:30",
      airline: "IndiGo Cargo",
      sourceAirportCode: airSourceAirport ? airSourceAirport.split(" ")[0] : undefined,
      sourceAirportName: airSourceAirport.trim() || undefined,
      destAirportCode: airDestAirport ? airDestAirport.split(" ")[0] : undefined,
      destAirportName: airDestAirport.trim() || undefined,
      awbNumber: airAwbNumber.trim() || undefined,
      uldId: airUldId.trim() || undefined,
      bayLocation: airBayLocation,
      flightManifestId: airFlightManifest.trim() || undefined,
    };

    const courierObj = COURIER_PROVIDERS_CATALOG.find((c) => c.id === courierProvider);
    const courierPayload: CourierServiceDetails = {
      provider: courierProvider,
      providerName: courierObj?.name || "ANC Custom Delivery (In-House Priority Fleet)",
      serviceType: courierProvider === "anc_custom" ? "same_day" : "air_express",
      trackingAwb: courierTrackingAwb.trim() || `ANC-LOG-${Math.floor(10000000 + Math.random() * 90000000)}`,
      riderName: courierRiderName.trim() || undefined,
      riderContact: courierRiderContact.trim() || undefined,
      estimatedDeliveryDays: 1,
    };

    const [shipDate, shipTime] = shipDateTime.includes("T")
      ? shipDateTime.split("T")
      : [shipDateTime, "06:00"];

    const oceanFreightPayload: OceanFreightDetails = {
      vesselName: vesselName.trim() || "MV Ocean Carrier",
      imoNumber: vesselImo.trim() || undefined,
      departureDate: shipDate || new Date().toISOString().split("T")[0],
      departureTime: shipTime || "06:00",
      containerId: shipContainerId.trim() || containerToUse || undefined,
      sealNumber: shipSealNumber.trim() || undefined,
      sourcePortCode: shipSourcePort ? shipSourcePort.split(" ")[0] : undefined,
      sourcePortName: shipSourcePort.trim() || undefined,
      destPortCode: shipDestPort ? shipDestPort.split(" ")[0] : undefined,
      destPortName: shipDestPort.trim() || undefined,
      voyageNumber: shipVoyageNumber.trim() || undefined,
      billOfLading: shipBillOfLading.trim() || undefined,
      shippingLine: shipShippingLine.trim() || undefined,
      berthLocation: shipBerthLocation.trim() || undefined,
      shippingManifestId: shipManifestId.trim() || undefined,
    };

    const targetOrderForLocal = orders.find((o) => o.orderNumber === orderNumber);
    const localDeliveryPayload: LocalDeliveryDetails = {
      vehicleType: (modeToUse === "bike" || modeToUse === "van" || modeToUse === "truck") ? modeToUse : "van",
      vehicleNumber: resolvedVehicleNo,
      packageId: orderNumber,
      deliveryAddress: targetOrderForLocal ? `${targetOrderForLocal.customer.address}, ${targetOrderForLocal.customer.city}, ${targetOrderForLocal.customer.state} ${targetOrderForLocal.customer.zipCode}` : "Customer Doorstep Address",
      customerContact: targetOrderForLocal?.customer?.contact || targetOrderForLocal?.customer?.email || "+91 81055 42318",
      driverName: deliveryDriverName.trim() || undefined,
      driverContact: deliveryDriverContact.trim() || undefined,
      deliverySlot: deliverySlot || "Afternoon Window (14:00 - 18:00)",
      runSheetId: deliveryRunSheetId.trim() || undefined,
    };

    setHubActionLoading(orderNumber);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hub-queue-action",
          orderNumber,
          hubId: activeHubId,
          queueAction,
          transitMode: modeToUse,
          vehicleNo: resolvedVehicleNo,
          containerId: modeToUse === "train" ? (trainNumber.trim() ? `TRN-${trainNumber.trim()}-${trainDate}` : "TRN-RAIL-01") : modeToUse === "plane" ? (airUldId.trim() || "AKE-AIR-01") : modeToUse === "ship" ? (shipContainerId.trim() || "MSKU-982104") : containerToUse,
          destinationHubId: customDestHubId || targetDestinationHubId,
          manifestVerified,
          dispatchCategory: (modeToUse === "train" || modeToUse === "plane" || modeToUse === "ship") ? "b2b_bulk_freight" : "b2c_individual_courier",
          railFreight: modeToUse === "train" ? railFreightPayload : undefined,
          airCargo: modeToUse === "plane" ? airCargoPayload : undefined,
          oceanFreight: modeToUse === "ship" ? oceanFreightPayload : undefined,
          localDelivery: (modeToUse === "bike" || modeToUse === "van" || modeToUse === "truck") ? localDeliveryPayload : undefined,
          courierService: (modeToUse === "van" || modeToUse === "bike") ? courierPayload : undefined,
          isDestinationClose: perOrderAddressClose[orderNumber] ?? isAddressCloseToHub,
          denialReason,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        const actionLabels: Record<string, string> = {
          receive: "Dock Scanned & Received",
          to_sorting: "Staged in Sorting Dock",
          to_loading: (perOrderAddressClose[orderNumber] ?? isAddressCloseToHub) ? "Sorted for Doorstep Loading" : "Sorted & Moved to Vehicle Loading Bay",
          dispatch: (perOrderAddressClose[orderNumber] ?? isAddressCloseToHub) ? "Out for Delivery [Arrives Afternoon/Evening]" : "Marked Loaded & Dispatched [On The Way]",
          container_dispatch: "Container Dispatched",
          deny_loading: "Loading Denied ➔ Returned to Sorting Dock",
        };

        if (queueAction === "deny_loading") {
          setHubTab("sorting");
          toast({
            type: "info",
            title: "Loading Denied ➔ Returned to Sorting",
            description: `Consignment ${orderNumber} reverted to Sorting Dock for re-labeling and destination correction.`,
          });
        } else {
          toast({
            type: "success",
            title: actionLabels[queueAction] || "Hub Operation Complete",
            description: `Consignment ${orderNumber} updated at ${hubQueue.hub.name}.`,
          });
        }
      } else {
        toast({
          type: "error",
          title: "Operation Failed",
          description: data.error || "Could not update package status.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err?.message || "Failed to contact logistics server.",
      });
    } finally {
      setHubActionLoading(null);
    }
  };

  const handleGateExceptionRto = async (
    orderNumber: string,
    reason: "damaged_package" | "customer_out_of_station" | "customer_refused",
    reasonNote = ""
  ) => {
    setIsSubmittingGateException(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gate-exception-rto",
          orderNumber,
          reason,
          reasonNote,
          carrierRider: courierRiderName || "Doorstep Courier Specialist",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "info",
          title: "Gate Refusal Logged ➔ RTO Initiated",
          description: `Consignment ${orderNumber} reverse logistics triggered back to origin warehouse.`,
        });
        setHubTab("rto");
      } else {
        toast({
          type: "error",
          title: "Failed to Record Rejection",
          description: data.error || "Could not log gate exception.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err?.message || "Failed to contact logistics server.",
      });
    } finally {
      setIsSubmittingGateException(false);
    }
  };

  const handleRtoHubAction = async (orderNumber: string, rtoSubAction: string, notes = "") => {
    setRtoActionLoading(orderNumber);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rto-hub-action",
          orderNumber,
          rtoSubAction,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "success",
          title: "RTO Lifecycle Advanced",
          description: `Consignment ${orderNumber} updated in reverse logistics pipeline.`,
        });
      } else {
        toast({
          type: "error",
          title: "RTO Action Failed",
          description: data.error || "Could not advance RTO status.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err?.message || "Failed to contact logistics server.",
      });
    } finally {
      setRtoActionLoading(null);
    }
  };

  const handleScanWaybill = () => {
    const term = waybillScanInput.trim().toUpperCase();
    if (!term) return;
    const match = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === term ||
        o.trackingNumber?.toUpperCase() === term ||
        o.id.toUpperCase() === term
    );
    if (match) {
      setDeliverySelectedOrderId(match.orderNumber);
      toast({
        type: "success",
        title: "Consignment Located",
        description: `Waybill ${match.orderNumber} located. Current location: ${match.currentHub}.`,
      });
      if (match.currentHubId) {
        setActiveHubId(match.currentHubId);
      }
      if (match.deliveryStatus === "out_for_delivery") {
        setHubTab("gate");
      } else if (match.hubQueueStatus === "received") {
        setHubTab("received");
      } else if (match.hubQueueStatus === "sorting") {
        setHubTab("sorting");
      } else if (match.hubQueueStatus === "loading") {
        setHubTab("loading");
      } else if (match.hubQueueStatus === "outgoing") {
        setHubTab("outgoing");
      } else {
        setHubTab("incoming");
      }
    } else {
      toast({
        type: "error",
        title: "Waybill Not Found",
        description: `No active package matches "${term}".`,
      });
    }
  };

  // 5-Minute Alive OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deliveryGateStatus === "otp_sent" && deliveryOtpRemainingSeconds > 0) {
      timer = setInterval(() => {
        setDeliveryOtpRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [deliveryGateStatus, deliveryOtpRemainingSeconds]);

  // Transit Hub Inbound & Outbound Split Action Handler
  const handleLogAction = async (type: "arrival" | "dispatch") => {
    setIsTransitLogging(true);
    const actionLabel = type === "arrival" ? "Inbound Arrival" : "Outbound Dispatch";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log-transit-action",
          orderNumber: deliverySelectedOrderId,
          type,
          transitMode,
          vehicleNo,
          hubName,
          hubRegion,
          manifestVerified,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        toast({
          type: "success",
          title: `${actionLabel} Logged`,
          description: `Consignment ${deliverySelectedOrderId} · ${hubName} (${hubRegion}) via ${transitMode.toUpperCase()} [${vehicleNo || "STANDARD"}]. Security: ${manifestVerified ? "Manifest Verified" : "Unverified Hold"}.`,
        });
      } else {
        toast({
          type: "info",
          title: `${actionLabel} Recorded`,
          description: `Consignment ${deliverySelectedOrderId} route updated via ${transitMode.toUpperCase()} [${vehicleNo || "STANDARD"}].`,
        });
      }
    } catch {
      toast({
        type: "info",
        title: `${actionLabel} Logged (Local)`,
        description: `Consignment ${deliverySelectedOrderId} transit action recorded.`,
      });
    } finally {
      setTimeout(() => setIsTransitLogging(false), 600);
    }
  };

  // Doorstep Gate Arrival & 5-Min Alive OTP Trigger (No OTP leaked in popup!)
  const handleTriggerGateOtp = async () => {
    setOtpTriggered(true);
    setDeliveryGateStatus("otp_sent");
    setDeliveryOtpRemainingSeconds(300);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger-gate-otp",
          orderNumber: deliverySelectedOrderId,
          hubName,
          hubRegion,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
      }
      toast({
        type: "success",
        title: "5-Min Alive OTP Dispatched",
        description: `Secure 6-digit verification code sent to customer email. Dynamic 5-minute alive window active.`,
      });
    } catch (err) {
      console.warn("Gate OTP sync notice:", err);
      toast({
        type: "error",
        title: "OTP Dispatch Error",
        description: "Failed to dispatch OTP to customer email.",
      });
    } finally {
      setTimeout(() => setOtpTriggered(false), 3000);
    }
  };

  // Doorstep Gate OTP Verification (Authoritative API check, works globally & locally)
  const handleVerifyGateOtp = async () => {
    const code = deliveryOtpValue.trim();
    if (!code || code.length !== 6) {
      toast({
        type: "error",
        title: "Invalid OTP Format",
        description: "Please enter the complete 6-digit code provided by the customer.",
      });
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-gate-otp",
          orderNumber: deliverySelectedOrderId,
          otp: code,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        setDeliveryGateStatus("otp_verified");
        toast({
          type: "success",
          title: "OTP Verified ✓",
          description: "Customer code verified. 2 mandatory Proof of Delivery photos (<10MB) required to finalize handover.",
        });
      } else {
        toast({
          type: "error",
          title: "Invalid OTP",
          description: data.error || "The entered code does not match customer OTP.",
        });
      }
    } catch (err) {
      console.warn("Verify OTP sync error:", err);
      toast({
        type: "error",
        title: "Verification Error",
        description: "Failed to communicate with authentication gateway.",
      });
    }
  };

  // Forceful Proof of Delivery (PoD) Image Submission (2 Images Under 10 MB)
  const handleFinalizePod = async () => {
    if (!labelProof?.dataUrl || !productProof?.dataUrl) {
      toast({
        type: "error",
        title: "Missing Proof Images",
        description: "Both 2 images are strictly mandatory: (1) Shipping Label sticker with name/barcode, and (2) Physical sealed box condition.",
      });
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (labelProof.size > MAX_SIZE || productProof.size > MAX_SIZE) {
      toast({
        type: "error",
        title: "File Too Large",
        description: "One or more images exceed 10 MB. Please take or choose images under 10 MB.",
      });
      return;
    }

    setIsFinalizingPod(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize-doorstep-pod",
          orderNumber: deliverySelectedOrderId,
          labelImage: labelProof.dataUrl,
          productImage: productProof.dataUrl,
          labelImageName: labelProof.name,
          productImageName: productProof.name,
          labelImageSize: labelProof.size,
          productImageSize: productProof.size,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === data.order.orderNumber ? data.order : o))
        );
        setDeliveryGateStatus("delivered");
        toast({
          type: "success",
          title: "Delivery Handover Complete ✓",
          description: `Consignment ${deliverySelectedOrderId} finalized. Proof photos archived in S3 proof vault. Warranty activated.`,
        });
      } else {
        toast({
          type: "error",
          title: "Submission Error",
          description: data.error || "Could not finalize doorstep proof.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Network Error",
        description: err?.message || "Failed to submit delivery proof.",
      });
    } finally {
      setIsFinalizingPod(false);
    }
  };

  const handlePoDImageSelect = (
    type: "label" | "product",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        type: "error",
        title: "Image Over 10 MB",
        description: `Selected file is ${(file.size / 1024 / 1024).toFixed(2)} MB. Must be under 10 MB limit.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        file,
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size,
      };
      if (type === "label") {
        setLabelProof(payload);
        toast({
          type: "success",
          title: "Shipping Label Image Added ✓",
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) ready for upload.`,
        });
      } else {
        setProductProof(payload);
        toast({
          type: "success",
          title: "Product Box Image Added ✓",
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) ready for upload.`,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">
            Verifying cryptographic token & authorization...
          </p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In Screen - Dedicated Admin Operations Gateway
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Terminal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Operations Console</span>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full uppercase font-bold">
                    Admin
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Restricted Staff & Owner Terminal</p>
              </div>
            </div>
          </div>

          {/* Admin Mode Switcher: Sign In vs Register Admin */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl text-xs font-semibold border border-zinc-800">
            <button
              type="button"
              onClick={() => setAdminAuthTab("signin")}
              className={`py-2 rounded-lg transition-all ${adminAuthTab === "signin"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
                }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => setAdminAuthTab("signup")}
              className={`py-2 rounded-lg transition-all ${adminAuthTab === "signup"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
                }`}
            >
              Register Admin
            </button>
          </div>

          {/* Quick 1-Click Presets for Administrator Access */}
          {adminAuthTab === "signin" && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
                Authorized Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail("owner@ancwave.com");
                    setAdminPassword("ownerpassword123");
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Owner Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail("admin@ancwave.com");
                    setAdminPassword("adminpassword123");
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[11px] font-semibold hover:bg-blue-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Admin Form */}
          <form onSubmit={handleAdminAuthSubmit} className="space-y-3.5">
            {adminAuthTab === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Himesh Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Staff Email Address</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="staff@ancwave.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Staff Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {adminAuthTab === "signup" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Master Operations Passcode</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminRegistrationPasscode("ancwave-ops-secure-2026")}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline"
                  >
                    Paste Default
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={adminRegistrationPasscode}
                  onChange={(e) => setAdminRegistrationPasscode(e.target.value)}
                  placeholder="Enter DAILY_ADMIN_PASSCODE..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-sm text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-400">
                  Required to register authorized admin accounts on the live server.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAdminAuthLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isAdminAuthLoading
                  ? "Verifying Credentials..."
                  : adminAuthTab === "signup"
                    ? "Register Admin & Authorize"
                    : "Sign In to Terminal"}
              </span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Logged In but Not Owner/Admin Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-lg w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Access Restricted</h2>
            <p className="text-xs text-zinc-400">
              Logged in as <span className="text-white font-mono">{user.email}</span> with role{" "}
              <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                {user.role}
              </span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs text-zinc-300">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Staff Authorization Required:</span>
            </div>
            <div className="space-y-2.5 text-[11px] leading-relaxed text-zinc-400">
              <p>
                This terminal is reserved for Owners and Administrators. Customer accounts cannot access live stock adjustments, pricing variation engines, or edge invalidation controls.
              </p>
              <p>
                To access this console, log out and sign in with your staff account or register as an admin using your master operations passcode.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => refreshUser()}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Role</span>
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all text-center"
            >
              Log Out & Sign In as Admin
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated as Owner or Admin, but Day-Token Not Verified Screen
  if (!isDayTokenVerified) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">
                  24-Hour Security Gate
                </h2>
                <p className="text-[11px] text-zinc-400">Daily Operations Passcode Required</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${isOwner
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                }`}
            >
              {user.role}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-zinc-300">
              Welcome back, <strong className="text-white">{user.name}</strong>.
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              To guarantee operational security, Owner and Admin accounts must enter today&apos;s operations passcode (<code className="text-emerald-400 font-mono">DAILY_ADMIN_PASSCODE</code>) to obtain a 24-hour session day-token.
            </p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Daily Passcode</label>
                <button
                  type="button"
                  onClick={() => setPasscodeInput("ancwave-ops-secure-2026")}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline"
                >
                  Paste Default
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter daily passcode..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPasscode ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock 24h Dashboard Session</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800">
            <button
              onClick={logout}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign Out
            </button>
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-950 font-sans flex flex-col">
      {/* 1. TOP MINIMALIST COMMERCE OS NAVBAR */}
      <header className="h-14 border-b border-zinc-200/80 bg-white sticky top-0 z-40 px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Left: ancwave Brand & Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:bg-zinc-800 transition-colors">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-zinc-950 font-sans leading-none">ancwave</span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Admin Controller</span>
            </div>
          </Link>
          <span className="text-zinc-200 hidden sm:inline">|</span>
          <span className="text-xs font-medium text-zinc-500 hidden sm:inline">E-Commerce OS</span>
        </div>

        {/* Center: Global Search Bar [ ⌘ K ] */}
        <div className="hidden md:flex items-center gap-2 relative max-w-sm w-full mx-4">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearchInput}
            onChange={(e) => setGlobalSearchInput(e.target.value)}
            placeholder="Search products, orders, SKUs... [ ⌘ K ]"
            className="w-full pl-9 pr-12 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-white border border-zinc-200 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls: User Profile Pill, Storefront Scope, Wipe ISR, Lock, Store Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/80 border border-zinc-200/80 text-xs">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user?.name?.[0] || "A"}
            </div>
            <span className="font-semibold text-zinc-800 text-xs hidden sm:inline">
              {user?.name || "Admin"}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-600 text-white rounded uppercase font-mono">
              {isOwner ? "OWNER" : "ADMIN"}
            </span>
          </div>

          <span className="text-zinc-300 hidden sm:inline">→</span>

          {/* Storefront Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Store Live [US · IN]</span>
          </div>

          {/* Wipe ISR Cache Button */}
          <button
            onClick={handlePurgeAndRevalidate}
            disabled={isRevalidating}
            className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            title="Purge Next.js On-Demand ISR Edge Cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">{isRevalidating ? "Purging..." : "Wipe ISR"}</span>
          </button>

          {/* Session Lock Button */}
          <button
            onClick={handleLock}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
            title="Lock Dashboard Session"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          {/* Link to Storefront */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN WORKSPACE */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 bg-white border-r border-zinc-200/80 p-3 space-y-6 shrink-0 hidden md:block">
          {/* Group 1: STORE OVERVIEW */}
          <div className="space-y-1">
            <div className="text-[14px] font-mono uppercase tracking-widest text-zinc-400 font-bold px-2.5 py-1">
              STORE OVERVIEW
            </div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "dashboard"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Commerce Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "orders"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders & Buying</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono font-bold">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("delivery")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "delivery"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <Truck className="w-4 h-4" />
              <span>Delivery & Hubs</span>
            </button>
          </div>

          {/* Group 2: CATALOG & INVENTORY */}
          <div className="space-y-1">
            <div className="text-[14px] font-mono uppercase tracking-widest text-zinc-400 font-bold px-2.5 py-1">
              CATALOG & INVENTORY
            </div>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "inventory"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4" />
                <span>Products & Stock</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono font-bold">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("variation-engine")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "variation-engine"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Variation Engine</span>
            </button>

            <button
              onClick={() => setActiveTab("shipping")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "shipping"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <Tag className="w-4 h-4" />
              <span>Shipping Fixtures</span>
            </button>
          </div>

          {/* Group 3: COMMUNITY & ACCESS */}
          <div className="space-y-1">
            <div className="text-[14px] font-mono uppercase tracking-widest text-zinc-400 font-bold px-2.5 py-1">
              COMMUNITY & ACCESS
            </div>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "reviews"
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Customer Reviews</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono font-bold">
                {reviews.length}
              </span>
            </button>

            {isOwner && (
              <button
                onClick={() => {
                  setActiveTab("team");
                  fetchTeam(teamSearchQuery);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "team"
                  ? "bg-amber-50 text-amber-800 font-bold shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span>Staff & Roles</span>
              </button>
            )}
          </div>

          {/* Bottom Action: Create Product Button */}
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            <button
              type="button"
              onClick={() => setIsNewProductModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2 px-3 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Catalog Item</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto bg-[#F8F9FA]">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Storefront</Link>
            <span>›</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px] font-semibold">
              Admin
            </span>
            <span>›</span>
            <span className="text-zinc-900 font-semibold">
              {activeTab === "dashboard" && "Commerce Overview"}
              {activeTab === "inventory" && "Products & Stock Inventory"}
              {activeTab === "orders" && "Customer Orders & Buying"}
              {activeTab === "variation-engine" && "Variation Engine & Specs"}
              {activeTab === "shipping" && "Shipping Rates & Fixtures"}
              {activeTab === "delivery" && "Delivery Logistics & Hubs"}
              {activeTab === "reviews" && "Customer Reviews & Moderation"}
              {activeTab === "team" && "Staff Access & Roles"}
            </span>
          </div>

          {/* Store Controller Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 font-sans">
                  Store Operations Controller
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Storefront · US & India
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Real-time catalog inventory, order fulfillment, multi-currency fixtures, and field gate delivery.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Catalog Scope:</span>
                <select
                  value={selectedSlug}
                  onChange={(e) => {
                    setSelectedSlug(e.target.value);
                    fetchAdminData(e.target.value);
                  }}
                  className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Models ({products.length} Products)</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 5-Column High-Density KPI Metric Row */}
          {(() => {
            const totalRevenueUsd = orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
            const totalRevenueInr = Math.round(totalRevenueUsd * exchangeRate);
            const totalUnitsOnHand = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
            const paidOrdersCount = orders.filter((o) => (o.paymentStatus || "").toLowerCase() === "paid").length;
            const dispatchedCount = orders.filter((o) => o.awsEventBridgeDispatched).length;
            const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length;
            const avgRating = reviews.length > 0
              ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
              : "4.9";

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. GROSS REVENUE (GMV) */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    <span>GROSS REVENUE (GMV)</span>
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
                    ${totalRevenueUsd.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    ≈ ₹{totalRevenueInr.toLocaleString("en-IN")} Confirmed
                  </div>
                </div>

                {/* 2. ORDER FULFILLMENT */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    <span>ORDER FULFILLMENT</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950">
                    {paidOrdersCount} / {orders.length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    {orders.length === 0 ? "0 Orders Captured" : `${paidOrdersCount} Paid · ${dispatchedCount} Dispatched`}
                  </div>
                </div>

                {/* 3. INVENTORY ON HAND */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    <span>INVENTORY ON HAND</span>
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950">
                    {totalUnitsOnHand} <span className="text-xs font-normal text-zinc-400">units</span>
                  </div>
                  <div className={`text-[11px] font-medium ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {lowStockCount > 0 ? `⚠️ ${lowStockCount} Low Stock Model${lowStockCount > 1 ? "s" : ""}` : "All Models in Stock"}
                  </div>
                </div>

                {/* 4. ACTIVE PRODUCTS */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    <span>MASTER MODELS</span>
                    <Grid className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950">
                    {products.length} Models
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Active across US & India
                  </div>
                </div>

                {/* 5. REVIEWS & RATINGS */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    <span>CUSTOMER RATING</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950 flex items-center gap-1">
                    <span>{avgRating}</span>
                    <span className="text-amber-500 text-sm">★</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {reviews.length} Verified Buyer Reviews
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sub-Tab Navigation Strip */}
          <div className="flex items-center gap-2 border-b border-zinc-200/80 overflow-x-auto text-xs font-semibold pb-px">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "dashboard"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Commerce Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "orders"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Customer Orders</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "inventory"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Inventory</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("variation-engine")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "variation-engine"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Variation Engine</span>
            </button>

            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "shipping"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Tag className="w-4 h-4" />
              <span>Shipping Fixtures</span>
            </button>

            <button
              onClick={() => setActiveTab("delivery")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "delivery"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Truck className="w-4 h-4" />
              <span>Delivery & Hubs</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "reviews"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>Customer Reviews</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-mono">
                {reviews.length}
              </span>
            </button>

            {isOwner && (
              <button
                onClick={() => {
                  setActiveTab("team");
                  fetchTeam(teamSearchQuery);
                }}
                className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "team"
                  ? "border-amber-600 text-amber-600 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
                  }`}
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span>Staff & Roles</span>
              </button>
            )}
          </div>

          {/* TAB 0: EXEC DASHBOARD & ENTERPRISE PORTFOLIO ROLLUP matching Screenshot 2 */}
          {/* TAB 0: COMMERCE OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Quick Action Buttons Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 text-xs font-semibold shadow-2xs transition-all hover:border-zinc-300 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>New Product Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => product && openRestockModal(product)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 text-xs font-semibold shadow-2xs transition-all hover:border-zinc-300 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4 text-blue-600" />
                  <span>Variant Restock Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 text-xs font-semibold shadow-2xs transition-all hover:border-zinc-300 cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>Shipping Fixtures</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("delivery")}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 text-xs font-semibold shadow-2xs transition-all hover:border-zinc-300 cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Hub Logistics & OTP</span>
                </button>
              </div>

              {/* Product Catalog & Live Stock Status Table */}
              <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 font-sans">
                      Product Catalog & Live Stock Status
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Real-time unit allocation, low stock monitoring, and master SKUs across active catalog models.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Inventory ({products.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-mono text-[11px]">
                        <th className="p-2 font-normal">PRODUCT & MASTER SKU</th>
                        <th className="p-2 font-normal">CATEGORY</th>
                        <th className="p-2 font-normal">PRICE (USD / INR)</th>
                        <th className="p-2 font-normal">STOCK ON HAND</th>
                        <th className="p-2 font-normal">VARIANTS</th>
                        <th className="p-2 font-normal">STATUS</th>
                        <th className="p-2 font-normal text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-zinc-400">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-700">No products published in ancwaveDB</span>
                              <p className="text-xs text-zinc-500 max-w-sm">Your database is in a clean raw state. Click &quot;New Product Item&quot; above to create and publish your first product.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {products.map((p) => {
                        const stockNum = Number(p.stock) || 0;
                        const stockPercent = Math.min(100, Math.round((stockNum / 40) * 100));
                        const isSelected = p.slug === selectedSlug;
                        const variantCount = (p.childVariants && p.childVariants.length) || 1;

                        // Check for active restock pipeline on this product or any child variants
                        const activeVariantRestocks = (p.childVariants || []).filter(
                          (cv) => cv.restockProcess && cv.restockProcess.status !== "completed"
                        );
                        const rootRestock = p.restockProcess && p.restockProcess.status !== "completed" ? p.restockProcess : null;
                        const totalRemainingRestock = activeVariantRestocks.reduce((sum, cv) => sum + (cv.restockProcess?.remainingQty || 0), 0) + (rootRestock?.remainingQty || 0);
                        const totalTargetRestock = activeVariantRestocks.reduce((sum, cv) => sum + (cv.restockProcess?.targetQty || 0), 0) + (rootRestock?.targetQty || 0);
                        const totalReceivedRestock = activeVariantRestocks.reduce((sum, cv) => sum + (cv.restockProcess?.receivedQty || 0), 0) + (rootRestock?.receivedQty || 0);
                        const hasPipelineRestock = totalRemainingRestock > 0;

                        return (
                          <tr key={p.slug} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="p-2 font-sans font-bold text-zinc-900">
                              <div>{p.name}</div>
                              <div className="text-[11px] font-mono text-zinc-400 font-normal">
                                SKU: {p.productId || p.sku || p.slug}
                              </div>
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-medium">
                                {p.category || "Audio & Wear"}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-zinc-800 text-xs">
                              <div className="font-bold">${(Number(p.price) || 0).toFixed(2)}</div>
                              <div className="text-[10px] text-zinc-400">≈ ₹{Math.round((Number(p.price) || 0) * exchangeRate).toLocaleString("en-IN")}</div>
                            </td>
                            <td className="p-2 min-w-[170px]">
                              {hasPipelineRestock ? (
                                (() => {
                                  const totalUnits = stockNum + totalRemainingRestock;
                                  const greenPercent = totalUnits > 0 ? (stockNum / totalUnits) * 100 : 0;
                                  const yellowPercent = totalUnits > 0 ? (totalRemainingRestock / totalUnits) * 100 : 0;

                                  return (
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[11px] font-mono">
                                        <span className="font-bold text-emerald-700">
                                          {stockNum} on-hand
                                        </span>
                                        <span className="font-bold text-amber-700 text-[10px]">
                                          +{totalRemainingRestock} in process
                                        </span>
                                      </div>
                                      {/* Dual Green & Yellow Track Bar */}
                                      <div className="w-full bg-zinc-200/80 rounded-full h-2 overflow-hidden flex shadow-inner">
                                        <div
                                          className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                                          style={{ width: `${greenPercent}%` }}
                                          title={`On-hand: ${stockNum} units (${greenPercent.toFixed(0)}%)`}
                                        />
                                        <div
                                          className="h-full bg-amber-400 rounded-r-full transition-all duration-300 relative overflow-hidden"
                                          style={{ width: `${yellowPercent}%` }}
                                          title={`Restock in process: ${totalRemainingRestock} units (${yellowPercent.toFixed(0)}%)`}
                                        >
                                          <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                        </div>
                                      </div>
                                      <div className="text-[9px] text-zinc-400 font-mono flex items-center justify-between">
                                        <span>Pipeline: {totalReceivedRestock}/{totalTargetRestock}</span>
                                        <span className="text-amber-700 font-semibold">{totalTargetRestock > 0 ? Math.round((totalReceivedRestock / totalTargetRestock) * 100) : 0}%</span>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono">
                                    <span className={`font-bold ${stockNum <= 5 ? "text-amber-600" : "text-zinc-800"}`}>
                                      {stockNum} units
                                    </span>
                                    <span className="text-zinc-400">{stockPercent}%</span>
                                  </div>
                                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${stockNum <= 5 ? "bg-amber-500" : "bg-emerald-600"
                                        }`}
                                      style={{ width: `${Math.max(5, stockPercent)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-semibold">
                                {variantCount} {variantCount === 1 ? "Option" : "Variants"}
                              </span>
                            </td>
                            <td className="p-2">
                              {hasPipelineRestock ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-300 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                                  Restock: {totalTargetRestock > 0 ? Math.round((totalReceivedRestock / totalTargetRestock) * 100) : 0}%
                                </span>
                              ) : stockNum <= 5 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/60">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right space-x-2">
                              <button
                                onClick={() => openRestockModal(p)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors cursor-pointer"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSlug(p.slug);
                                  fetchAdminData(p.slug);
                                  setActiveTab("inventory");
                                }}
                                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                              >
                                {isSelected ? "Active" : "Inspect"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Customer Orders Table */}
              <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 font-sans">
                      Recent Customer Orders & Buying Details
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Live audit of completed customer checkouts, items purchased, totals, and delivery statuses.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Orders ({orders.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-50/70 rounded-xl border border-dashed border-zinc-200">
                    <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-700">No customer orders placed yet</p>
                    <p className="text-zinc-400 mt-0.5">As soon as customers checkout on the store, purchases will appear here in real time.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-100 text-zinc-400 font-mono text-[11px]">
                          <th className="py-2.5 font-normal">ORDER ID</th>
                          <th className="py-2.5 font-normal">CUSTOMER</th>
                          <th className="py-2.5 font-normal">ITEMS</th>
                          <th className="py-2.5 font-normal">AMOUNT (USD / INR)</th>
                          <th className="py-2.5 font-normal">PAYMENT</th>
                          <th className="py-2.5 font-normal">DELIVERY STATUS</th>
                          <th className="py-2.5 font-normal">DATE</th>
                          <th className="py-2.5 font-normal text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {orders.slice(0, 5).map((ord) => {
                          const orderTotal = Number(ord.total) || 0;
                          const totalInr = Math.round(orderTotal * exchangeRate);
                          const itemsSummary = Array.isArray(ord.items)
                            ? ord.items.map((i: any) => `${i.quantity || 1}x ${i.name || "Product"}`).join(", ")
                            : "Items";

                          return (
                            <tr key={ord.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="py-3.5 font-mono font-bold text-zinc-900">
                                #{ord.orderNumber || ord.id.slice(0, 8)}
                              </td>
                              <td className="py-3.5 font-sans">
                                <div className="font-bold text-zinc-900">{ord.customer?.fullName || "Guest Customer"}</div>
                                <div className="text-[11px] text-zinc-400 font-mono">{ord.customer?.email || ord.customer?.city || "—"}</div>
                              </td>
                              <td className="py-3.5 max-w-[200px] truncate text-zinc-600 font-medium" title={itemsSummary}>
                                {itemsSummary}
                              </td>
                              <td className="py-3.5 font-mono">
                                <div className="font-bold text-zinc-900">${orderTotal.toFixed(2)}</div>
                                <div className="text-[10px] text-zinc-400">≈ ₹{totalInr.toLocaleString("en-IN")}</div>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${(ord.paymentStatus || "").toLowerCase() === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  }`}>
                                  {ord.paymentStatus === "paid" ? "Paid" : "Pending"}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ord.awsEventBridgeDispatched
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                                  }`}>
                                  {ord.awsEventBridgeDispatched ? "Dispatched" : "Processing"}
                                </span>
                              </td>
                              <td className="py-3.5 text-zinc-400 font-mono text-[11px]">
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => setActiveTab("orders")}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Cross-Store Operations Telemetry & Quick Action Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Telemetry Card */}
                <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950 font-sans">
                        Multi-Variant Stock Allocation
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Direct colorway and architecture quantity assignment
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {childVariants.length} Active Colorways
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <PackagePlus className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-blue-950">Multi-Variant Restock Studio</h5>
                        <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                          Allocate inventory directly to individual architectures (A1, A2) and colorways without master limit errors.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => product && openRestockModal(product)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>Launch Multi-Variant Restock Studio</span>
                    </button>
                  </div>
                </div>

                {/* Right Telemetry Card */}
                <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950 font-sans">
                        Global Shipping & Currency Fixtures
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Checkout delivery pricing across US & India storefronts
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Live Rates
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 font-medium">Standard US Shipping:</span>
                      <strong className="font-mono text-zinc-900">
                        {generalDeliveryPriceUsd === 0 ? "Free ($0.00)" : `$${generalDeliveryPriceUsd.toFixed(2)}`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 font-medium">Standard India Shipping:</span>
                      <strong className="font-mono text-zinc-900">
                        {generalDeliveryPriceInr === 0 ? "Free (₹0)" : `₹${generalDeliveryPriceInr}`}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("shipping")}
                      className="w-full py-2 px-3 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Configure Shipping Method Pricing Fixtures →
                    </button>
                  </div>
                </div>
              </div>

              {/* AWS Serverless EventBridge & Lambda Live Monitor Card */}
              <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-950 font-sans">
                          AWS EventBridge & Lambda Serverless Engine
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active · ap-south-1
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Real-time order event ingestion via <code>ancwave-event-bus</code> and edge cache invalidation via <code>ancwave-order-processor</code>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAwsTest}
                    disabled={isTestingAws}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingAws ? "animate-spin" : ""}`} />
                    <span>{isTestingAws ? "Invoking AWS Pipeline..." : "⚡ Send Live Test Event"}</span>
                  </button>
                </div>

                {/* Infrastructure Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Custom Event Bus</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-[13px]">ancwave-event-bus</div>
                    <div className="text-[11px] text-zinc-400">Retention: 1 Day · Active</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">EventBridge Subscriber</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-[13px] truncate" title="ancwave-order-processor-subscriber">
                      order-processor-subscriber
                    </div>
                    <div className="text-[11px] text-zinc-400">Target: Lambda Function</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Lambda Worker</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-[13px]">ancwave-order-processor</div>
                    <div className="text-[11px] text-zinc-400">Node.js 24.x · 15s Timeout</div>
                  </div>
                </div>

                {/* Live Test Execution Result Display */}
                {awsTestResult && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Live Pipeline Test Result: Status 200 (Success)</span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-800 font-semibold">
                        Latency: {awsTestResult.lambda?.durationMs}ms
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-emerald-900">
                      <div>Event ID: <span className="font-bold">{awsTestResult.eventBridge?.eventId}</span></div>
                      <div>Lambda Status: <span className="font-bold">{awsTestResult.lambda?.statusCode === 200 ? "SUCCESS (200 OK)" : "COMPLETED"}</span></div>
                    </div>
                  </div>
                )}

                {/* Direct Deep Links to AWS Console */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="text-zinc-400 font-medium text-[11px]">Inspect Live in AWS Console:</span>
                  <a
                    href="https://ap-south-1.console.aws.amazon.com/events/home?region=ap-south-1#/eventbus/ancwave-event-bus"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors text-[11px]"
                  >
                    <span>Amazon EventBridge Bus</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                  <a
                    href="https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fancwave-order-processor"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors text-[11px]"
                  >
                    <span>CloudWatch Lambda Logs</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                  <a
                    href="https://ap-south-1.console.aws.amazon.com/lambda/home?region=ap-south-1#/functions/ancwave-order-processor?tab=monitoring"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors text-[11px]"
                  >
                    <span>Lambda Monitoring & Invocations</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PRODUCTS & INVENTORY ORCHESTRATION */}
          {activeTab === "inventory" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {!product && products.length === 0 ? (
                <div className="rounded-3xl bg-white border border-zinc-200 p-12 text-center max-w-xl mx-auto space-y-4 my-8 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900">No Products in Inventory</h3>
                    <p className="text-xs text-zinc-500">ancwaveDB currently has 0 product documents. Create your first product item to begin managing architectures, colors, stock, and pricing.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewProductModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Product Item</span>
                  </button>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Variant-Aware Restock & Alert Center */}
                <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                        {product?.category || "Apparel & Tech"}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans mt-1">
                        {product?.name || "Active Product"} Restock
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Total Inventory: <strong className="font-mono text-zinc-950 text-sm">{product?.stock || 0} units</strong> across {childVariants.length} variants
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-zinc-400">SKU:</span>
                      <div className="text-xs font-mono font-bold text-zinc-800">{product?.productId || product?.sku}</div>
                    </div>
                  </div>

                  {/* Primary Restock Button that opens the Dedicated Variant Popup */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <PackagePlus className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-blue-950">
                          Multi-Variant Restock Studio
                        </h4>
                        <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                          Restock individual architectures (A1, A2) and colorways without ambiguity. Never increment a blind master number.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => product && openRestockModal(product)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>+ Restock Variants & Colors (Popup)</span>
                    </button>
                  </div>

                  {/* Visual Architecture & Colorway Summary */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                      Current Architecture & Color Allocations:
                    </span>
                    <div className="space-y-1.5">
                      {(variantGroups && variantGroups.length > 0 ? variantGroups : childVariantsToVariantGroups(childVariants)).map((g, gIdx) => (
                        <div key={g.id || gIdx} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-900 font-mono">
                            <span className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold font-mono shrink-0">
                                {g.id.length <= 4 ? g.id : `Arch 0${gIdx + 1}`}
                              </span>
                              <span>{g.name}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-normal">
                              {(g.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0)} units total
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(g.colors || []).map((c) => (
                              <span
                                key={c.sku}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-800 font-mono"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: c.hex || "#333" }}
                                />
                                <span>{c.color}</span>
                                <span className="bg-zinc-100 px-1.5 py-0.2 rounded font-bold text-blue-600">
                                  {c.stock}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flash Sale, Discount & ISR Edge Settings */}
                  <form onSubmit={handleUpdateInventory} className="space-y-4 pt-3 border-t border-zinc-100">
                    {/* Real-Time Price & USD ⇄ INR Currency Converter */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-zinc-50 to-zinc-50 border border-blue-100/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                            ₹/$
                          </div>
                          <span className="text-xs font-bold text-zinc-950 font-sans">
                            Live Price & Currency Converter
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                          1 USD ≈ ₹{exchangeRate}
                        </span>
                      </div>

                      {/* Dual Currency Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                            <span>Price (USD $)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={quickPriceInput}
                              onChange={(e) => {
                                const usd = Number(e.target.value);
                                setQuickPriceInput(usd);
                                setMasterBasePrice(usd);
                                if (autoCascadePrice) {
                                  const inr = Math.round(usd * exchangeRate);
                                  setVariantGroups((prev) =>
                                    prev.map((g) => ({
                                      ...g,
                                      price: usd,
                                      priceInr: inr,
                                      colors: g.colors.map((c) => ({ ...c, price: usd, priceInr: inr })),
                                    }))
                                  );
                                }
                              }}
                              className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-zinc-900 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                            <span>Price (INR ₹)</span>
                            <span className="text-[9px] text-blue-600 font-mono">(Razorpay)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={
                                quickPriceInput === 0
                                  ? 0
                                  : quickPriceInput < 1
                                    ? Number((quickPriceInput * exchangeRate).toFixed(2))
                                    : Math.round(quickPriceInput * exchangeRate)
                              }
                              onChange={(e) => {
                                const inr = Number(e.target.value);
                                const usd = Number((inr / exchangeRate).toFixed(2));
                                setQuickPriceInput(usd);
                                setMasterBasePrice(usd);
                                if (autoCascadePrice) {
                                  setVariantGroups((prev) =>
                                    prev.map((g) => ({
                                      ...g,
                                      price: usd,
                                      priceInr: inr,
                                      colors: g.colors.map((c) => ({ ...c, price: usd, priceInr: inr })),
                                    }))
                                  );
                                }
                              }}
                              className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-blue-900 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Razorpay Testing Presets */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                          ⚡ Quick Test Presets (Razorpay):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[1, 5, 10, 50].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleQuickRazorpayTestPreset(amt)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                              title={`Set price to ₹${amt} for Razorpay live checkout testing`}
                            >
                              ₹{amt} Test
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setQuickPriceInput(349);
                              setMasterBasePrice(349);
                              handleCascadePriceToAllVariants(349, Math.round(349 * exchangeRate));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono font-bold transition-all shadow-2xs cursor-pointer"
                            title="Reset to default $349"
                          >
                            Reset ($349)
                          </button>
                        </div>
                      </div>

                      {/* Auto-cascade Toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="autoCascadeQuick"
                          checked={autoCascadePrice}
                          onChange={(e) => setAutoCascadePrice(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="autoCascadeQuick" className="text-[11px] text-zinc-600 cursor-pointer">
                          Cascade price change to all variant colors automatically
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">
                          Instant Discount ($ Off)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="150"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50 font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">
                          REVALIDATE_SECRET
                        </label>
                        <input
                          type="text"
                          value={revalidateSecret}
                          onChange={(e) => setRevalidateSecret(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 bg-zinc-50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <input
                        type="checkbox"
                        id="flashSaleToggle"
                        checked={isFlashSale}
                        onChange={(e) => setIsFlashSale(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <label htmlFor="flashSaleToggle" className="text-xs font-medium text-zinc-700 cursor-pointer">
                        Enable "🔥 Few Left" Flash Alert when stock &le; 5 units
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUpdating ? "Purging Edge Cache..." : "Save Discount & Edge Rules"}</span>
                    </button>
                  </form>
                </div>

                {/* Right: Architecture & Colorway Real-Time Inventory Control */}
                <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">
                        Architecture & Colorway Inventory
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Independent colorway counters organized by architecture cut (A1, A2).
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("variation-engine")}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Manage Engine &rarr;
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(variantGroups && variantGroups.length > 0 ? variantGroups : childVariantsToVariantGroups(childVariants)).map((g, gIdx) => {
                      const groupUnits = (g.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0);
                      return (
                        <div
                          key={g.id || gIdx}
                          className="rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden shadow-2xs space-y-3 p-4 transition-all"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold font-mono shrink-0 whitespace-nowrap">
                                {g.id.length <= 4 ? g.id : `Arch 0${gIdx + 1}`}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 font-sans">
                                {g.name}
                              </span>
                              <span className="text-[10px] font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                {(g.colors || []).length} {(g.colors || []).length === 1 ? "color" : "colors"}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-zinc-800">
                              Total Units: <span className="text-blue-600 font-bold">{groupUnits}</span>
                            </span>
                          </div>

                          {/* Colors in this Architecture */}
                          <div className="space-y-2">
                            {(g.colors || []).map((c) => (
                              <div
                                key={c.sku}
                                className="p-3 rounded-xl bg-white border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                      style={{ backgroundColor: c.hex || "#333" }}
                                    />
                                    <span className="text-xs font-bold text-zinc-900">{c.color}</span>
                                    <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                                      {c.sku}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 font-mono">
                                    ${Number(c.price || g.price || product?.price || 0).toFixed(2)} · {c.stock} units in stock
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickVariantStock(c.sku, Math.max(0, c.stock - 1))}
                                    className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center font-mono font-bold text-xs text-zinc-900">
                                    {c.stock}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickVariantStock(c.sku, c.stock + 1)}
                                    className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono ${c.stock === 0
                                      ? "bg-red-100 text-red-700"
                                      : c.stock <= 5
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                      }`}
                                  >
                                    {c.stock === 0 ? "SOLD OUT" : c.stock <= 5 ? "LOW STOCK" : "IN STOCK"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Inline Quick Add Color to this Architecture */}
                          <div className="pt-2 border-t border-zinc-200/60 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add Color (e.g. Heather Grey)"
                              id={`quick-add-color-${g.id}`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 focus:outline-none"
                            />
                            <input
                              type="number"
                              min="0"
                              defaultValue={5}
                              id={`quick-add-stock-${g.id}`}
                              className="w-14 px-2 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-mono font-bold text-center text-zinc-800 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nameInput = document.getElementById(`quick-add-color-${g.id}`) as HTMLInputElement;
                                const stockInputEl = document.getElementById(`quick-add-stock-${g.id}`) as HTMLInputElement;
                                const colorName = nameInput?.value?.trim();
                                const initialStock = parseInt(stockInputEl?.value) || 5;
                                if (!colorName) return;
                                handleAddColorToArchitecture(g.id, colorName, initialStock);
                                if (nameInput) nameInput.value = "";
                              }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Color</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CloudFront / ISR Information */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-zinc-600 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Edge ISR & EventBridge Synchronization</span>
                    </div>
                    <p>
                      Every inventory mutation triggers an AWS EventBridge <code>StockUpdated</code> event and issues Next.js on-demand ISR revalidation via <code>revalidatePath</code>, ensuring subsequent visitors hit zero-latency CloudFront edge caches.
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Category Inventory & Product Catalog Hub */}
              <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Grid className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                        Multi-Category Inventory Hub ({products.length} Products)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Manage stock allocations, architectures, and variants across 10 top-selling e-commerce categories
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNewProductModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Product</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-mono">
                        <th className="py-2.5 px-3 font-normal">PRODUCT & ROOT SKU</th>
                        <th className="py-2.5 px-3 font-normal">CATEGORY</th>
                        <th className="py-2.5 px-3 font-normal">RETAIL PRICE</th>
                        <th className="py-2.5 px-3 font-normal">TOTAL STOCK</th>
                        <th className="py-2.5 px-3 font-normal">VARIANTS & ARCHITECTURES</th>
                        <th className="py-2.5 px-3 font-normal text-right">RESTOCK ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {products.map((p) => {
                        const isSelected = p.slug === selectedSlug;
                        const hasLowStock = p.stock <= (p.lowStockThreshold || 5);
                        const isSoldOut = p.stock === 0;

                        return (
                          <tr
                            key={p.slug}
                            className={`hover:bg-zinc-50/80 transition-colors ${isSelected ? "bg-blue-50/30" : ""
                              }`}
                          >
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-900">{p.name}</span>
                                  {isSelected && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400">
                                  {p.productId || p.sku} · {p.model}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {p.category || p.categorySlug}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-xs">
                              <div className="font-bold text-zinc-900">${(Number(p.price) || 0).toFixed(2)}</div>
                              <div className="text-[10px] text-zinc-400">₹{p.priceInr || Math.round(p.price * exchangeRate)}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-zinc-950">{p.stock} units</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${isSoldOut
                                    ? "bg-red-100 text-red-700"
                                    : hasLowStock
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                    }`}
                                >
                                  {isSoldOut ? "SOLD OUT" : hasLowStock ? "LOW" : "HEALTHY"}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1.5 max-w-sm">
                                {(() => {
                                  const groups = p.variantGroups && p.variantGroups.length > 0
                                    ? p.variantGroups
                                    : p.childVariants && p.childVariants.length > 0
                                      ? childVariantsToVariantGroups(p.childVariants)
                                      : [];
                                  if (groups.length === 0) {
                                    return (
                                      <div className="flex flex-wrap gap-1">
                                        {(p.variants || []).map((v, vIdx) => (
                                          <span
                                            key={`${p.slug || p.id}-var-${v.id || v.name || vIdx}-${vIdx}`}
                                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
                                          >
                                            {v.name}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return groups.map((vg, vgIdx) => {
                                    const archBadge = vg.id?.length <= 4 ? vg.id : `Arch 0${vgIdx + 1}`;
                                    return (
                                      <div key={vg.id || `vg-${vgIdx}`} className="flex flex-wrap items-center gap-1.5">
                                        <span
                                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 shrink-0"
                                          title={vg.name}
                                        >
                                          {archBadge}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {(vg.colors || []).map((c, cIdx) => (
                                            <span
                                              key={`${vg.id || vgIdx}-${c.sku || c.color || cIdx}-${cIdx}`}
                                              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-zinc-700 border border-zinc-200 shadow-2xs"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.hex || "#666" }} />
                                              <span>{c.color}</span>
                                              <span className="font-bold text-blue-600">({c.stock})</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openRestockModal(p)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-2xs"
                                  title="Open Dedicated Variant Restock Popup"
                                >
                                  <PackagePlus className="w-3 h-3" />
                                  <span>+ Restock</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlug(p.slug);
                                    fetchAdminData(p.slug);
                                    setActiveTab("variation-engine");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                                  title="Edit in Variation Engine"
                                >
                                  Edit
                                </button>

                                <Link
                                  href={`/products/${p.slug}`}
                                  target="_blank"
                                  className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                                  title="View on Storefront"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* TAB 2: GLOBAL SHIPPING METHOD PRICING FIXTURES */}
          {activeTab === "shipping" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-950 font-sans flex items-center gap-2">
                        <span>Shipping Method Pricing Fixtures</span>
                        <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                          Global Checkout Rates
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Direct option of pricing from 0 (Free Delivery) to any amount. Dynamic rates will be calculated later; currently provides direct fixtures in USD and INR.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneralDeliveryPriceUsd(0);
                        setGeneralDeliveryPriceInr(0);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold font-mono transition-colors cursor-pointer"
                      title="Set general delivery to ₹0 / $0 for live testing"
                    >
                      ⚡ Set General Delivery to Free (₹0)
                    </button>

                    <button
                      type="button"
                      disabled={isSavingShipping}
                      onClick={handleSaveShippingFixtures}
                      className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingShipping ? "Saving..." : "Save Shipping Pricing"}</span>
                    </button>
                  </div>
                </div>

                {/* Two Pricing Cards: General Delivery & Express Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Method 1: General Delivery */}
                  <div className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                          Standard Shipping
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 mt-0.5">
                          General Delivery (Tracked Courier)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700">
                        3–5 Days
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      Applied when customer selects Standard Delivery. Set to 0 for Free Delivery during tests or promotions.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Price (USD $)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={generalDeliveryPriceUsd}
                            onChange={(e) => handleGeneralPriceChangeUSD(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Price (INR ₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={generalDeliveryPriceInr}
                            onChange={(e) => handleGeneralPriceChangeINR(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-blue-200 rounded-xl text-blue-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Method 2: Express Delivery */}
                  <div className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                          Expedited Shipping
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 mt-0.5">
                          Priority Express Dispatch
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        1–2 Days
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      Applied when customer selects Priority Express Dispatch. Can be set to 0 or any custom surcharge.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Price (USD $)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={expressDeliveryPriceUsd}
                            onChange={(e) => handleExpressPriceChangeUSD(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Price (INR ₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={expressDeliveryPriceInr}
                            onChange={(e) => handleExpressPriceChangeINR(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-blue-200 rounded-xl text-blue-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DELIVERY HUBS & DOORSTEP GATE VERIFICATION */}
          {activeTab === "delivery" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Station Header & Hub Selector Card */}
              <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold font-sans tracking-tight text-zinc-100">
                          Enterprise Hub Logistics & Destination Queue Console
                        </h2>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                          Auto-Route Engine Live
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        High-scale multi-hub routing. Direct incoming dock check-ins, sorting bag consolidation, outbound fleet dispatches, and doorstep gate handovers.
                      </p>
                    </div>
                  </div>

                  {/* Active Station Status Indicator */}
                  <div className={`flex items-center gap-2.5 p-2.5 px-3 rounded-2xl shrink-0 backdrop-blur-sm shadow-sm border transition-all ${
                    isCentralPackingActive
                      ? "bg-amber-950/40 border-amber-500/50 shadow-amber-500/10"
                      : "bg-zinc-900/90 border-purple-500/30"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${
                        isCentralPackingActive ? "bg-amber-400" : "bg-emerald-400"
                      }`} />
                      <span className="text-zinc-400">Current Station:</span>
                      <span className={`font-mono font-bold px-2.5 py-1 rounded-xl border ${
                        isCentralPackingActive
                          ? "text-amber-200 bg-amber-950/70 border-amber-500/40"
                          : "text-white bg-zinc-950 border-zinc-700/80"
                      }`}>
                        {activeHubStats.hub.code} · {activeHubStats.hub.name}
                      </span>
                      {isCentralPackingActive && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ORIGIN PACKING
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                        isCentralPackingActive
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      }`}>
                        <span>{activeHubStats.sum5} ops</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-300 font-mono">{activeHubStats.formattedArray}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* CENTRAL PACKING STATION CONTROL UNIT (ORIGIN FULFILLMENT CENTER) - JUST ABOVE ACTIVE HUB DIRECTORY */}
                <div
                  onClick={() => setActiveHubId("STOCK-CTR-01")}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isCentralPackingActive
                      ? "bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-zinc-950 border-amber-500/70 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40"
                      : "bg-zinc-900/70 border-amber-500/30 hover:border-amber-400/60 hover:bg-zinc-900/90 shadow-md"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Origin Identity & Mission */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        isCentralPackingActive
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20"
                          : "bg-zinc-900 text-amber-400/80 border-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-500/40"
                      }`}>
                        <Boxes className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                            STK · ORIGIN FULFILLMENT STATION
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-zinc-100 font-sans tracking-tight">
                            Central Packing Station (Central Stock & Fulfillment Depot)
                          </h3>
                          {isCentralPackingActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              CURRENT ACTIVE CONSOLE
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Click to Open Station
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 max-w-3xl">
                          National Central Inventory Depot (Nagpur Zero-Mile) · Receives newly placed customer orders, performs quality inspection, tamper-proof packaging, barcode tagging, and dispatches 1st leg multi-modal transit rake/flight/truck.
                        </p>
                      </div>
                    </div>

                    {/* Right: Respective Work Indication & Direct Open Button */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
                      {/* Real-time Work Indication (5 Origin Operations) */}
                      <div className="bg-zinc-950/90 border border-zinc-800 p-2 px-3 rounded-2xl flex items-center gap-2 text-xs font-mono">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Work Indication</span>
                          <span className="font-bold text-amber-300 text-xs">
                            {centralPackingStats.sum5} Active Ops
                          </span>
                        </div>
                        <div className="h-7 w-px bg-zinc-800 mx-1" />
                        <div className="flex items-center gap-2 text-[11px]">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-zinc-500">1.Pack</span>
                            <span className={`font-bold ${centralPackingStats.inCount > 0 ? "text-blue-400" : "text-zinc-600"}`}>
                              {centralPackingStats.inCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-zinc-500">2.Recv</span>
                            <span className={`font-bold ${centralPackingStats.recCount > 0 ? "text-emerald-400" : "text-zinc-600"}`}>
                              {centralPackingStats.recCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-zinc-500">3.Sort</span>
                            <span className={`font-bold ${centralPackingStats.sortCount > 0 ? "text-amber-400" : "text-zinc-600"}`}>
                              {centralPackingStats.sortCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-zinc-500">4.Load</span>
                            <span className={`font-bold ${centralPackingStats.loadCount > 0 ? "text-cyan-400" : "text-zinc-600"}`}>
                              {centralPackingStats.loadCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-zinc-500">5.Out</span>
                            <span className={`font-bold ${centralPackingStats.outCount > 0 ? "text-purple-400" : "text-zinc-600"}`}>
                              {centralPackingStats.outCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Button */}
                      {isCentralPackingActive ? (
                        <span className="px-4 py-2 rounded-2xl bg-amber-500/20 text-amber-200 border border-amber-500/50 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>Station Active Below</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHubId("STOCK-CTR-01");
                          }}
                          className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                        >
                          <Boxes className="w-4 h-4" />
                          <span>Open Central Packing Station</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Hub Network Operations Table (Just Below Heading) */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                      <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
                        Active Hub Operational Directory
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {hubsList.length} Stations Connected
                      </span>
                      {hubsList.some((h) => h.isDynamic) && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          ⚡ {hubsList.filter((h) => h.isDynamic).length} Dynamic
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterHubModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Discover / Add Dynamic Hub</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-inner">
                    <table className="w-full text-left text-xs font-mono border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Hub</th>
                          <th className="py-2.5 px-3">Facility Name & Region</th>
                          <th className="py-2.5 px-3">Coverage Area & Strategic Role</th>
                          <th className="py-2.5 px-3 text-center">Sum (5 Ops)</th>
                          <th className="py-2.5 px-2 text-center text-blue-400">1. In</th>
                          <th className="py-2.5 px-2 text-center text-emerald-400">2. Recv</th>
                          <th className="py-2.5 px-2 text-center text-amber-400">3. Sort</th>
                          <th className="py-2.5 px-2 text-center text-cyan-400">4. Load</th>
                          <th className="py-2.5 px-2 text-center text-purple-400">5. Out</th>
                          <th className="py-2.5 px-2 text-center text-pink-400">6. Gate</th>
                          <th className="py-2.5 px-3 text-center">Vector [1-6]</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {allHubsQueueStats.map(({ hub: h, sum5, inCount, recCount, sortCount, loadCount, outCount, gateCount, formattedArray }) => {
                          const isActive = h.id === activeHubId;
                          const isOriginHub = h.type === "origin" || h.id === "STOCK-CTR-01" || h.id === "STK-CTR-01";
                          return (
                            <tr
                              key={h.id}
                              onClick={() => setActiveHubId(h.id)}
                              className={`transition-all cursor-pointer group ${
                                isActive
                                  ? isOriginHub
                                    ? "bg-amber-950/30 hover:bg-amber-950/40 border-l-4 border-l-amber-500"
                                    : "bg-purple-950/30 hover:bg-purple-950/40 border-l-4 border-l-purple-500"
                                  : isOriginHub
                                  ? "bg-amber-950/10 hover:bg-amber-950/20 border-l-4 border-l-amber-500/40"
                                  : "hover:bg-zinc-900/60 border-l-4 border-l-transparent"
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                {isActive ? (
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                                    isOriginHub
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                      : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                      isOriginHub ? "bg-amber-400" : "bg-purple-400"
                                    }`} />
                                    {isOriginHub ? "ACTIVE ORIGIN" : "ACTIVE"}
                                  </span>
                                ) : isOriginHub ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    📦 ORIGIN
                                  </span>
                                ) : h.isDynamic ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                    ⚡ DYNAMIC
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
                                    READY
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white group-hover:text-purple-300 transition-colors">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
                                  {h.code}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                                <div className="text-xs text-zinc-100 font-semibold">{h.name}</div>
                                <div className="text-[10px] font-mono text-zinc-400">{h.region} · {h.country}</div>
                              </td>
                              <td className="py-2.5 px-3 font-sans max-w-[280px]">
                                <div className="text-[11px] text-zinc-200 font-semibold truncate" title={h.coverageArea || h.strategicRole}>
                                  {h.coverageArea || "Strategic logistics corridor"}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono truncate" title={h.strategicRole}>
                                  {h.strategicRole || "Regional distribution node"}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                                    sum5 > 0
                                      ? "bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm"
                                      : "text-zinc-500 bg-zinc-900/60 border border-zinc-800"
                                  }`}
                                >
                                  {sum5} ops
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${inCount > 0 ? "text-blue-400 font-bold" : "text-zinc-600"}`}>
                                  {inCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${recCount > 0 ? "text-emerald-400 font-bold" : "text-zinc-600"}`}>
                                  {recCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${sortCount > 0 ? "text-amber-400 font-bold" : "text-zinc-600"}`}>
                                  {sortCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${loadCount > 0 ? "text-cyan-400 font-bold" : "text-zinc-600"}`}>
                                  {loadCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${outCount > 0 ? "text-purple-400 font-bold" : "text-zinc-600"}`}>
                                  {outCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`font-semibold ${gateCount > 0 ? "text-pink-400 font-bold" : "text-zinc-600"}`}>
                                  {gateCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                    sum5 > 0 || gateCount > 0
                                      ? "bg-zinc-900 text-purple-300 border border-purple-500/30 font-bold"
                                      : "text-zinc-600"
                                  }`}
                                >
                                  {formattedArray}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isActive ? (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                                      isOriginHub
                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                        : "text-purple-400 bg-purple-500/10 border-purple-500/30"
                                    }`}>
                                      Current
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHubId(h.id);
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border ${
                                        isOriginHub
                                          ? "bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-zinc-950 border-amber-500/40"
                                          : "bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white border-zinc-700 hover:border-purple-500"
                                      }`}
                                    >
                                      {isOriginHub ? "Open Origin" : "Select"}
                                    </button>
                                  )}
                                  {h.isDynamic && (
                                    <button
                                      type="button"
                                      title="Decommission Dynamic Hub"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDynamicHub(h.id, h.name);
                                      }}
                                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Hub Operational KPI Strip: 7 Real-World Queues (Forward Logistics + Gate Delivery + RTO Returns) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setHubTab("incoming")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "incoming"
                      ? isCentralPackingActive
                        ? "bg-amber-600/20 border-amber-500/60 shadow-lg shadow-amber-600/10"
                        : "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>{isCentralPackingActive ? "1. PACKAGING / QC" : "1. INCOMING"}</span>
                      <ArrowDownLeft className={`w-3.5 h-3.5 ${isCentralPackingActive ? "text-amber-400" : "text-blue-400"}`} />
                    </div>
                    <div className={`text-xl font-bold font-mono ${isCentralPackingActive ? "text-amber-300" : "text-white"}`}>
                      {hubQueue.totals.incoming}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {isCentralPackingActive ? "Awaiting packaging" : "En route to dock"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubTab("received")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "received"
                      ? isCentralPackingActive
                        ? "bg-amber-600/20 border-amber-500/60 shadow-lg shadow-amber-600/10"
                        : "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>{isCentralPackingActive ? "2. PACKED AT DOCK" : "2. RECEIVED"}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      {hubQueue.totals.received}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {isCentralPackingActive ? "Sealed & verified" : "Scanned at dock"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubTab("sorting")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "sorting"
                      ? isCentralPackingActive
                        ? "bg-amber-600/20 border-amber-500/60 shadow-lg shadow-amber-600/10"
                        : "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>{isCentralPackingActive ? "3. ORIGIN SORT" : "3. SORTING"}</span>
                      <Boxes className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {hubQueue.totals.sorting}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {isCentralPackingActive ? "Assign 1st hub" : "Fleet routing bay"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubTab("loading")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "loading"
                      ? isCentralPackingActive
                        ? "bg-amber-600/20 border-amber-500/60 shadow-lg shadow-amber-600/10"
                        : "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>{isCentralPackingActive ? "4. TRUNK LOAD" : "4. LOADING"}</span>
                      <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-400">
                      {hubQueue.totals.loading}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {isCentralPackingActive ? "Long-haul bay" : "Vehicle bay staging"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubTab("outgoing")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "outgoing"
                      ? isCentralPackingActive
                        ? "bg-amber-600/20 border-amber-500/60 shadow-lg shadow-amber-600/10"
                        : "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>{isCentralPackingActive ? "5. DEPARTED" : "5. OUTGOING"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-purple-400">
                      {hubQueue.totals.outgoing}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {isCentralPackingActive ? "En route to hub" : "Fleet on the way"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubTab("gate")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "gate"
                      ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-600/10"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                      <span>6. GATE STAGE</span>
                      <Key className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-400">
                      {hubQueue.totals.gateHandover}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">OTP & Exceptions</div>
                  </button>

                  {/* 7. RTO (Reverse Logistics / Return to Origin) */}
                  {(() => {
                    const rtoCount = orders.filter((o) => String(o.deliveryStatus || "").startsWith("rto_") || Boolean(o.gateException)).length;
                    return (
                      <button
                        type="button"
                        onClick={() => setHubTab("rto")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${hubTab === "rto"
                          ? "bg-rose-600/20 border-rose-500/50 shadow-lg shadow-rose-600/10"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                          }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span className="text-rose-400">7. RTO RETURNS</span>
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-rose-400">
                          {rtoCount}
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">Reverse to Origin</div>
                      </button>
                    );
                  })()}
                </div>

                {/* Waybill Fast Scanner & Destination Filter Toolbar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  <div className="md:col-span-5 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-purple-500 transition">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Scan package barcode or type waybill (e.g. ANC-763954)..."
                      value={waybillScanInput}
                      onChange={(e) => setWaybillScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScanWaybill()}
                      className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleScanWaybill}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer shrink-0 transition"
                    >
                      Locate
                    </button>
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <select
                      value={filterDestinationHub}
                      onChange={(e) => setFilterDestinationHub(e.target.value)}
                      className="bg-transparent text-xs text-zinc-300 focus:outline-none w-full cursor-pointer"
                    >
                      <option value="all" className="bg-zinc-900">All Destination Hubs</option>
                      {STANDARD_HUBS.map((h) => (
                        <option key={h.id} value={h.id} className="bg-zinc-900">
                          To: {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
                    <Boxes className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      Container ID:
                      {transitMode === "train" || transitMode === "ship" ? (
                        <span className="text-amber-400 ml-1 font-bold text-[10px]">*Req (Rail/Ship)</span>
                      ) : (
                        <span className="text-zinc-500 ml-1 text-[10px]">(Opt)</span>
                      )}
                    </span>
                    <input
                      type="text"
                      value={activeContainerId}
                      onChange={(e) => setActiveContainerId(e.target.value.toUpperCase())}
                      placeholder={transitMode === "train" || transitMode === "ship" ? "e.g. CR-CON-8801" : "Optional for Road/Air"}
                      className="bg-transparent text-xs text-white font-mono font-bold focus:outline-none w-full uppercase placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 1: INCOMING PACKAGES QUEUE */}
              {hubTab === "incoming" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      {isCentralPackingActive ? (
                        <Boxes className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          {isCentralPackingActive
                            ? `1. Packaging & QA Inspection Queue · Central Stock & Fulfillment Center`
                            : `Inbound Cargo Arriving at ${hubQueue.hub.name}`}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {isCentralPackingActive
                            ? "Customer orders registered from checkout awaiting quality inspection, tamper-proof packaging, and origin dock staging."
                            : "Packages dispatched from upstream centers heading to this dock. Scan barcodes or tap below to check in."}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                      isCentralPackingActive
                        ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                        : "text-zinc-400 bg-zinc-900 border-zinc-800"
                    }`}>
                      {hubQueue.incoming.length} {isCentralPackingActive ? "orders awaiting packaging & QC" : "consignments awaiting check-in"}
                    </span>
                  </div>

                  {hubQueue.incoming.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">
                        {isCentralPackingActive ? "Origin Packaging Queue Cleared" : "Inbound Dock Cleared"}
                      </div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {isCentralPackingActive
                          ? "All newly created customer orders have been packaged, quality checked, and moved to origin dock."
                          : `All inbound consignments for ${hubQueue.hub.name} have been received and verified.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {hubQueue.incoming
                        .filter((ord) => filterDestinationHub === "all" || ord.nextHubId === filterDestinationHub)
                        .map((ord) => (
                          <div
                            key={ord.id}
                            className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isCentralPackingActive
                                ? "bg-amber-950/10 border-amber-500/30 hover:border-amber-500/60"
                                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${
                                  isCentralPackingActive
                                    ? "text-amber-300 bg-amber-500/15 border-amber-500/30"
                                    : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                }`}>
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {ord.customer?.fullName || "Customer"} · {ord.customer?.city || "Destination"}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                                  {isCentralPackingActive ? "Origin Strategy: Direct Corridor" : `Fleet: ${ord.transitMode || "Truck"} [${ord.vehicleNo || "OR-TRK-5555"}]`}
                                </span>
                                {ord.containerId && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                    Container: {ord.containerId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Items: <strong className="text-zinc-300">{ord.items?.[0]?.name || "Form 01"}</strong> (x{ord.items?.[0]?.quantity || 1})
                                </span>
                                <span>•</span>
                                <span>
                                  Origin: <strong className="text-zinc-300">{ord.currentHub || "Central Stock Center"}</strong>
                                </span>
                                <span>➔</span>
                                <span>
                                  Target Route: <strong className="text-purple-300">{ord.nextHub || "Regional Transit Gateway"}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={hubActionLoading === ord.orderNumber}
                                onClick={() => handleHubQueueAction(ord.orderNumber, "receive")}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50 ${
                                  isCentralPackingActive
                                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                              >
                                {hubActionLoading === ord.orderNumber ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : isCentralPackingActive ? (
                                  <Boxes className="w-4 h-4" />
                                ) : (
                                  <ArrowDownLeft className="w-4 h-4" />
                                )}
                                <span>{isCentralPackingActive ? "Verify QC & Pack at Dock" : "Scan & Receive at Dock"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RECEIVED PACKAGES QUEUE */}
              {hubTab === "received" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          {isCentralPackingActive
                            ? "2. Packaged Consignments Staged at Central Stock Dock"
                            : `Received Parcels Docked at ${hubQueue.hub.name}`}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {isCentralPackingActive
                            ? "Parcels boxed, sealed, and verified at Central Stock Center. Ready to stage into sorting bays for regional transit corridor routing."
                            : "Parcels verified and physically present at this dock. Move to sorting bays for vehicle loading."}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {hubQueue.received.length} packages ready for {isCentralPackingActive ? "origin sorting" : "sorting"}
                    </span>
                  </div>

                  {hubQueue.received.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                        <Boxes className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">
                        {isCentralPackingActive ? "Origin Staging Dock Empty" : "Receiving Bay Empty"}
                      </div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {isCentralPackingActive
                          ? "No packages currently staged at origin dock. Check Packaging / QC tab or sorting dock."
                          : `No packages currently resting at the dock. Check Inbound cargo tab or sorting dock.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {hubQueue.received
                        .filter((ord) => filterDestinationHub === "all" || ord.nextHubId === filterDestinationHub)
                        .map((ord) => (
                          <div
                            key={ord.id}
                            className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isCentralPackingActive
                                ? "bg-amber-950/10 border-amber-500/30 hover:border-amber-500/60"
                                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {ord.customer?.fullName} ({ord.customer?.city})
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 font-semibold">
                                  {isCentralPackingActive ? "Tamper-Proof Box Sealed ✓" : "Dock Scanned ✓"}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400">
                                Destination Gateway: <strong className="text-purple-300">{ord.nextHub || "Regional Hub"}</strong> · Items: {ord.items?.[0]?.name || "Package"} (x{ord.items?.[0]?.quantity || 1})
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={hubActionLoading === ord.orderNumber}
                                onClick={() => handleHubQueueAction(ord.orderNumber, "to_sorting")}
                                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
                              >
                                {hubActionLoading === ord.orderNumber ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Boxes className="w-4 h-4" />
                                )}
                                <span>{isCentralPackingActive ? "Send to Origin Sorting Bay" : "Move to Sorting Dock"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SORTING DOCK & OUTBOUND TRANSPORT ASSIGNMENT */}
              {hubTab === "sorting" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white">
                  {/* Sorting Header & Fleet Controls */}
                  <div className="space-y-4 border-b border-zinc-800 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Boxes className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                            Sorting Dock & Next Destination Assignment
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Assign next destination hub, select fleet transport mode, and vehicle ID. (Container ID required for Train & Ship).
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                            <span className="text-zinc-400 font-medium">Sorting Station Location:</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-semibold text-zinc-100 shadow-sm">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className={hubQueue.hub.id === "STOCK-CTR-01" || hubQueue.hub.id === "STK-CTR-01" ? "text-amber-300" : "text-blue-300 font-bold"}>
                                {hubQueue.hub.id === "STOCK-CTR-01" || hubQueue.hub.id === "STK-CTR-01" ? "Central Packing Station · " : ""}
                                {hubQueue.hub.name}
                              </span>
                              <span className="text-zinc-400 font-normal">({hubQueue.hub.region})</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ml-1 border ${
                                  hubQueue.hub.id === "STOCK-CTR-01" || hubQueue.hub.id === "STK-CTR-01"
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                    : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                }`}
                              >
                                {hubQueue.hub.id === "STOCK-CTR-01" || hubQueue.hub.id === "STK-CTR-01"
                                  ? "Origin Packing Station"
                                  : "Transit Logistics Hub"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        {hubQueue.sorting.length} packages in sorting bays
                      </span>
                    </div>

                    {/* Active Fleet Transport Selector & Container Staging Grid */}
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                      {/* Whiteboard Core Logic: Address Close to Hub Toggle (Default: FALSE) */}
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-200">
                              Is Destination Address Close to this Hub?
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                isAddressCloseToHub
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              address close to hub [{isAddressCloseToHub ? "true" : "false"}]
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {isAddressCloseToHub
                              ? "✓ Final delivery hub confirmed. Enabling Last-Mile Doorstep Out For Delivery with local rider/van fleet (Arriving afternoon/evening)."
                              : "Default (False): Hub is an intermediate transit station. Assigning next connecting transit hub."}
                          </p>
                        </div>

                        {/* Interactive Toggle Button */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddressCloseToHub(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                              !isAddressCloseToHub
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            [false] Next Hub
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddressCloseToHub(true);
                              if (transitMode === "train" || transitMode === "plane") {
                                setTransitMode("van");
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                              isAddressCloseToHub
                                ? "bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-600/30"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            [true] Out for Delivery
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7 space-y-1.5">
                          <label className="text-[11px] font-semibold text-zinc-400 block">Select Transport Fleet Mode</label>
                          <div className="grid grid-cols-6 gap-1.5">
                            {vehicleModes.map((mode) => {
                              const Icon = mode.icon;
                              const isSelected = transitMode === mode.id;
                              return (
                                <button
                                  key={mode.id}
                                  type="button"
                                  onClick={() => setTransitMode(mode.id as TransportMode)}
                                  className={`py-2 flex flex-col items-center justify-center rounded-xl border text-[10px] font-semibold transition cursor-pointer ${isSelected
                                    ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20"
                                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    }`}
                                >
                                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                                  <span>{mode.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Destination Routing Selector: Adapts based on addressCloseToHub */}
                        <div className="sm:col-span-5 space-y-1.5">
                          {isAddressCloseToHub ? (
                            <>
                              <label className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                                <span>Destination: Customer Doorstep</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                                  Out For Delivery Enabled
                                </span>
                              </label>
                              <div className="w-full px-3 py-2 text-xs font-semibold bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 flex items-center justify-between">
                                <div className="truncate">
                                  <span>Direct to Customer Address</span>
                                  <span className="block text-[10px] text-emerald-400/90 font-mono font-normal">
                                    Arrives afternoon/evening window
                                  </span>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                  Gate Handover
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="text-[11px] font-semibold text-zinc-400 block">Next Destination Hub</label>
                              <select
                                value={targetDestinationHubId}
                                onChange={(e) => setTargetDestinationHubId(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                {STANDARD_HUBS.filter((h) => h.id !== activeHubId).map((h) => (
                                  <option key={h.id} value={h.id}>
                                    {h.name} ({h.region})
                                  </option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mode-Specific Transit Details Specification */}
                      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                        {/* 1. TRAIN: Primary Train Number* + DateTime*, with optional PMS additional details */}
                        {transitMode === "train" && (
                          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Train className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-amber-300 font-mono">
                                  Indian Railways (PMS) Train Journey
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold font-mono">
                                  Scheduled Rake
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowRailExtraDetails(!showRailExtraDetails)}
                                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto"
                              >
                                <span>{showRailExtraDetails ? "Hide Additional Details ▲" : "+ Additional PMS Details (Optional) ▼"}</span>
                              </button>
                            </div>

                            {/* Primary Star-Marked Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Train Number</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                  <span className="text-[10px] font-mono text-zinc-500">(e.g. 12302 Howrah Rajdhani)</span>
                                </label>
                                <input
                                  type="text"
                                  value={trainNumber}
                                  onChange={(e) => setTrainNumber(e.target.value.toUpperCase())}
                                  placeholder="e.g. 12302 (Rajdhani Express)"
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-amber-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Departure Date & Time</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                  <span className="text-[10px] font-mono text-zinc-500">(Daily running pairing)</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={trainDateTime}
                                  onChange={(e) => setTrainDateTime(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-amber-500/40 rounded-xl text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Additional PMS Details (Optional for Hub) */}
                            {showRailExtraDetails && (
                              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                  <span className="text-amber-300 font-mono">Optional PMS Fields (Fill as available):</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Can be empty without issue</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">PWB / PRR Number</label>
                                    <input
                                      type="text"
                                      value={railPwbNumber}
                                      onChange={(e) => setRailPwbNumber(e.target.value.toUpperCase())}
                                      placeholder="e.g. PWB-HWH-74829 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Consignment Group ID</label>
                                    <input
                                      type="text"
                                      value={railConsignmentGroupId}
                                      onChange={(e) => setRailConsignmentGroupId(e.target.value.toUpperCase())}
                                      placeholder="e.g. GRP-KOL-ASN-001 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Parcel ID</label>
                                    <input
                                      type="text"
                                      value={railParcelId}
                                      onChange={(e) => setRailParcelId(e.target.value.toUpperCase())}
                                      placeholder="e.g. PRC-ER-20261028-091 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Source Station (Dep)</label>
                                    <input
                                      type="text"
                                      value={railSourceStation}
                                      onChange={(e) => setRailSourceStation(e.target.value)}
                                      placeholder="e.g. HWH (Howrah Jn) (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Destination Station (Arr)</label>
                                    <input
                                      type="text"
                                      value={railDestStation}
                                      onChange={(e) => setRailDestStation(e.target.value)}
                                      placeholder="e.g. ASN (Asansol Jn) (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Arrival Time</label>
                                    <input
                                      type="text"
                                      value={railArrivalTime}
                                      onChange={(e) => setRailArrivalTime(e.target.value)}
                                      placeholder="e.g. 17:15 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Space Allocation (Coach)</label>
                                    <select
                                      value={railSpaceAllocation}
                                      onChange={(e) => setRailSpaceAllocation(e.target.value as any)}
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none cursor-pointer"
                                    >
                                      <option value="F-SLR">F-SLR (Front Brake Van / Rake)</option>
                                      <option value="R-SLR">R-SLR (Rear Brake Van / Rake)</option>
                                      <option value="VPU">VPU (High Capacity Parcel Van)</option>
                                      <option value="VP">VP (Parcel Van)</option>
                                      <option value="WAGON">WAGON (Loose Load / Freight Rake)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Freight Scale</label>
                                    <select
                                      value={railFreightScale}
                                      onChange={(e) => setRailFreightScale(e.target.value as any)}
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none cursor-pointer"
                                    >
                                      <option value="Scale-R">Scale-R (Rajdhani Express Priority)</option>
                                      <option value="Scale-P">Scale-P (Premier Express Scale)</option>
                                      <option value="Scale-S">Scale-S (Standard Goods / Mail Scale)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Loading Manifest ID</label>
                                    <input
                                      type="text"
                                      value={railLoadingManifestId}
                                      onChange={(e) => setRailLoadingManifestId(e.target.value.toUpperCase())}
                                      placeholder="e.g. LMF-HWH-ASN-4402 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. PLANE: Primary Flight Number* + DateTime*, with optional IATA additional details */}
                        {transitMode === "plane" && (
                          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-cyan-500/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Plane className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-300 font-mono">
                                  Air Cargo (IATA) Flight Journey
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold font-mono">
                                  Scheduled Air Waybill
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowAirExtraDetails(!showAirExtraDetails)}
                                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto"
                              >
                                <span>{showAirExtraDetails ? "Hide Additional Details ▲" : "+ Additional IATA Details (Optional) ▼"}</span>
                              </button>
                            </div>

                            {/* Primary Star-Marked Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Flight Number</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                  <span className="text-[10px] font-mono text-zinc-500">(e.g. 6E-204 IndiGo Cargo)</span>
                                </label>
                                <input
                                  type="text"
                                  value={flightNumber}
                                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                                  placeholder="e.g. 6E-204 (IndiGo Cargo)"
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-cyan-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Flight Date & Time</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                  <span className="text-[10px] font-mono text-zinc-500">(Flight departure pairing)</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={flightDateTime}
                                  onChange={(e) => setFlightDateTime(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Additional IATA Details (Optional for Hub) */}
                            {showAirExtraDetails && (
                              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                  <span className="text-cyan-300 font-mono">Optional IATA Air Cargo Fields:</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Can be empty without issue</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Master Air Waybill (AWB #)</label>
                                    <input
                                      type="text"
                                      value={airAwbNumber}
                                      onChange={(e) => setAirAwbNumber(e.target.value.toUpperCase())}
                                      placeholder="e.g. 098-84729103 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">ULD Container ID (Box/Pallet)</label>
                                    <input
                                      type="text"
                                      value={airUldId}
                                      onChange={(e) => setAirUldId(e.target.value.toUpperCase())}
                                      placeholder="e.g. AKE-14920-6E (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Bay Location Inside Aircraft</label>
                                    <select
                                      value={airBayLocation}
                                      onChange={(e) => setAirBayLocation(e.target.value as any)}
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none cursor-pointer"
                                    >
                                      <option value="Forward Hold (FWD-01)">Forward Hold (FWD-01)</option>
                                      <option value="Aft Hold (AFT-02)">Aft Hold (AFT-02)</option>
                                      <option value="Bulk Cargo Bay">Bulk Cargo Bay</option>
                                      <option value="Main Deck">Main Deck Cargo</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Origin Airport</label>
                                    <input
                                      type="text"
                                      value={airSourceAirport}
                                      onChange={(e) => setAirSourceAirport(e.target.value)}
                                      placeholder="e.g. DEL (Delhi Indira Gandhi Intl) (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Destination Airport</label>
                                    <input
                                      type="text"
                                      value={airDestAirport}
                                      onChange={(e) => setAirDestAirport(e.target.value)}
                                      placeholder="e.g. CCU (Kolkata NSCB Intl) (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400 block font-mono">Flight Manifest ID</label>
                                    <input
                                      type="text"
                                      value={airFlightManifest}
                                      onChange={(e) => setAirFlightManifest(e.target.value.toUpperCase())}
                                      placeholder="e.g. FLM-6E-DEL-CCU-88 (Optional)"
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. SHIP: Maritime Container Freight & Ocean Vessel Transit */}
                        {transitMode === "ship" && (
                          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-sky-500/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Ship className="w-4 h-4 text-sky-400" />
                                <span className="text-xs font-bold text-sky-300 font-mono">
                                  Maritime Freight Cargo System · Ocean Vessel Operations
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold font-mono">
                                  IMO & Container Verified
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowShipExtraDetails(!showShipExtraDetails)}
                                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto"
                              >
                                <span>{showShipExtraDetails ? "Hide Additional Details ▲" : "+ Additional Ocean Shipping Details (Optional) ▼"}</span>
                              </button>
                            </div>

                            {/* Primary Star-Marked Inputs for Ship */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Vessel / Ship Name</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={vesselName}
                                  onChange={(e) => {
                                    setVesselName(e.target.value);
                                    setVehicleNo(e.target.value);
                                  }}
                                  placeholder="e.g. MV Ocean Carrier"
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-sky-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>IMO / MMSI Number</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={vesselImo}
                                  onChange={(e) => setVesselImo(e.target.value.toUpperCase())}
                                  placeholder="e.g. IMO 9382014"
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-sky-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Departure Date & Time</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={shipDateTime}
                                  onChange={(e) => setShipDateTime(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-sky-500/40 rounded-xl text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                  <span>Container ID & Seal</span>
                                  <span className="text-rose-400 font-bold">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    value={shipContainerId}
                                    onChange={(e) => setShipContainerId(e.target.value.toUpperCase())}
                                    placeholder="MSKU-982104"
                                    title="Container ID"
                                    className="w-full px-2 py-2 text-[11px] font-mono font-bold bg-zinc-900 border border-sky-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400"
                                  />
                                  <input
                                    type="text"
                                    value={shipSealNumber}
                                    onChange={(e) => setShipSealNumber(e.target.value.toUpperCase())}
                                    placeholder="SEAL-88219"
                                    title="ISO Seal Number"
                                    className="w-full px-2 py-2 text-[11px] font-mono font-bold bg-zinc-900 border border-sky-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Additional Ocean Shipping Details (Optional for Hub) */}
                            {showShipExtraDetails && (
                              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                  <span className="text-sky-300 font-mono">Optional Maritime Port & Voyage Details:</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Can be empty without issue</span>
                                </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Port of Loading (Origin)</label>
                                      <input
                                        type="text"
                                        value={shipSourcePort}
                                        onChange={(e) => setShipSourcePort(e.target.value)}
                                        placeholder="e.g. INNSA (Nhava Sheva Port, Mumbai) (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Port of Discharge (Destination)</label>
                                      <input
                                        type="text"
                                        value={shipDestPort}
                                        onChange={(e) => setShipDestPort(e.target.value)}
                                        placeholder="e.g. INHAL (Haldia Port, West Bengal) (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Voyage Number</label>
                                      <input
                                        type="text"
                                        value={shipVoyageNumber}
                                        onChange={(e) => setShipVoyageNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g. VOY-2026-09E (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Bill of Lading (B/L #)</label>
                                      <input
                                        type="text"
                                        value={shipBillOfLading}
                                        onChange={(e) => setShipBillOfLading(e.target.value.toUpperCase())}
                                        placeholder="e.g. BL-MSC-IN-994821 (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Shipping Line / Carrier</label>
                                      <input
                                        type="text"
                                        value={shipShippingLine}
                                        onChange={(e) => setShipShippingLine(e.target.value)}
                                        placeholder="e.g. Maersk Line / MSC (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Berthing Pier / Terminal</label>
                                      <input
                                        type="text"
                                        value={shipBerthLocation}
                                        onChange={(e) => setShipBerthLocation(e.target.value)}
                                        placeholder="e.g. Berth 4 / Container Terminal 2 (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. LOCAL DELIVERY & ROAD FLEET (Bike, Van, Truck) - Doorstep Handover Architecture */}
                        {(transitMode === "bike" || transitMode === "van" || transitMode === "truck") && (() => {
                          const activeSortingOrder = hubQueue.sorting.find((o) => o.orderNumber === deliverySelectedOrderId) || hubQueue.sorting[0] || orders.find((o) => o.orderNumber === deliverySelectedOrderId) || orders[0];
                          const activeCustomerAddr = activeSortingOrder?.customer?.address
                            ? `${activeSortingOrder.customer.address}, ${activeSortingOrder.customer.city} ${activeSortingOrder.customer.zipCode ? `- ${activeSortingOrder.customer.zipCode}` : ""}`
                            : "Customer Doorstep Delivery Address";
                          const activeCustomerPhone = activeSortingOrder?.customer?.contact || activeSortingOrder?.customer?.email || "+91 81055 42318";
                          const activeCustomerName = activeSortingOrder?.customer?.fullName || "Valued Customer";
                          const activePackageId = activeSortingOrder?.orderNumber || "ANC-914820";

                          return (
                            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                                <div className="flex items-center gap-2">
                                  {transitMode === "bike" ? (
                                    <Bike className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Truck className="w-4 h-4 text-emerald-400" />
                                  )}
                                  <span className="text-xs font-bold text-emerald-300 font-mono">
                                    {transitMode === "bike"
                                      ? "Last-Mile Delivery Bike Fleet · Doorstep Handover"
                                      : transitMode === "van"
                                      ? "Local Van Delivery Fleet · Doorstep & Hub Transfer"
                                      : "Surface Truck Delivery Fleet · Regional Transport"}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                                    Direct Fleet Operations
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowLocalFleetExtra(!showLocalFleetExtra)}
                                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto"
                                >
                                  <span>{showLocalFleetExtra ? "Hide Additional Details ▲" : "+ Additional Fleet & Run-Sheet Details (Optional) ▼"}</span>
                                </button>
                              </div>

                              {/* Primary Operational Fields (No AWB, Real Fleet & Doorstep Dispatch) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                    <span>Vehicle Number / Plate</span>
                                    <span className="text-rose-400 font-bold">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={deliveryVehiclePlate || vehicleNo}
                                    onChange={(e) => {
                                      const val = e.target.value.toUpperCase();
                                      setDeliveryVehiclePlate(val);
                                      setVehicleNo(val);
                                    }}
                                    placeholder={transitMode === "bike" ? "e.g. DL-01-BK-4092" : transitMode === "van" ? "e.g. WB-02-VN-8812" : "e.g. DL-01-TRK-9000"}
                                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-emerald-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400 uppercase"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                    <span>Package ID (Consignment)</span>
                                    <span className="text-rose-400 font-bold">*</span>
                                  </label>
                                  <div className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900/90 border border-zinc-800 rounded-xl text-amber-300 flex items-center justify-between">
                                    <span>{activePackageId}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                      VERIFIED
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                    <span>Driver / Rider Name</span>
                                    <span className="text-zinc-500 text-[10px] font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={deliveryDriverName}
                                    onChange={(e) => setDeliveryDriverName(e.target.value)}
                                    placeholder="e.g. Rakesh Sharma (Optional)"
                                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-emerald-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                    <span>Driver Contact / Phone</span>
                                    <span className="text-zinc-500 text-[10px] font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={deliveryDriverContact}
                                    onChange={(e) => setDeliveryDriverContact(e.target.value)}
                                    placeholder="e.g. +91 98301 23456 (Optional)"
                                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-emerald-500/40 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              {/* Doorstep Destination & Customer Info Bar */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs">
                                <div className="sm:col-span-2 space-y-0.5 min-w-0">
                                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Delivery Doorstep Address ({activeCustomerName}):</span>
                                  </span>
                                  <p className="font-semibold text-zinc-200 truncate text-[11px]" title={activeCustomerAddr}>
                                    {activeCustomerAddr}
                                  </p>
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Customer Phone / Contact:</span>
                                  </span>
                                  <p className="font-mono font-bold text-emerald-300 text-[11px]">
                                    {activeCustomerPhone}
                                  </p>
                                </div>
                              </div>

                              {/* Delivery Slot Selection */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 block">Next Destination / Delivery Window</label>
                                  <select
                                    value={deliverySlot}
                                    onChange={(e) => setDeliverySlot(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                                  >
                                    <option value="Afternoon Window (14:00 - 18:00)">Afternoon Window (14:00 - 18:00) · Out for Delivery</option>
                                    <option value="Evening Window (18:00 - 21:00)">Evening Window (18:00 - 21:00) · Evening Delivery</option>
                                    <option value="Morning Window (09:00 - 13:00)">Morning Window (09:00 - 13:00) · Priority Slot</option>
                                    <option value="Next Hub Transfer (Line-Haul)">Next Hub Transfer (Line-Haul Regional Route)</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-300 block">Fleet Operational Type</label>
                                  <div className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-xl text-emerald-400 flex items-center justify-between">
                                    <span>{transitMode === "bike" ? "2-Wheeler Direct Express Fleet" : transitMode === "van" ? "Multi-Stop Delivery Van" : "Heavy Surface Road Haul"}</span>
                                    <span className="text-[10px] text-zinc-400">Doorstep Ready</span>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Local Fleet Details (Optional) */}
                              {showLocalFleetExtra && (
                                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                    <span className="text-emerald-300 font-mono">Optional Delivery Run-Sheet & Fleet Metadata:</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">Can be empty without issue</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Delivery Run-Sheet ID</label>
                                      <input
                                        type="text"
                                        value={deliveryRunSheetId}
                                        onChange={(e) => setDeliveryRunSheetId(e.target.value.toUpperCase())}
                                        placeholder="e.g. DRS-20261029-01 (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-400 block font-mono">Assigned Service Provider</label>
                                      <input
                                        type="text"
                                        value={deliveryFleetProvider}
                                        onChange={(e) => setDeliveryFleetProvider(e.target.value)}
                                        placeholder="e.g. ANC In-House Priority Delivery (Optional)"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Direct Comparison Architectural Reference Toggle & Manifest Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowFreightArchitectureRef(!showFreightArchitectureRef)}
                            className="text-xs font-mono font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <Sliders className="w-3.5 h-3.5 text-purple-400" />
                            <span>{showFreightArchitectureRef ? "Hide Architecture Comparison ▲" : "Direct Comparison: Multi-Modal Systems Architecture (Train vs. Plane vs. Ship vs. Local Fleet) ▼"}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setManifestVerified(!manifestVerified)}
                              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${manifestVerified
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{manifestVerified ? "Manifest Verified" : "Hold"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Direct Comparison Data Entity Alignment Card */}
                        {showFreightArchitectureRef && (
                          <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wide">
                                  Direct Comparison: Train (PMS) vs. Plane (IATA) vs. Courier Systems
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400">Core Data Entities Alignment</span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                                    <th className="py-2 pr-3">Data Entity</th>
                                    <th className="py-2 px-3 text-amber-300">Indian Railways (PMS)</th>
                                    <th className="py-2 px-3 text-cyan-300">Air Cargo (IATA)</th>
                                    <th className="py-2 pl-3 text-purple-300">B2C Courier Partners</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900 text-zinc-300 text-[11px]">
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Primary Shipment ID</td>
                                    <td className="py-2 px-3 text-amber-400 font-bold">pwb_number / prr_number</td>
                                    <td className="py-2 px-3 text-cyan-400 font-bold">awb_number (Air Waybill)</td>
                                    <td className="py-2 pl-3 text-purple-400 font-bold">tracking_awb (Partner AWB)</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Location Codes</td>
                                    <td className="py-2 px-3">Station Codes (NDLS, HWH, ASN)</td>
                                    <td className="py-2 px-3">IATA Airport Codes (DEL, BOM, CCU)</td>
                                    <td className="py-2 pl-3">Pincodes / Local Hub Codes</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Transport Identifier</td>
                                    <td className="py-2 px-3 text-amber-300 font-bold">train_number + departure_date*</td>
                                    <td className="py-2 px-3 text-cyan-300 font-bold">flight_number + flight_date*</td>
                                    <td className="py-2 pl-3 text-purple-300 font-bold">vehicle_no + dispatch_date</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Physical Container ID</td>
                                    <td className="py-2 px-3">Loose load / wagon_number</td>
                                    <td className="py-2 px-3">uld_id (e.g. AKE container box)</td>
                                    <td className="py-2 pl-3">courier_bag_id / secure_tote</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Location Inside Vehicle</td>
                                    <td className="py-2 px-3">space_allocation_id (F-SLR, R-SLR, VPU)</td>
                                    <td className="py-2 px-3">bay_location (Forward / Aft Hold)</td>
                                    <td className="py-2 pl-3">van_crate / saddle_bag</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 pr-3 font-semibold text-zinc-400">Master Loading List</td>
                                    <td className="py-2 px-3">loading_manifest_id</td>
                                    <td className="py-2 px-3">flight_manifest</td>
                                    <td className="py-2 pl-3">pickup_runsheet_manifest</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Packages in Sorting Queue */}
                  {hubQueue.sorting.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                        <Boxes className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">Sorting Bays Clear</div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No packages currently staged in sorting bays for {hubQueue.hub.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Assign Destination & Complete Sorting into Loading Bay</span>
                        {hubQueue.sorting.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              hubQueue.sorting.forEach((ord) => {
                                handleHubQueueAction(ord.orderNumber, "to_loading");
                              });
                            }}
                            className="text-xs font-semibold text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1"
                          >
                            <span>Batch Sort All to Loading Bay</span>
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {hubQueue.sorting
                          .filter((ord) => filterDestinationHub === "all" || ord.nextHubId === filterDestinationHub)
                          .map((ord) => {
                            const isClose = perOrderAddressClose[ord.orderNumber] ?? isAddressCloseToHub;
                            const wasLoadingDenied = ord.events?.some((e) => e.title.includes("Vehicle Loading Denied") || e.title.includes("Returned to Sorting Dock"));

                            // Accurately determine current physical location of this package:
                            const currentLeg = ord.route?.find((l) => l.status === "sorting" || l.status === "received" || l.status === "loading") || (ord.route && ord.route[0]);

                            // Check whether package is currently at the Central Packing Station (Origin) or at a Regional Transit Hub
                            const isAtCentralPackingStation =
                              hubQueue.hub.id === "STOCK-CTR-01" ||
                              hubQueue.hub.id === "STK-CTR-01" ||
                              (ord.currentHubId === "STOCK-CTR-01" && (!currentLeg || currentLeg.hubId === "STOCK-CTR-01" || currentLeg.hubId === "STK-CTR-01")) ||
                              ord.hubQueueStatus === "packaging" ||
                              (ord.deliveryStatus === "processing" && (!ord.route || ord.route.length === 0 || ord.route[0]?.status === "pending"));

                            const currentLocationName = isAtCentralPackingStation
                              ? "Central Packing Station (Central Stock & Fulfillment Center)"
                              : (currentLeg?.hubName || ord.currentHub || hubQueue.hub.name);

                            const currentLocationRegion = isAtCentralPackingStation
                              ? "Nagpur Zero-Mile / National Stock Center, Maharashtra"
                              : (currentLeg?.region || ord.currentRegion || hubQueue.hub.region);

                            const locationTypeBadge = isAtCentralPackingStation
                              ? "Central Packing Station (Origin)"
                              : "Transit Logistics Hub";

                            return (
                              <div
                                key={ord.id}
                                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                  wasLoadingDenied
                                    ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70"
                                    : isClose
                                    ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70"
                                    : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                                }`}
                              >
                                <div className="space-y-2 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                                      {ord.orderNumber}
                                    </span>
                                    <span className="text-xs font-semibold text-zinc-200">
                                      {ord.customer?.fullName} ({ord.customer?.city})
                                    </span>
                                    {wasLoadingDenied && (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        Reverted from Loading Bay · Ready for Re-sorting
                                      </span>
                                    )}
                                    {isClose ? (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                        ✓ Out for Delivery (Afternoon/Evening)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                                        Next Hub: {getHubById(targetDestinationHubId)?.name || ord.nextHub}
                                      </span>
                                    )}

                                    {/* Whiteboard requirement: Per-order toggle for address close to hub */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPerOrderAddressClose((prev) => ({
                                          ...prev,
                                          [ord.orderNumber]: !isClose,
                                        }))
                                      }
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer font-bold ${
                                        isClose
                                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                                      }`}
                                      title="Toggle whether destination address is close to this hub"
                                    >
                                      address close to hub [{isClose ? "true" : "false"}]
                                    </button>
                                  </div>

                                  {/* Current Physical Location Banner */}
                                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                          isAtCentralPackingStation
                                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                        }`}
                                      >
                                        <MapPin className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">
                                            Current Physical Location:
                                          </span>
                                          <span
                                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                              isAtCentralPackingStation
                                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                                : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                            }`}
                                          >
                                            {isAtCentralPackingStation ? "Origin Packing Station" : "Transit Hub Location"}
                                          </span>
                                        </div>
                                        <span className="text-zinc-100 font-bold text-xs flex flex-wrap items-baseline gap-1.5 mt-0.5">
                                          <span className={isAtCentralPackingStation ? "text-amber-300" : "text-blue-300"}>
                                            {currentLocationName}
                                          </span>
                                          <span className="text-zinc-400 text-[11px] font-normal">
                                            ({currentLocationRegion})
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono px-2.5 py-1 rounded-xl font-bold border shrink-0 ${
                                        isAtCentralPackingStation
                                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                          : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                      }`}
                                    >
                                      📍 {locationTypeBadge}
                                    </span>
                                  </div>

                                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span>
                                      Location: <strong className={isAtCentralPackingStation ? "text-amber-300 font-semibold" : "text-blue-300 font-semibold"}>{currentLocationName} ({currentLocationRegion})</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Assigned Mode: <strong className="text-zinc-200 uppercase">{transitMode}</strong>
                                    </span>
                                    <span>•</span>
                                    {transitMode === "train" ? (
                                      <span>
                                        Train: <strong className="text-amber-400 font-mono font-bold">#{trainNumber.trim() || "Scheduled Rake"} · {trainDateTime.replace("T", " ")}</strong>
                                        {railSpaceAllocation && <span className="text-zinc-400 text-[10px] ml-1">[{railSpaceAllocation} · {railFreightScale}]</span>}
                                      </span>
                                    ) : transitMode === "plane" ? (
                                      <span>
                                        Flight: <strong className="text-cyan-400 font-mono font-bold">#{flightNumber.trim() || "Scheduled Cargo"} · {flightDateTime.replace("T", " ")}</strong>
                                        {airBayLocation && <span className="text-zinc-400 text-[10px] ml-1">[{airBayLocation.split(" ")[0]}]</span>}
                                      </span>
                                    ) : transitMode === "ship" ? (
                                      <span>
                                        Vessel: <strong className="text-sky-400 font-mono font-bold">{vesselName.trim() || "Scheduled Ocean Vessel"}</strong>
                                        {vesselImo.trim() ? ` [${vesselImo.trim()}]` : ""}
                                        {shipContainerId.trim() ? <> · Container: <strong className="text-zinc-300 font-mono">{shipContainerId.trim()}</strong></> : ""}
                                      </span>
                                    ) : (
                                      <span>
                                        Fleet: <strong className="text-emerald-400 font-mono font-bold">{deliveryVehiclePlate.trim() || vehicleNo.trim() || (transitMode === "bike" ? "Express Bike" : transitMode === "van" ? "Delivery Van" : "Heavy Road Truck")}</strong>
                                        {deliveryDriverName.trim() && (
                                          <>
                                            {" "}· Rider: <strong className="text-zinc-300">{deliveryDriverName.trim()}</strong>
                                          </>
                                        )}
                                        {deliveryDriverContact.trim() && (
                                          <span className="text-zinc-500 font-mono text-[10px] ml-1">({deliveryDriverContact.trim()})</span>
                                        )}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span>
                                      Destination: <strong className="text-zinc-200">{ord.customer?.city}, {ord.customer?.state}</strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    disabled={hubActionLoading === ord.orderNumber}
                                    onClick={() => handleHubQueueAction(ord.orderNumber, "to_loading")}
                                    className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50 text-white ${
                                      isClose
                                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                                        : "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
                                    }`}
                                  >
                                    {hubActionLoading === ord.orderNumber ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <PackagePlus className="w-4 h-4" />
                                    )}
                                    <span>
                                      {isClose
                                        ? "Stage for Last-Mile Loading ➔"
                                        : "Complete Sorting ➔ Move to Loading Bay"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LOADING QUEUE (VEHICLE STAGING & BAY LOADING PLATFORM) */}
              {hubTab === "loading" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <PackagePlus className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          Vehicle Loading Bay & Staging Platform at {hubQueue.hub.name}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Consignments sorted and staged at dock bay. Verify container stowage and mark loaded & dispatched to begin active transit [On the way].
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                      {hubQueue.loading.length} packages ready for loading
                    </span>
                  </div>

                  {hubQueue.loading.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                        <PackagePlus className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">Loading Bay Clear</div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No packages currently waiting for vehicle loading at {hubQueue.hub.name}. Complete sorting to move consignments here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Vehicles Staged in Bay 4 — Ready for Dispatch</span>
                        {hubQueue.loading.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              hubQueue.loading.forEach((ord) => {
                                handleHubQueueAction(ord.orderNumber, "dispatch");
                              });
                            }}
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                          >
                            <span>Batch Load All & Dispatch Fleet [On The Way]</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {hubQueue.loading.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-zinc-900/80 border border-cyan-500/30 hover:border-cyan-500/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {ord.customer?.fullName} ({ord.customer?.city})
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 font-semibold uppercase">
                                  Loading Bay Staged · {ord.transitMode || "Truck"}
                                </span>
                                {ord.transitMode === "train" ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                    Rail: Train #{ord.railFreight?.trainNumber || ord.vehicleNo?.replace("IR-", "") || "12302"} ({ord.railFreight?.departureDate || "Daily"}) {ord.railFreight?.spaceAllocationId ? `[${ord.railFreight.spaceAllocationId}]` : ""}
                                  </span>
                                ) : ord.transitMode === "plane" ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                                    Flight: #{ord.airCargo?.flightNumber || ord.vehicleNo?.replace("FLT-", "") || "6E-204"} ({ord.airCargo?.flightDate || "Daily"}) {ord.airCargo?.uldId ? `[ULD: ${ord.airCargo.uldId}]` : ""}
                                  </span>
                                ) : ord.courierService ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                                    {ord.courierService.providerName} · AWB: {ord.courierService.trackingAwb}
                                  </span>
                                ) : ord.containerId ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                    Container: {ord.containerId}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Target Hub: <strong className="text-purple-300">{ord.nextHub}</strong> ({ord.nextRegion})
                                </span>
                                <span>•</span>
                                <span>
                                  Manifest: <strong className="text-emerald-400 font-semibold">Security Check OK</strong>
                                </span>
                              </div>
                            </div>

                              {(() => {
                                const currentLeg = ord.route?.find((l) => l.status === "loading" || l.status === "received" || l.status === "sorting");
                                const isLastMile = Boolean(currentLeg?.isFinalDeliveryHub || perOrderAddressClose[ord.orderNumber] || !ord.nextHubId);

                                return (
                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {/* Deny Loading / Revert to Sorting Action */}
                                    <button
                                      type="button"
                                      disabled={hubActionLoading === ord.orderNumber}
                                      onClick={() => {
                                        setDenyLoadingModalOrder(ord);
                                        setDenyLoadingReason("🏷️ Mislabeled Destination / Routing");
                                        setCustomDenyNotes("");
                                      }}
                                      className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 hover:border-rose-500/70 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                                      title="Deny vehicle loading and revert consignment back to Sorting Dock for routing/label correction"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Deny Loading (Revert to Sorting)</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={hubActionLoading === ord.orderNumber}
                                      onClick={() => handleHubQueueAction(ord.orderNumber, "dispatch")}
                                      className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50 ${
                                        isLastMile
                                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 ring-1 ring-emerald-400"
                                          : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20"
                                      }`}
                                    >
                                      {hubActionLoading === ord.orderNumber ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : isLastMile ? (
                                        <Truck className="w-4 h-4 text-emerald-200" />
                                      ) : (
                                        <ArrowUpRight className="w-4 h-4" />
                                      )}
                                      <span>
                                        {isLastMile
                                          ? "Confirm Loading ➔ Mark Out For Delivery [Afternoon/Evening]"
                                          : "Mark Loaded & Dispatch [On The Way]"}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: OUTGOING DISPATCHED PACKAGES QUEUE [ON THE WAY] */}
              {hubTab === "outgoing" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <ArrowUpRight className="w-5 h-5 text-purple-400" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          Outgoing Fleet In Transit [On The Way] from {hubQueue.hub.name}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Active consignments dispatched outbound en route towards next destination hubs or doorstep gate couriers.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                      {hubQueue.outgoing.length} consignments in transit
                    </span>
                  </div>

                  {hubQueue.outgoing.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                        <Truck className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">No Outgoing Active Shipments</div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No parcels currently en route leaving {hubQueue.hub.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {hubQueue.outgoing.map((ord) => {
                        const isRailOrShip = ord.transitMode === "train" || ord.transitMode === "ship";
                        const telematicsLabel = ord.transitMode === "plane"
                          ? "ADS-B Air Cargo Telemetry Active"
                          : ord.transitMode === "train"
                            ? "FOIS Rail Electronic Telemetry Active"
                            : ord.transitMode === "ship"
                              ? "AIS Maritime Container Telemetry Active"
                              : "FASTag Toll & Fleet GPS Active";

                        return (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {ord.customer?.fullName} ({ord.customer?.city})
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                  <span>{telematicsLabel}</span>
                                </span>
                                {isRailOrShip && ord.containerId && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                    Container: {ord.containerId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Fleet: <strong className="text-zinc-200 uppercase">{ord.transitMode || "Truck"}</strong> [{ord.vehicleNo || "DL-01-TRK-8812"}]
                                </span>
                                <span>•</span>
                                <span>
                                  Next Station: <strong className="text-purple-300">{ord.nextHub}</strong> ({ord.nextRegion})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setAuditWaybillModalOrder(ord)}
                                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                              >
                                <Navigation className="w-3.5 h-3.5 text-purple-400" />
                                <span>View Audit Waybill & Telematics</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: DOORSTEP GATE ARRIVAL & 5-MIN ALIVE OTP & 2-IMAGE POD */}
              {hubTab === "gate" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Key className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          Final Doorstep Gate Delivery, 5-Min Alive OTP & Mandatory PoD
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Couriers arrive at customer entrance, trigger live OTP email via AWS SES. Enter customer OTP and capture 2 mandatory photos under 10 MB to finalize release.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      {hubQueue.gateHandover.length} consignments at gate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Consignment Selection for Handover */}
                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-zinc-400 block">Select Consignment at Doorstep:</label>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setDeliverySelectedOrderId(ord.orderNumber);
                              if (ord.deliveryStatus === "delivered") {
                                setDeliveryGateStatus("delivered");
                              } else if (ord.gateOtpSession?.verified) {
                                setDeliveryGateStatus("otp_verified");
                              } else if (ord.gateOtpSession?.active) {
                                setDeliveryGateStatus("otp_sent");
                              } else {
                                setDeliveryGateStatus("gate_reached");
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer ${deliverySelectedOrderId === ord.orderNumber
                              ? "bg-blue-600/20 border-blue-500/50 text-white"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                              }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                              <span className="text-blue-400">{ord.orderNumber}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-semibold">
                                {ord.deliveryStatus}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-300">
                              {ord.customer?.fullName} · {ord.customer?.address}, {ord.customer?.city}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
                              <span>Contact: {ord.customer?.contact || "+91 81055 42318"}</span>
                              {ord.deliveryStatus === "delivered" && (
                                <span className="text-emerald-400 font-bold font-mono text-[10px]">✓ PoD Vaulted</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step B: Doorstep verification controller */}
                    <div className="border border-zinc-800 bg-zinc-900/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <span className="text-xs font-bold text-zinc-300">Doorstep Courier Station</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            GPS Proximity Match ✓
                          </span>
                        </div>

                        {/* Dual Condition Selector (Whiteboard: Condition 1 Acceptance vs Condition 2 Refusal/Exception) */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setSelectedGateCondition("condition_1_acceptance")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              selectedGateCondition === "condition_1_acceptance"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>1. Customer Acceptance</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedGateCondition("condition_2_refusal")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              selectedGateCondition === "condition_2_refusal"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>2. Refusal / Exception [RTO]</span>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 space-y-1.5">
                          <div>[Active Waybill]: <strong className="text-white">{deliverySelectedOrderId}</strong></div>
                          <div>[Courier Terminal]: Edge Handshake Verified · Port 443 OK</div>
                          <div>
                            [Status]:{" "}
                            <span className="text-purple-300 font-bold uppercase">
                              {deliveryGateStatus.replace('_', ' ')}
                            </span>
                          </div>
                          {deliveryGateStatus === "otp_sent" && (
                            <div className="text-amber-400 pt-1 font-mono flex items-center justify-between border-t border-zinc-800/80 mt-1">
                              <span>[Security Session]: Dispatched to Customer Email</span>
                              <span>Remaining: {Math.floor(deliveryOtpRemainingSeconds / 60)}:{(deliveryOtpRemainingSeconds % 60).toString().padStart(2, '0')}</span>
                            </div>
                          )}
                        </div>

                        {/* CONDITION 1: CUSTOMER ARRIVES TO MEET PACKAGE (Whiteboard Flow 1) */}
                        {selectedGateCondition === "condition_1_acceptance" && (
                          <div className="space-y-4">
                            {/* Trigger 5-Min Alive OTP Button */}
                            {deliveryGateStatus !== "delivered" && deliveryGateStatus !== "otp_verified" && (
                              <button
                                type="button"
                                onClick={handleTriggerGateOtp}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all active:scale-95 cursor-pointer ${otpTriggered || deliveryGateStatus === 'otp_sent'
                                  ? 'bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-600/20'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                                  }`}
                              >
                                {otpTriggered || deliveryGateStatus === 'otp_sent'
                                  ? 'OTP Dispatched via AWS SES ✓ (Resend)'
                                  : 'Reached Gate ... Trigger 5-Min Alive OTP Email'}
                              </button>
                            )}

                            {/* Customer 6-Digit OTP Verification Field */}
                            {deliveryGateStatus === "otp_sent" && (
                              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-zinc-300 font-medium">Customer Doorstep OTP:</span>
                                  <span className="text-amber-400 font-mono text-[11px]">
                                    Window: {Math.floor(deliveryOtpRemainingSeconds / 60)}:{(deliveryOtpRemainingSeconds % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={deliveryOtpValue}
                                    onChange={(e) => setDeliveryOtpValue(e.target.value.replace(/[^0-9]/g, ""))}
                                    placeholder="Enter 6-digit OTP from customer"
                                    className="flex-1 px-3 py-2 text-center text-xs font-mono font-bold tracking-widest bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleVerifyGateOtp}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                  >
                                    Verify OTP
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Mandatory 2-Image PoD Capture (Unlocked upon OTP verification) */}
                            {deliveryGateStatus === "otp_verified" && (
                              <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/40 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                                    <Camera className="w-4 h-4 text-purple-400" />
                                    <span>MANDATORY PROOF OF DELIVERY (2 IMAGES &lt;10 MB)</span>
                                  </div>
                                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                                    Step 2 of 2
                                  </span>
                                </div>

                                <p className="text-[11px] text-zinc-400">
                                  Both photos are strictly required before handover confirmation. Capture with camera or upload image from file system.
                                </p>

                                {/* Image 1: Shipping Label Sticker */}
                                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                                    <span>1. Shipping Label Sticker (Name & Barcode)</span>
                                    {labelProof ? (
                                      <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>{(labelProof.size / 1024 / 1024).toFixed(2)} MB ✓</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-rose-400 font-mono font-bold">*Required</span>
                                    )}
                                  </div>

                                  {labelProof ? (
                                    <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                      <img
                                        src={labelProof.dataUrl || ""}
                                        alt="Label Proof"
                                        className="w-14 h-14 object-cover rounded-md border border-zinc-700 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1 text-xs text-zinc-300">
                                        <div className="font-mono text-[11px] truncate">{labelProof.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">
                                          {(labelProof.size / 1024 / 1024).toFixed(2)} MB (Under 10 MB limit)
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setLabelProof(null)}
                                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <label className="py-2 px-2.5 rounded-lg border border-purple-500/40 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                                        <Camera className="w-3.5 h-3.5" />
                                        <span>Capture Camera</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => handlePoDImageSelect("label", e)}
                                          className="hidden"
                                        />
                                      </label>
                                      <label className="py-2 px-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Image</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handlePoDImageSelect("label", e)}
                                          className="hidden"
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {/* Image 2: Product Box & Condition */}
                                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                                    <span>2. Product Box & Sealed Condition</span>
                                    {productProof ? (
                                      <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>{(productProof.size / 1024 / 1024).toFixed(2)} MB ✓</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-rose-400 font-mono font-bold">*Required</span>
                                    )}
                                  </div>

                                  {productProof ? (
                                    <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                      <img
                                        src={productProof.dataUrl || ""}
                                        alt="Product Proof"
                                        className="w-14 h-14 object-cover rounded-md border border-zinc-700 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1 text-xs text-zinc-300">
                                        <div className="font-mono text-[11px] truncate">{productProof.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">
                                          {(productProof.size / 1024 / 1024).toFixed(2)} MB (Under 10 MB limit)
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setProductProof(null)}
                                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <label className="py-2 px-2.5 rounded-lg border border-purple-500/40 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                                        <Camera className="w-3.5 h-3.5" />
                                        <span>Capture Camera</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => handlePoDImageSelect("product", e)}
                                          className="hidden"
                                        />
                                      </label>
                                      <label className="py-2 px-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Image</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handlePoDImageSelect("product", e)}
                                          className="hidden"
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {/* Finalize Release Button */}
                                <button
                                  type="button"
                                  disabled={isFinalizingPod || !labelProof || !productProof}
                                  onClick={handleFinalizePod}
                                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  {isFinalizingPod ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCheck className="w-4 h-4" />
                                  )}
                                  <span>
                                    {!labelProof || !productProof
                                      ? "Attach Both 2 Images to Finalize Handover"
                                      : "Confirm & Finalize Doorstep Handover (Archive to S3)"}
                                  </span>
                                </button>
                              </div>
                            )}

                            {/* Delivered Confirmation Card */}
                            {deliveryGateStatus === "delivered" && (
                              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Doorstep Handover Complete & PoD Secured</span>
                                  </span>
                                  <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 font-bold">
                                    DELIVERED ✓
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-300">
                                  Customer OTP was verified and 2 high-resolution proof photos (Shipping Label & Sealed Box Condition, &lt;10 MB) have been sealed into AWS S3 proof vault. Live warranty email dispatched.
                                </p>
                                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>2-Point PoD Authentication Archived</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CONDITION 2: CUSTOMER REFUSES PACKAGE OR OUT OF STATION (Whiteboard Flow 2 - RTO) */}
                        {selectedGateCondition === "condition_2_refusal" && (
                          <div className="space-y-4 p-4 rounded-2xl bg-zinc-950 border border-rose-500/30">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide">
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                <span>Gate Refusal & Return to Origin (RTO)</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                Exception Handling
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-400">
                              Select from the 3 whiteboard exception cases. The parcel will be returned from the gate back to the local delivery hub returns dock, scheduled on reverse line-haul, and retrieved back to origin warehouse.
                            </p>

                            {/* 3 Selectable Whiteboard Exception Reasons */}
                            <div className="space-y-2">
                              <label
                                onClick={() => setGateExceptionReason("damaged_package")}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 transition cursor-pointer ${
                                  gateExceptionReason === "damaged_package"
                                    ? "bg-rose-950/40 border-rose-500 text-rose-200 shadow-sm"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="gateReasonRadio"
                                  checked={gateExceptionReason === "damaged_package"}
                                  onChange={() => setGateExceptionReason("damaged_package")}
                                  className="mt-0.5"
                                />
                                <div className="text-xs">
                                  <div className="font-bold text-zinc-200">1. Package Damaged / Unstable Condition</div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    Customer came to conclusion package wanted is in bad shape so asking to refuse acceptance. Delivery partner marks package unstable.
                                  </div>
                                </div>
                              </label>

                              <label
                                onClick={() => setGateExceptionReason("customer_out_of_station")}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 transition cursor-pointer ${
                                  gateExceptionReason === "customer_out_of_station"
                                    ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="gateReasonRadio"
                                  checked={gateExceptionReason === "customer_out_of_station"}
                                  onChange={() => setGateExceptionReason("customer_out_of_station")}
                                  className="mt-0.5"
                                />
                                <div className="text-xs">
                                  <div className="font-bold text-zinc-200">2. Customer Out of Station</div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    Customer is out of station or unreachable at destination address. Handover cannot be completed.
                                  </div>
                                </div>
                              </label>

                              <label
                                onClick={() => setGateExceptionReason("customer_refused")}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 transition cursor-pointer ${
                                  gateExceptionReason === "customer_refused"
                                    ? "bg-rose-950/60 border-red-500 text-red-200 shadow-sm"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="gateReasonRadio"
                                  checked={gateExceptionReason === "customer_refused"}
                                  onChange={() => setGateExceptionReason("customer_refused")}
                                  className="mt-0.5"
                                />
                                <div className="text-xs">
                                  <div className="font-bold text-red-300 flex items-center gap-1.5">
                                    <span>3. Customer Bad Treatment Exception</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-mono uppercase font-bold">
                                      Red Flag Customer
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    Customer bad treatment exception just refusing and scolding. Abort delivery and tag customer with RED FLAG.
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* Red Flag Warning Box */}
                            {gateExceptionReason === "customer_refused" && (
                              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-[11px] text-red-200 font-mono flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-white uppercase font-bold">[RED FLAG CUSTOMER WARNING]: </strong>
                                  <span>Customer profile will be tagged as RED FLAG across all store orders due to aggressive refusal.</span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="text-[11px] text-zinc-400 font-mono">Courier Exception Note (Optional):</label>
                              <textarea
                                rows={2}
                                value={gateExceptionNote}
                                onChange={(e) => setGateExceptionNote(e.target.value)}
                                placeholder="e.g. Box compressed on side, customer rejected delivery without opening..."
                                className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500 resize-none"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={isSubmittingGateException}
                              onClick={() => handleGateExceptionRto(deliverySelectedOrderId, gateExceptionReason, gateExceptionNote)}
                              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingGateException ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                              <span>Confirm Gate Refusal ➔ Initiate Return to Origin (RTO)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RTO REVERSE LOGISTICS & ORIGIN RETRIEVAL DOCK */}
              {hubTab === "rto" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <RotateCcw className="w-5 h-5 text-rose-400" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                          Return to Origin (RTO) Reverse Logistics & Origin Retrieval Console
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Complete reverse supply-chain retrieval: Gate Refusal ➔ Local Hub Returns Dock ➔ Reverse Line-Haul ➔ Origin Fulfillment Center QA & Restock / Refund.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      {orders.filter((o) => String(o.deliveryStatus || "").startsWith("rto_") || Boolean(o.gateException)).length} consignments in reverse pipeline
                    </span>
                  </div>

                  {/* Architecture Diagram: Where Returned Packages Go */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold font-mono text-rose-300 uppercase">
                      <span>Reverse Logistics Physical Retrieval Route (How Packages Return to Origin)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Chain of Custody Preserved</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-1">
                        <div className="text-[10px] text-rose-400 font-bold uppercase">Stage 1: Gate Refusal</div>
                        <div className="font-semibold text-zinc-200">Customer Entrance</div>
                        <p className="text-[10px] text-zinc-400">Handover rejected. Delivery agent flags exception & transports back to local hub.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-1">
                        <div className="text-[10px] text-amber-400 font-bold uppercase">Stage 2: Local Returns Dock</div>
                        <div className="font-semibold text-zinc-200">HUB-ASN-01 (Returns Dock)</div>
                        <p className="text-[10px] text-zinc-400">Returned parcel checked in, barcode verified, and grouped into reverse transit manifest.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-1">
                        <div className="text-[10px] text-purple-400 font-bold uppercase">Stage 3: Reverse Line-Haul</div>
                        <div className="font-semibold text-zinc-200">Connecting Hubs ➔ Origin</div>
                        <p className="text-[10px] text-zinc-400">Traverses reverse path (HUB-ASN-01 ➔ HUB-CCU-01 ➔ HUB-DEL-01) on freight carriers.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-1">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">Stage 4: Origin QA & Restock</div>
                        <div className="font-semibold text-zinc-200">HUB-DEL-01 (Origin Center)</div>
                        <p className="text-[10px] text-zinc-400">Package inspected. Quarantined if damaged, or restocked into inventory with auto-refund.</p>
                      </div>
                    </div>
                  </div>

                  {/* Orders In RTO Pipeline */}
                  {(() => {
                    const rtoOrders = orders.filter((o) => String(o.deliveryStatus || "").startsWith("rto_") || Boolean(o.gateException));

                    if (rtoOrders.length === 0) {
                      return (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
                            <RotateCcw className="w-6 h-6 text-zinc-500" />
                          </div>
                          <div className="text-sm font-semibold text-zinc-300">RTO Pipeline Clear</div>
                          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            No packages currently undergoing reverse logistics. Trigger Condition 2 in the Gate Stage to simulate a refusal.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="text-xs text-zinc-400 font-mono flex items-center justify-between">
                          <span>Active Consignments Returning to Origin ({rtoOrders.length})</span>
                          <span className="text-[10px] text-zinc-500">Interactive Reverse Stepper Available</span>
                        </div>

                        <div className="space-y-3">
                          {rtoOrders.map((ord) => {
                            const rto = ord.rtoDetails;
                            const exc = ord.gateException;
                            const returnStatus = rto?.returnStatus || "dock_received";

                            return (
                              <div
                                key={ord.id}
                                className="p-5 rounded-2xl bg-zinc-900/90 border border-rose-500/30 hover:border-rose-500/50 transition space-y-4"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                                      {ord.orderNumber}
                                    </span>
                                    <span className="text-xs font-semibold text-zinc-200">
                                      {ord.customer?.fullName} ({ord.customer?.city})
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-rose-300 border border-zinc-700 font-bold uppercase">
                                      RTO Status: {returnStatus.replace("_", " ")}
                                    </span>
                                    {ord.isRedFlagCustomer && (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-300 border border-red-500/50 font-bold flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-red-400" />
                                        <span>RED FLAG CUSTOMER</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                                    <span>Reverse AWB:</span>
                                    <strong className="text-rose-300">{rto?.returnTrackingNumber || `RTO-${ord.orderNumber}`}</strong>
                                  </div>
                                </div>

                                {/* Exception Details Box */}
                                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 font-mono space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                    <span>[Gate Rejection Reason]:</span>
                                    <span>Reported: {exc?.reportedAt ? new Date(exc.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}</span>
                                  </div>
                                  <div className="text-rose-300 font-semibold">
                                    {exc?.reason === "damaged_package"
                                      ? "Package Damaged / Unstable Condition (Customer Refused)"
                                      : exc?.reason === "customer_out_of_station"
                                      ? "Customer Out of Station / Unreachable"
                                      : "Customer Hostile Refusal / Bad Treatment Exception"}
                                  </div>
                                  {exc?.reasonNote && (
                                    <div className="text-zinc-400 text-[11px]">Note: &quot;{exc.reasonNote}&quot;</div>
                                  )}
                                </div>

                                {/* Reverse Stepper Buttons: Advance through Return Stages */}
                                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] text-zinc-400 font-mono">Advance Reverse Logistics Lifecycle:</span>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={rtoActionLoading === ord.orderNumber}
                                      onClick={() => handleRtoHubAction(ord.orderNumber, "dock_received", "Scanned at local returns dock")}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                                        returnStatus === "dock_received"
                                          ? "bg-amber-600 text-white shadow-sm"
                                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                      }`}
                                    >
                                      1. Check-in Local Returns Dock
                                    </button>

                                    <button
                                      type="button"
                                      disabled={rtoActionLoading === ord.orderNumber}
                                      onClick={() => handleRtoHubAction(ord.orderNumber, "reverse_transit", "Loaded on return line-haul")}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                                        returnStatus === "reverse_transit"
                                          ? "bg-purple-600 text-white shadow-sm"
                                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                      }`}
                                    >
                                      2. Dispatch Reverse Line-Haul
                                    </button>

                                    <button
                                      type="button"
                                      disabled={rtoActionLoading === ord.orderNumber}
                                      onClick={() => handleRtoHubAction(ord.orderNumber, "origin_received", "Received at origin center")}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                                        returnStatus === "origin_received"
                                          ? "bg-cyan-600 text-white shadow-sm"
                                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                      }`}
                                    >
                                      3. Arrive at Origin Warehouse
                                    </button>

                                    <button
                                      type="button"
                                      disabled={rtoActionLoading === ord.orderNumber}
                                      onClick={() => handleRtoHubAction(ord.orderNumber, "qa_restock_refund", "QA inspection completed")}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                                        returnStatus === "qa_quarantined" || returnStatus === "restocked_refunded"
                                          ? "bg-emerald-600 text-white shadow-sm"
                                          : "bg-zinc-800 text-zinc-300 hover:bg-emerald-700 hover:text-white"
                                      }`}
                                    >
                                      4. Complete QA & Restock / Refund
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* AUDIT WAYBILL & VEHICLE TELEMATICS MODAL */}
              {auditWaybillModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <Navigation className="w-5 h-5 text-purple-400" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wide">
                            Supply-Chain Audit Waybill & Telematics Console
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Active tracking telemetry, multi-hub routing checkpoints, and vehicle tracking integration.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAuditWaybillModalOrder(null)}
                        className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Consignment Overview Banner */}
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">CONSIGNMENT / WAYBILL</span>
                        <span className="font-bold text-purple-400 text-sm">{auditWaybillModalOrder.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">CURRENT LOCATION</span>
                        <span className="text-zinc-200 font-bold">{auditWaybillModalOrder.currentHub}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">NEXT DESTINATION</span>
                        <span className="text-purple-300 font-bold">{auditWaybillModalOrder.nextHub}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">DELIVERY STATUS</span>
                        <span className="text-emerald-400 font-bold uppercase">{auditWaybillModalOrder.deliveryStatus}</span>
                      </div>
                    </div>

                    {/* Vehicle & Telematics Tracking Source Breakdown */}
                    <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
                          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                          <span>Vehicle Tracking Integration (Audit Engine)</span>
                        </div>
                        <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                          LIVE TELEMETRY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">Transport Mode & Vehicle</span>
                          <div className="font-bold text-zinc-100 flex items-center gap-1.5 uppercase">
                            <Truck className="w-3.5 h-3.5 text-purple-400" />
                            <span>{auditWaybillModalOrder.transitMode || "Truck"} [{auditWaybillModalOrder.vehicleNo || "DL-01-TRK-8812"}]</span>
                          </div>
                          {auditWaybillModalOrder.transitMode === "train" && (
                            <div className="text-amber-400 font-mono text-[11px] pt-1 font-semibold space-y-0.5">
                              <div>Train #{auditWaybillModalOrder.railFreight?.trainNumber || auditWaybillModalOrder.vehicleNo?.replace("IR-", "") || "12302"} ({auditWaybillModalOrder.railFreight?.departureDate || "Daily"})</div>
                              {auditWaybillModalOrder.railFreight?.pwbNumber && (
                                <div className="text-zinc-400 text-[10px]">PWB: {auditWaybillModalOrder.railFreight.pwbNumber} · Coach: {auditWaybillModalOrder.railFreight.spaceAllocationId || "F-SLR"} ({auditWaybillModalOrder.railFreight.freightScale || "Scale-R"})</div>
                              )}
                              {auditWaybillModalOrder.railFreight?.sourceStationCode && (
                                <div className="text-zinc-500 text-[10px]">Route: {auditWaybillModalOrder.railFreight.sourceStationCode} ➔ {auditWaybillModalOrder.railFreight.destinationStationCode}</div>
                              )}
                            </div>
                          )}
                          {auditWaybillModalOrder.transitMode === "plane" && (
                            <div className="text-cyan-400 font-mono text-[11px] pt-1 font-semibold space-y-0.5">
                              <div>Flight #{auditWaybillModalOrder.airCargo?.flightNumber || auditWaybillModalOrder.vehicleNo?.replace("FLT-", "") || "6E-204"} ({auditWaybillModalOrder.airCargo?.flightDate || "Daily"})</div>
                              {auditWaybillModalOrder.airCargo?.awbNumber && (
                                <div className="text-zinc-400 text-[10px]">AWB: {auditWaybillModalOrder.airCargo.awbNumber} · ULD: {auditWaybillModalOrder.airCargo.uldId || "AKE"}</div>
                              )}
                            </div>
                          )}
                          {auditWaybillModalOrder.transitMode === "ship" && (
                            <div className="text-sky-400 font-mono text-[11px] pt-1 font-semibold space-y-0.5">
                              <div>Vessel: {auditWaybillModalOrder.oceanFreight?.vesselName || auditWaybillModalOrder.vehicleNo} [{auditWaybillModalOrder.oceanFreight?.imoNumber || "IMO 9382014"}]</div>
                              <div className="text-zinc-400 text-[10px]">Container: {auditWaybillModalOrder.oceanFreight?.containerId || auditWaybillModalOrder.containerId || "MSKU-982104-7"} · Seal: {auditWaybillModalOrder.oceanFreight?.sealNumber || "SEAL-88219"}</div>
                              {auditWaybillModalOrder.oceanFreight?.sourcePortCode && (
                                <div className="text-zinc-500 text-[10px]">Port: {auditWaybillModalOrder.oceanFreight.sourcePortCode} ➔ {auditWaybillModalOrder.oceanFreight.destPortCode} (Voyage: {auditWaybillModalOrder.oceanFreight.voyageNumber || "VOY-2026-09E"})</div>
                              )}
                            </div>
                          )}
                          {(auditWaybillModalOrder.transitMode === "bike" || auditWaybillModalOrder.transitMode === "van" || auditWaybillModalOrder.transitMode === "truck") && (
                            <div className="text-emerald-400 font-mono text-[11px] pt-1 font-semibold space-y-0.5">
                              <div>Fleet: {auditWaybillModalOrder.localDelivery?.vehicleNumber || auditWaybillModalOrder.vehicleNo || "Active Vehicle"} · Rider: {auditWaybillModalOrder.localDelivery?.driverName || "Rakesh Sharma"}</div>
                              <div className="text-zinc-400 text-[10px]">Rider Phone: {auditWaybillModalOrder.localDelivery?.driverContact || "+91 98301 23456"} · Pkg: {auditWaybillModalOrder.localDelivery?.packageId || auditWaybillModalOrder.orderNumber}</div>
                              {auditWaybillModalOrder.localDelivery?.deliverySlot && (
                                <div className="text-zinc-500 text-[10px]">Slot: {auditWaybillModalOrder.localDelivery.deliverySlot} · Doorstep Handover</div>
                              )}
                            </div>
                          )}
                          {auditWaybillModalOrder.courierService && !auditWaybillModalOrder.localDelivery && (
                            <div className="text-purple-400 font-mono text-[11px] pt-1 font-semibold space-y-0.5">
                              <div>{auditWaybillModalOrder.courierService.providerName}</div>
                              <div className="text-zinc-400 text-[10px]">AWB: {auditWaybillModalOrder.courierService.trackingAwb}</div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">External Tracking Solution</span>
                          <div className="font-semibold text-emerald-400 text-xs">
                            {auditWaybillModalOrder.transitMode === "plane"
                              ? "FlightAware ADS-B Firehose / AeroAPI"
                              : auditWaybillModalOrder.transitMode === "train"
                                ? "FOIS / Indian Railways Electronic Freight Rake"
                                : auditWaybillModalOrder.transitMode === "ship"
                                  ? "AIS Maritime Container Telemetry / MarineTraffic"
                                  : "FASTag Toll Telemetry & Samsara IoT GPS"}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {auditWaybillModalOrder.transitMode === "truck"
                              ? "Highway toll plaza RFID pings track truck movement without physical GPS installation."
                              : "Multi-point carrier API integration."}
                          </div>
                        </div>
                      </div>

                      {/* Simulated Telemetry Ping Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                          <span className="text-zinc-500 text-[10px] block">COORDINATES</span>
                          <span className="text-zinc-200 font-bold">28.6139° N, 77.2090° E</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                          <span className="text-zinc-500 text-[10px] block">FLEET SPEED</span>
                          <span className="text-zinc-200 font-bold">64 km/h</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                          <span className="text-zinc-500 text-[10px] block">LAST TOLL/GATE PING</span>
                          <span className="text-emerald-400 font-bold">Palsit Toll Plaza</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                          <span className="text-zinc-500 text-[10px] block">PING LATENCY</span>
                          <span className="text-cyan-400 font-bold">180ms · OK</span>
                        </div>
                      </div>
                    </div>

                    {/* Whiteboard In/Out Paired Journey Logs */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Whiteboard In/Out Hub Cycle Logs</span>
                        </span>
                        <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800">
                          Structured Lifecycle
                        </span>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 max-h-48 overflow-y-auto">
                        {formatLogisticsJourneyLogs(auditWaybillModalOrder).map((step, sIdx) => (
                          <div key={sIdx} className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs font-mono">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-zinc-200">{step.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                step.status === "completed" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                step.status === "in_progress" ? "bg-purple-950 text-purple-300 border border-purple-700" :
                                step.status === "failed" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                                "bg-zinc-800 text-zinc-400"
                              }`}>
                                {step.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{step.details}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checkpoint Event Timeline */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        Consignment Checkpoint Audit Trail
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2.5 max-h-48 overflow-y-auto">
                        {[...(auditWaybillModalOrder.events || [])]
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((ev, i) => (
                            <div key={ev.id || i} className="flex items-start gap-2.5 text-xs">
                              <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-200">{ev.title}</span>
                                  {i === 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-mono text-[9px] uppercase border border-purple-500/40 font-bold">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400">{ev.description}</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5 text-zinc-500" />
                                  <span>{new Date(ev.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(ev.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                                  <span>·</span>
                                  <span>{ev.actor || "Logistics Terminal"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setAuditWaybillModalOrder(null)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs cursor-pointer transition"
                      >
                        Close Waybill Audit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Hub Discovery & Registration Modal */}
              {showRegisterHubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setShowRegisterHubModal(false)}
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          Discover & Register New Logistics Hub
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Dynamic Grid
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Dynamically expand the routing matrix with new regional corridors, industrial gateways, or local fulfillment clusters.
                        </p>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="mb-5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Quick Discover Templates:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            label: "Hyderabad [HYD]",
                            code: "HUB-HYD-01",
                            name: "Hyderabad South-Central Fulfillment Gateway",
                            region: "South-Central",
                            coverage: "Telangana, North Andhra Pradesh, and Hyderabad Urban Tech Zone.",
                            role: "High-throughput semiconductor and e-commerce regional transit bridge.",
                            type: "regional_gateway" as const,
                          },
                          {
                            label: "Patna [PAT]",
                            code: "HUB-PAT-01",
                            name: "Patna Bihar Freight Hub",
                            region: "East-Central",
                            coverage: "Bihar, Eastern UP, and border transit to Nepal.",
                            role: "Dedicated Bihar distribution node balancing the Lucknow corridor.",
                            type: "regional_gateway" as const,
                          },
                          {
                            label: "Jaipur [JAI]",
                            code: "HUB-JAI-01",
                            name: "Jaipur Western Logistics Park",
                            region: "North-West",
                            coverage: "Rajasthan, Southern Haryana, and Delhi Western Bypass.",
                            role: "Western industrial line-haul staging and handicraft export gateway.",
                            type: "regional_gateway" as const,
                          },
                          {
                            label: "Indore [IDR]",
                            code: "HUB-IDR-01",
                            name: "Indore Malwa Gateway",
                            region: "Central-West",
                            coverage: "Madhya Pradesh commercial cluster and Eastern Gujarat border.",
                            role: "Central industrial feeder linking Nagpur and Ahmedabad corridors.",
                            type: "regional_gateway" as const,
                          },
                          {
                            label: "Kochi [COK]",
                            code: "HUB-COK-01",
                            name: "Kochi Coastal & Maritime Gateway",
                            region: "South-Coastal",
                            coverage: "Kerala, Lakshadweep coastal maritime route, and Southern Tamil Nadu.",
                            role: "Deep-sea port interface and southern coastal express line-haul.",
                            type: "regional_gateway" as const,
                          },
                        ].map((preset) => (
                          <button
                            key={preset.code}
                            type="button"
                            onClick={() => {
                              setNewHubCode(preset.code);
                              setNewHubName(preset.name);
                              setNewHubRegion(preset.region);
                              setNewHubCoverage(preset.coverage);
                              setNewHubRole(preset.role);
                              setNewHubType(preset.type);
                              setNewHubCountry("India");
                            }}
                            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-purple-600/30 hover:border-purple-500/50 border border-zinc-700/60 text-zinc-300 hover:text-white transition cursor-pointer"
                          >
                            + {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleRegisterDynamicHub} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Hub Code <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. HUB-HYD-01"
                            value={newHubCode}
                            onChange={(e) => setNewHubCode(e.target.value.toUpperCase())}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                            required
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">Unique node identifier (HUB-XXX-01)</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Operational Hub Type
                          </label>
                          <select
                            value={newHubType}
                            onChange={(e) => setNewHubType(e.target.value as LogisticsHub["type"])}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value="regional_gateway">Regional Gateway (National Line-Haul)</option>
                            <option value="origin">Origin Warehouse (Manufacturing/Packaging)</option>
                            <option value="local_delivery">Local Delivery Hub (Doorstep Last-Mile)</option>
                            <option value="air_transit">Air Transit Gateway (Airport Air-Cargo)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Facility Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Hyderabad South-Central Hub"
                            value={newHubName}
                            onChange={(e) => setNewHubName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Region / Strategic Zone <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. South-Central, West-Industrial, North"
                            value={newHubRegion}
                            onChange={(e) => setNewHubRegion(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Coverage Area
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Covers Telangana, North Andhra Pradesh, and Hyderabad Urban"
                          value={newHubCoverage}
                          onChange={(e) => setNewHubCoverage(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">States, metropolitan zones, or districts covered by this hub</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Strategic Logistics Role
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Central distribution gateway connecting Deccan plateau to North-South line-haul"
                          value={newHubRole}
                          onChange={(e) => setNewHubRole(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">The primary function and role in the pan-India supply chain</p>
                      </div>

                      {/* Live Preview Card */}
                      {newHubCode && (
                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                {newHubCode}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {newHubName || "Facility Preview"}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                ⚡ Dynamic
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              {newHubCoverage || "Coverage area will appear here..."}
                            </p>
                            {newHubRole && (
                              <p className="text-[10px] text-purple-300/80 italic mt-0.5">
                                Role: {newHubRole}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {newHubType}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setShowRegisterHubModal(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isRegisteringHub || !newHubCode || !newHubName || !newHubRegion}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-2"
                        >
                          {isRegisteringHub ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Activating Hub...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activate Dynamic Hub</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETED ORDERS & TASK BREAKDOWN matching Screenshot 3 */}
          {activeTab === "orders" && (() => {
            const totalRevenueUsd = orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
            const totalUnitsBought = orders.reduce(
              (sum, ord) =>
                sum + (ord.items || []).reduce((iSum, i) => iSum + (Number(i.quantity) || 1), 0),
              0
            );
            const paidOrdersCount = orders.filter((ord) => (ord.paymentStatus || "").toLowerCase() === "paid").length;
            const aov = orders.length > 0 ? totalRevenueUsd / orders.length : 0;
            const totalRevenueInr = Math.round(totalRevenueUsd * exchangeRate);

            const filteredOrders = orders.filter((ord) => {
              if (!orderSearchQuery.trim()) return true;
              const q = orderSearchQuery.toLowerCase();
              const matchNumber = ord.orderNumber?.toLowerCase().includes(q);
              const matchCustomer =
                ord.customer?.fullName?.toLowerCase().includes(q) ||
                ord.customer?.email?.toLowerCase().includes(q) ||
                ord.customer?.contact?.toLowerCase().includes(q) ||
                ord.customer?.city?.toLowerCase().includes(q);
              const matchItem = ord.items?.some(
                (i) =>
                  i.name?.toLowerCase().includes(q) ||
                  i.variantName?.toLowerCase().includes(q) ||
                  i.componentSku?.toLowerCase().includes(q)
              );
              return matchNumber || matchCustomer || matchItem;
            }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            return (
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-zinc-200 p-4 sm:p-6 md:p-8 shadow-xs space-y-5 sm:space-y-6">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-600 shrink-0" />
                      <h3 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                        Order Buying Details & Analytics ({orders.length})
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Real-time order buying totals, customer records, and itemized variant sales aggregated from MongoDB Atlas.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleQuickDemoVerify}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold px-3 py-1.5 rounded-xl transition-colors"
                    >
                      ＋ Add Demo Verified Purchase
                    </button>
                  </div>
                </div>

                {/* Buying Totals & Analytics Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold">
                      TOTAL GROSS REVENUE
                    </span>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-zinc-950 truncate">
                      ${totalRevenueUsd.toFixed(2)}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 truncate">
                      ≈ ₹{totalRevenueInr.toLocaleString("en-IN")} INR
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold">
                      TOTAL UNITS BOUGHT
                    </span>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-blue-600 truncate">
                      {totalUnitsBought} <span className="text-xs font-normal text-zinc-500">items</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 truncate">Across all catalog variants</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold">
                      CONFIRMED PAID ORDERS
                    </span>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 truncate">
                      {paidOrdersCount}{" "}
                      <span className="text-xs font-normal text-zinc-400">/ {orders.length}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 truncate">
                      {orders.length > 0 ? `${Math.round((paidOrdersCount / orders.length) * 100)}% conversion rate` : "No orders"}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold">
                      AVG. ORDER VALUE (AOV)
                    </span>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-zinc-950 truncate">
                      ${aov.toFixed(2)}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 truncate">
                      ≈ ₹{Math.round(aov * exchangeRate).toLocaleString("en-IN")} INR
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search order #, customer, email, variant..."
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    Showing {filteredOrders.length} of {orders.length} order(s)
                  </div>
                </div>

                {/* Orders Table */}
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-xs">
                    No orders recorded yet. Place a test order via the checkout flow.
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    No orders match &quot;{orderSearchQuery}&quot;.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full min-w-[760px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 font-mono text-[11px]">
                          <th className="py-3 font-medium">ORDER #</th>
                          <th className="py-3 font-medium">CUSTOMER</th>
                          <th className="py-3 font-medium">ITEMS & VARIANTS</th>
                          <th className="py-3 font-medium">DELIVERY STATUS & HUB</th>
                          <th className="py-3 font-medium">PAYMENT</th>
                          <th className="py-3 font-medium">TOTAL</th>
                          <th className="py-3 font-medium text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredOrders.map((ord) => {
                          const isExpanded = expandedOrderId === ord.id || expandedOrderId === ord.orderNumber;
                          const edits = orderDeliveryEdits[ord.orderNumber] || {
                            deliveryStatus: ord.deliveryStatus || "processing",
                            currentHub: ord.currentHub || "Portland Primary Logistics Center",
                            trackingNumber: ord.trackingNumber || `TRK-${ord.orderNumber}`,
                            note: "",
                          };
                          const newEv = orderNewEvent[ord.orderNumber] || {
                            title: "",
                            description: "",
                          };

                          return (
                            <React.Fragment key={ord.id}>
                              <tr
                                id={`order-row-${ord.orderNumber}`}
                                className={`hover:bg-zinc-50/80 transition-colors ${isExpanded ? "bg-blue-50/30" : ""
                                  }`}
                              >
                                {/* 1. Order Number & Timestamp */}
                                <td className="py-3.5 font-mono font-bold text-zinc-900 align-top">
                                  <div className="text-blue-600 font-bold text-xs">{ord.orderNumber}</div>
                                  <div className="text-[10px] text-zinc-500 font-normal flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                    <span>
                                      {ord.createdAt
                                        ? `${new Date(ord.createdAt).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })} · ${new Date(ord.createdAt).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}`
                                        : "Recent"}
                                    </span>
                                  </div>
                                  <div className="pt-1">
                                    <span
                                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono ${ord.awsEventBridgeDispatched
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                      AWS-EB: {ord.awsEventBridgeDispatched ? "SYNC" : "PEND"}
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Customer Destination */}
                                <td className="py-3.5 text-zinc-700 align-top">
                                  <div className="font-semibold text-zinc-900">
                                    {ord.customer?.fullName || "Guest Customer"}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[180px]">
                                    {ord.customer?.email}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {ord.customer?.city && `${ord.customer.city}, `}
                                    {ord.customer?.country || "US"}
                                  </div>
                                </td>

                                {/* 3. Buying Details / Items & Variants */}
                                <td className="py-3.5 text-zinc-600 align-top">
                                  <div className="space-y-1 max-w-[220px]">
                                    {(ord.items || []).map((i, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-zinc-900">{i.name}</span>
                                        {i.variantName && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-mono">
                                            {i.variantName}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-zinc-400 font-mono">
                                          ×{i.quantity || 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                {/* 4. Delivery Status & Hub Location */}
                                <td className="py-3.5 align-top">
                                  <div className="space-y-1">
                                    {/* Cancellation Request Warning Badge */}
                                    {ord.cancellation?.status === "requested" && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>CANCEL REQUESTED</span>
                                      </div>
                                    )}

                                    {/* Delivery Status Badge */}
                                    <div>
                                      {ord.deliveryStatus === "cancelled" || ord.cancellation?.status === "approved" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                          <span>Cancelled</span>
                                        </span>
                                      ) : ord.deliveryStatus === "delivered" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Delivered</span>
                                        </span>
                                      ) : ord.deliveryStatus === "out_for_delivery" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          <Truck className="w-3 h-3 text-indigo-600" />
                                          <span>Out for Delivery</span>
                                        </span>
                                      ) : ord.deliveryStatus === "in_transit" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                          <Truck className="w-3 h-3 text-blue-600" />
                                          <span>In Transit</span>
                                        </span>
                                      ) : ord.deliveryStatus === "dispatched" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                          <span>Dispatched</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                          <span>Processing</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Hub & Tracking preview */}
                                    <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[190px]">
                                      {ord.currentHub || "Portland Primary Logistics Center"}
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-mono">
                                      #{ord.trackingNumber || `TRK-${ord.orderNumber}`}
                                    </div>
                                    {Array.isArray(ord.events) && ord.events.length > 0 && (() => {
                                      const latestEv = [...ord.events].sort(
                                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                      )[0];
                                      return (
                                        <div className="text-[9px] text-zinc-500 font-mono flex items-center gap-1 pt-0.5">
                                          <Clock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                          <span>
                                            {new Date(latestEv.timestamp).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                            })}{" "}
                                            ·{" "}
                                            {new Date(latestEv.timestamp).toLocaleTimeString("en-US", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </td>

                                {/* 5. Payment Status */}
                                <td className="py-3.5 align-top">
                                  {ord.paymentStatus === "refund_initiated" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                      <span>REFUND INITIATED</span>
                                    </span>
                                  ) : ord.paymentStatus === "refunded" ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                                      REFUNDED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      PAID (RAZORPAY)
                                    </span>
                                  )}
                                </td>

                                {/* 6. Total Amount */}
                                <td className="py-3.5 font-mono font-bold text-zinc-900 align-top">
                                  <div>${Number(ord.total || 0).toFixed(2)}</div>
                                  <div className="text-[10px] text-zinc-400 font-normal">
                                    ≈ ₹{Math.round(Number(ord.total || 0) * exchangeRate).toLocaleString("en-IN")}
                                  </div>
                                </td>

                                {/* 7. Open Controller Action */}
                                <td className="py-3.5 text-right align-top">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedOrderId(isExpanded ? null : ord.orderNumber || ord.id)
                                    }
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${isExpanded
                                      ? "bg-zinc-900 text-white hover:bg-black shadow-xs"
                                      : "border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800"
                                      }`}
                                  >
                                    <span>{isExpanded ? "Close" : "Open"}</span>
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Full Order Command Console */}
                              {isExpanded && (
                                <tr
                                  id={`order-console-${ord.orderNumber}`}
                                  className="bg-zinc-50/95 border-b border-zinc-200"
                                >
                                  <td colSpan={7} className="p-4 sm:p-6 space-y-5">
                                    {/* Console Header Bar */}
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-200 text-xs">
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                                        <span className="font-mono font-bold uppercase tracking-wider text-zinc-950 text-sm">
                                          Order Control Console · #{ord.orderNumber}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase bg-zinc-900 text-white shadow-xs">
                                          {ord.deliveryStatus?.replace(/_/g, " ") || "Processing"}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-500">
                                        <span className="flex items-center gap-1 text-zinc-700">
                                          <Calendar className="w-3 h-3 text-zinc-400" />
                                          <span>
                                            Placed:{" "}
                                            <strong className="text-zinc-900">
                                              {ord.createdAt
                                                ? `${new Date(ord.createdAt).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                })} · ${new Date(ord.createdAt).toLocaleTimeString("en-US", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  hour12: true,
                                                })}`
                                                : "Recent"}
                                            </strong>
                                          </span>
                                        </span>
                                        <span className="text-zinc-300">•</span>
                                        <span>Customer: <strong className="text-zinc-800">{ord.customer?.fullName}</strong></span>
                                        <span className="text-zinc-300">•</span>
                                        <span>Total: <strong className="text-zinc-800">${Number(ord.total || 0).toFixed(2)} USD</strong></span>
                                        <span className="text-zinc-300">•</span>
                                        <span>Gateway: <strong className="text-zinc-800">RAZORPAY</strong></span>
                                      </div>
                                    </div>

                                    {/* Cancellation Verification & Razorpay Refund Module */}
                                    <div className="space-y-3">
                                      {/* Alert 1: Customer Requested Cancellation (Awaiting Admin Review) */}
                                      {ord.cancellation?.status === "requested" && (
                                        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                                <span>Customer Order Cancellation Request Received</span>
                                              </div>
                                              <p className="text-xs text-amber-800 leading-relaxed">
                                                Reason: &quot;<strong>{ord.cancellation?.reason || "Customer requested"}</strong>&quot;
                                                {ord.cancellation?.requestedAt && (
                                                  <span className="text-[11px] font-mono text-amber-700 ml-2">
                                                    (Requested on {new Date(ord.cancellation.requestedAt).toLocaleString()})
                                                  </span>
                                                )}
                                              </p>
                                            </div>

                                            {/* Action Buttons to Approve or Reject */}
                                            <div className="flex items-center gap-2 shrink-0">
                                              <button
                                                type="button"
                                                disabled={isProcessingCancellation === ord.orderNumber}
                                                onClick={() => handleReviewCancellation(ord.orderNumber, "approved")}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                                              >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Approve Cancellation</span>
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isProcessingCancellation === ord.orderNumber}
                                                onClick={() => {
                                                  const notes = prompt("Enter optional reason for declining cancellation:") || "Order packed for dispatch.";
                                                  handleReviewCancellation(ord.orderNumber, "rejected", notes);
                                                }}
                                                className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Decline Request</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Alert 2: Cancellation Approved -> Trigger Razorpay Refund Button Appears! */}
                                      {(ord.cancellation?.status === "approved" || ord.deliveryStatus === "cancelled") &&
                                        ord.paymentStatus !== "refund_initiated" &&
                                        ord.paymentStatus !== "refunded" && (
                                          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                              <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                                                <span>Cancellation Approved · Razorpay Refund Trigger Active</span>
                                              </div>
                                              <p className="text-amber-800 text-xs leading-relaxed">
                                                Admin has verified and approved the cancellation. Click the button to request Razorpay to release the full payment of <strong>${Number(ord.total || 0).toFixed(2)} USD</strong> back to customer&apos;s account.
                                              </p>
                                            </div>

                                            {/* Dedicated Trigger Refund Button */}
                                            <button
                                              type="button"
                                              disabled={isProcessingRefund === ord.orderNumber}
                                              onClick={() => handleTriggerRefund(ord)}
                                              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer disabled:opacity-50"
                                            >
                                              {isProcessingRefund === ord.orderNumber ? (
                                                <>
                                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                  <span>Requesting Razorpay Gateway...</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Zap className="w-3.5 h-3.5 fill-white" />
                                                  <span>⚡ Trigger Razorpay Refund (${Number(ord.total || 0).toFixed(2)})</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        )}

                                      {/* Alert 3: Refund Initiated Confirmation (2-7 business days SLA) */}
                                      {ord.paymentStatus === "refund_initiated" && (
                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
                                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          </div>
                                          <div className="space-y-1 text-xs">
                                            <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                                              <span>Razorpay Refund Successfully Initiated</span>
                                              {ord.razorpayRefundId && (
                                                <span className="font-mono text-[11px] text-emerald-800 font-semibold px-2 py-0.5 rounded bg-emerald-100">
                                                  ID: {ord.razorpayRefundId}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-emerald-800 text-xs leading-relaxed">
                                              The refund is being initiated and will be sent back to the customer&apos;s account in <strong>2–7 business days</strong>. (Amount: ${Number(ord.refundAmount || ord.total || 0).toFixed(2)} USD)
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* 3-Column Command Console Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                                      {/* Column 1: Customer Destination & Items Allocation (5 cols) */}
                                      <div className="lg:col-span-5 space-y-4">
                                        {/* Destination Card */}
                                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2">
                                          <div className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase font-bold">
                                            DELIVERY DESTINATION & CUSTOMER
                                          </div>
                                          <div className="font-semibold text-zinc-900 text-sm">
                                            {ord.customer?.fullName}
                                          </div>
                                          <div className="text-zinc-600 font-mono text-[11px]">
                                            {ord.customer?.email}
                                          </div>
                                          {ord.customer?.contact && (
                                            <div className="text-zinc-500 font-mono text-[11px]">
                                              Phone: {ord.customer.contact}
                                            </div>
                                          )}
                                          <div className="text-zinc-600 pt-1 text-xs leading-relaxed border-t border-zinc-100 mt-2">
                                            <div>{ord.customer?.address}</div>
                                            <div>
                                              {ord.customer?.city}, {ord.customer?.state} {ord.customer?.zipCode}
                                            </div>
                                            <div className="font-semibold text-zinc-700">
                                              {ord.customer?.country || "United States"}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Items Breakdown Card */}
                                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2">
                                          <div className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase font-bold">
                                            ORDERED PRODUCTS & VARIANT ALLOCATION
                                          </div>
                                          <div className="divide-y divide-zinc-100">
                                            {(ord.items || []).map((it, itIdx) => (
                                              <div key={itIdx} className="py-2 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                  {it.image && (
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 relative bg-zinc-100 shrink-0">
                                                      <Image src={it.image} alt={it.name || "Product"} fill className="object-cover" />
                                                    </div>
                                                  )}
                                                  <div>
                                                    <div className="font-semibold text-zinc-900">{it.name}</div>
                                                    <div className="text-[10px] text-zinc-400 font-mono">
                                                      {it.variantName || it.variant || "Standard"}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="text-right font-mono text-xs">
                                                  <div className="font-bold text-zinc-900">
                                                    ${(Number(it.price || 0) * (Number(it.quantity) || 1)).toFixed(2)}
                                                  </div>
                                                  <div className="text-[10px] text-zinc-400">
                                                    {it.quantity || 1} × ${Number(it.price || 0).toFixed(2)}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Payment Reference Strip */}
                                          <div className="pt-2 border-t border-zinc-100 space-y-1 font-mono text-[10px] text-zinc-500">
                                            <div>Payment ID: <strong className="text-zinc-800">{ord.razorpayPaymentId || "pay_verified"}</strong></div>
                                            <div>Order ID: <strong className="text-zinc-800">{ord.razorpayOrderId || "order_live"}</strong></div>
                                          </div>
                                        </div>

                                        {/* Proof of Delivery (POD) Handover Verification Card */}
                                        {(() => {
                                          const pod = ord.podImages || ord.gateOtpSession?.podImages;
                                          const isDelivered = ord.deliveryStatus === "delivered";
                                          const hasPod = Boolean(pod?.labelImage || pod?.productImage);

                                          return (
                                            <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-xs">
                                              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                                                <div className="flex items-center gap-1.5">
                                                  <ShieldCheck className={`w-4 h-4 ${hasPod ? "text-emerald-600" : "text-zinc-400"}`} />
                                                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-zinc-800">
                                                    PROOF OF DELIVERY · HANDOVER INSPECTION
                                                  </span>
                                                </div>
                                                {hasPod ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Zero Damage Verified
                                                  </span>
                                                ) : isDelivered ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Delivered & OTP Verified
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200">
                                                    Pending Doorstep Gate
                                                  </span>
                                                )}
                                              </div>

                                              <p className="text-[11px] text-zinc-500 leading-snug">
                                                Delivery partner mandatory 2-photo verification captured upon handover. Inspect physical box condition to confirm intact seal and zero compromised damage.
                                              </p>

                                              {hasPod ? (
                                                <div className="space-y-2.5">
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {/* Image 1: Shipping Label & Consignment Seal */}
                                                    <div className="group relative rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden hover:border-blue-500 transition-all shadow-xs">
                                                      <div
                                                        onClick={() =>
                                                          pod?.labelImage &&
                                                          setPodModalImage({
                                                            src: pod.labelImage,
                                                            title: "Shipping Label & Barcode Inspection",
                                                            subtitle: `Consignment #${ord.orderNumber} · Carrier Handover Record`,
                                                            name: pod.labelImageName || "shipping-label.jpg",
                                                            size: pod.labelImageSize,
                                                          })
                                                        }
                                                        className="relative aspect-video w-full bg-zinc-900/5 cursor-pointer overflow-hidden flex items-center justify-center"
                                                      >
                                                        {pod?.labelImage ? (
                                                          // eslint-disable-next-line @next/next/no-img-element
                                                          <img
                                                            src={pod.labelImage}
                                                            alt="Shipping Label Proof"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                          />
                                                        ) : (
                                                          <div className="text-zinc-400 text-xs flex flex-col items-center gap-1">
                                                            <FileText className="w-5 h-5 text-zinc-400" />
                                                            <span>No label photo</span>
                                                          </div>
                                                        )}
                                                        {/* Overlay hover prompt */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold">
                                                          <Eye className="w-3.5 h-3.5" />
                                                          <span>Click Full Size</span>
                                                        </div>
                                                      </div>
                                                      <div className="p-2 bg-white space-y-0.5">
                                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                                          <span className="font-bold text-zinc-800 truncate">1. Shipping Label Sticker</span>
                                                          <span className="text-zinc-400">
                                                            {pod?.labelImageSize
                                                              ? `${(pod.labelImageSize / (1024 * 1024)).toFixed(2)} MB`
                                                              : "Verified"}
                                                          </span>
                                                        </div>
                                                        <div className="text-[9px] text-zinc-400 font-mono truncate">
                                                          {pod?.labelImageName || "label-sticker.jpg"}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Image 2: Physical Sealed Box Condition (No Damage Handover) */}
                                                    <div className="group relative rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden hover:border-blue-500 transition-all shadow-xs">
                                                      <div
                                                        onClick={() =>
                                                          pod?.productImage &&
                                                          setPodModalImage({
                                                            src: pod.productImage,
                                                            title: "Product Box & Physical Condition Inspection",
                                                            subtitle: `Zero-Damage Verification · Consignment #${ord.orderNumber}`,
                                                            name: pod.productImageName || "product-box.jpg",
                                                            size: pod.productImageSize,
                                                          })
                                                        }
                                                        className="relative aspect-video w-full bg-zinc-900/5 cursor-pointer overflow-hidden flex items-center justify-center"
                                                      >
                                                        {pod?.productImage ? (
                                                          // eslint-disable-next-line @next/next/no-img-element
                                                          <img
                                                            src={pod.productImage}
                                                            alt="Product Box Proof"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                          />
                                                        ) : (
                                                          <div className="text-zinc-400 text-xs flex flex-col items-center gap-1">
                                                            <Package className="w-5 h-5 text-zinc-400" />
                                                            <span>No product photo</span>
                                                          </div>
                                                        )}
                                                        {/* Overlay hover prompt */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold">
                                                          <Eye className="w-3.5 h-3.5" />
                                                          <span>Click Full Size</span>
                                                        </div>
                                                      </div>
                                                      <div className="p-2 bg-white space-y-0.5">
                                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                                          <span className="font-bold text-zinc-800 truncate">2. Intact Box Condition</span>
                                                          <span className="text-zinc-400">
                                                            {pod?.productImageSize
                                                              ? `${(pod.productImageSize / (1024 * 1024)).toFixed(2)} MB`
                                                              : "Verified"}
                                                          </span>
                                                        </div>
                                                        <div className="text-[9px] text-zinc-400 font-mono truncate">
                                                          {pod?.productImageName || "product-box.jpg"}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 text-[9px] font-mono text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                      <Check className="w-3 h-3 text-emerald-600" />
                                                      <span>Handover authenticated with 6-digit gate OTP</span>
                                                    </span>
                                                    <span>
                                                      {pod?.uploadedAt
                                                        ? new Date(pod.uploadedAt).toLocaleString("en-US", {
                                                          month: "short",
                                                          day: "numeric",
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                        })
                                                        : "Secured"}
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : isDelivered ? (
                                                <div className="p-3.5 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-center space-y-1">
                                                  <div className="text-[11px] font-semibold text-zinc-700 flex items-center justify-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Delivery Handover Verified & Completed</span>
                                                  </div>
                                                  <p className="text-[10px] text-zinc-500">
                                                    Proof records logged under Audit & Status Events timeline. Photos captured during doorstep terminal sync.
                                                  </p>
                                                </div>
                                              ) : (
                                                <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-dashed border-zinc-200 text-center space-y-1">
                                                  <div className="text-[11px] font-medium text-zinc-600 flex items-center justify-center gap-1.5">
                                                    <Camera className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span>Awaiting Doorstep Handover Photos</span>
                                                  </div>
                                                  <p className="text-[10px] text-zinc-400 max-w-sm mx-auto">
                                                    When the carrier arrives at customer address, 2 condition photos must be submitted with OTP to finalize handover.
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      {/* Column 2: Orders Delivery & Logistics Controller (4 cols) */}
                                      <div className="lg:col-span-4 space-y-4">
                                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3">
                                          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                                            <span className="text-[10px] font-mono tracking-wider text-purple-600 uppercase font-bold flex items-center gap-1.5">
                                              <Truck className="w-3.5 h-3.5" />
                                              <span>DELIVERY & TRANSIT CONTROL</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setDeliverySelectedOrderId(ord.orderNumber);
                                                setActiveTab("delivery");
                                              }}
                                              className="text-[10px] font-mono text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                            >
                                              Open Full Hub Console →
                                            </button>
                                          </div>

                                          {/* 1. Origin Actions (Clicked Here) */}
                                          {(() => {
                                            const isPacked =
                                              ord.deliveryStatus === "order_packed" ||
                                              ord.deliveryStatus === "dispatched" ||
                                              ord.deliveryStatus === "locations_arrive" ||
                                              ord.deliveryStatus === "in_transit" ||
                                              ord.deliveryStatus === "out_for_delivery" ||
                                              ord.deliveryStatus === "delivered";

                                            const isDispatched =
                                              ord.deliveryStatus === "dispatched" ||
                                              ord.deliveryStatus === "locations_arrive" ||
                                              ord.deliveryStatus === "in_transit" ||
                                              ord.deliveryStatus === "out_for_delivery" ||
                                              ord.deliveryStatus === "delivered";

                                            const hasHubArrived =
                                              ord.deliveryStatus === "locations_arrive" ||
                                              ord.deliveryStatus === "in_transit" ||
                                              ord.deliveryStatus === "out_for_delivery" ||
                                              ord.deliveryStatus === "delivered" ||
                                              ord.hubQueueStatus === "received" ||
                                              ord.hubQueueStatus === "sorting" ||
                                              ord.hubQueueStatus === "loading" ||
                                              ord.hubQueueStatus === "outgoing" ||
                                              Boolean(
                                                ord.route?.some(
                                                  (r) =>
                                                    r.status === "received" ||
                                                    r.status === "sorting" ||
                                                    r.status === "loading" ||
                                                    r.status === "dispatched" ||
                                                    r.status === "completed"
                                                )
                                              );

                                            const isOnWay =
                                              ord.deliveryStatus === "out_for_delivery" ||
                                              ord.deliveryStatus === "delivered" ||
                                              ord.hubQueueStatus === "outgoing" ||
                                              Boolean(
                                                ord.route?.some(
                                                  (r) => r.status === "dispatched" || r.status === "completed"
                                                )
                                              );

                                            const isDelivered = ord.deliveryStatus === "delivered";

                                            const isSavingPacked = edits.isSaving && edits.savingStatus === "order_packed";
                                            const isSavingDispatched = edits.isSaving && edits.savingStatus === "dispatched";

                                            // Extract recent hub/transit events for the live log below
                                            const hubEvents = (ord.events || [])
                                              .filter(
                                                (e) =>
                                                  e.type === "delivery" ||
                                                  e.title?.toLowerCase().includes("hub") ||
                                                  e.title?.toLowerCase().includes("dock") ||
                                                  e.title?.toLowerCase().includes("transit") ||
                                                  e.title?.toLowerCase().includes("rail") ||
                                                  e.title?.toLowerCase().includes("flight") ||
                                                  e.title?.toLowerCase().includes("dispatched") ||
                                                  e.title?.toLowerCase().includes("handover") ||
                                                  e.title?.toLowerCase().includes("received")
                                              )
                                              .sort(
                                                (a, b) =>
                                                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                              )
                                              .slice(0, 3);

                                            return (
                                              <div className="space-y-3.5">
                                                {/* Origin Warehouse Buttons (Clicked by Here) */}
                                                <div className="space-y-1.5">
                                                  <div className="flex items-center justify-between text-[10px] font-mono uppercase font-semibold">
                                                    <span className="text-zinc-600 font-bold">Origin Warehouse Actions</span>
                                                    <span className="text-purple-600 font-bold">Clicked Here</span>
                                                  </div>

                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {/* Button 1: Order Packed */}
                                                    <button
                                                      type="button"
                                                      disabled={edits.isSaving || isPacked}
                                                      onClick={() => handleQuickStatusUpdate(ord.orderNumber, "order_packed", "Order Packed")}
                                                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer disabled:cursor-default ${
                                                        isPacked
                                                          ? "bg-emerald-50/80 border-emerald-300 text-zinc-900 shadow-2xs"
                                                          : "bg-purple-50/50 border-purple-200 hover:bg-purple-100/60 hover:border-purple-400 text-zinc-800"
                                                      }`}
                                                    >
                                                      <div className="flex items-center justify-between w-full mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                          <div
                                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                              isPacked
                                                                ? "bg-emerald-600 text-white"
                                                                : "bg-purple-600 text-white"
                                                            }`}
                                                          >
                                                            {isPacked ? <Check className="w-3.5 h-3.5" /> : <Boxes className="w-3.5 h-3.5" />}
                                                          </div>
                                                          <span className="text-xs font-bold">Order Packed</span>
                                                        </div>
                                                        <div>
                                                          {isSavingPacked ? (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-purple-700 animate-pulse">
                                                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                              <span>Saving...</span>
                                                            </span>
                                                          ) : isPacked ? (
                                                            <span className="text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-0.5">
                                                              Done ✓
                                                            </span>
                                                          ) : (
                                                            <span className="text-[10px] font-mono font-bold text-purple-700 underline">
                                                              Click to Pack →
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <span className="text-[10px] text-zinc-500 leading-tight">
                                                        {isPacked
                                                          ? "Boxed, sealed & barcoded at warehouse"
                                                          : "Click when package is boxed and sealed"}
                                                      </span>
                                                    </button>

                                                    {/* Action 2: Hub Routing / Dispatched Flow */}
                                                    {isDispatched ? (
                                                      <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 text-zinc-900 flex flex-col justify-between shadow-2xs">
                                                        <div className="flex items-center justify-between w-full mb-1">
                                                          <div className="flex items-center gap-1.5">
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                                              <Check className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-xs font-bold">Order Dispatched</span>
                                                          </div>
                                                          <span className="text-[10px] font-mono font-bold text-emerald-700">Done ✓</span>
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500 leading-tight">
                                                          Dispatched to {ord.nextHub || "Next Transit Hub"} via {ord.transitMode?.toUpperCase() || "FLEET"} [{ord.vehicleNo || "Active"}]
                                                        </span>
                                                      </div>
                                                    ) : isPacked ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setDeliverySelectedOrderId(ord.orderNumber);
                                                          setWaybillScanInput(ord.orderNumber);
                                                          if (ord.currentHubId) setActiveHubId(ord.currentHubId);
                                                          setHubTab("sorting");
                                                          setActiveTab("delivery");
                                                        }}
                                                        className="p-2.5 rounded-xl border border-purple-400 bg-purple-600 hover:bg-purple-700 text-white font-bold text-left transition-all flex flex-col justify-between cursor-pointer shadow-md shadow-purple-600/20 active:scale-98 animate-pulse"
                                                      >
                                                        <div className="flex items-center justify-between w-full mb-1">
                                                          <div className="flex items-center gap-1.5">
                                                            <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                                                              <Boxes className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-xs font-bold text-white">Open Hub Sorting</span>
                                                          </div>
                                                          <span className="text-[10px] font-mono text-purple-200 flex items-center gap-0.5">
                                                            Assign Hub →
                                                          </span>
                                                        </div>
                                                        <span className="text-[10px] text-purple-100 leading-tight">
                                                          Assign next destination hub & fleet in Sorting Dock (auto-marks dispatched)
                                                        </span>
                                                      </button>
                                                    ) : (
                                                      <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 flex flex-col justify-between opacity-70">
                                                        <div className="flex items-center justify-between w-full mb-1">
                                                          <div className="flex items-center gap-1.5">
                                                            <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs font-bold">
                                                              <ArrowUpRight className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-xs font-bold text-zinc-500">Order Dispatch</span>
                                                          </div>
                                                          <span className="text-[10px] font-mono text-zinc-400">Locked</span>
                                                        </div>
                                                        <span className="text-[10px] text-zinc-400 leading-tight">
                                                          Awaiting packing before sorting destination can be assigned
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* 3. Telemetry Log Stream Below ("and those are just logged here below") */}
                                                <div className="pt-2 border-t border-zinc-100 space-y-2">
                                                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                                                    <span className="flex items-center gap-1 text-zinc-700 font-bold">
                                                      <Clock className="w-3 h-3 text-purple-600" />
                                                      <span>Hub Telemetry & Transit Logs</span>
                                                    </span>
                                                    <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                      Paired In/Out Hub Cycle
                                                    </span>
                                                  </div>

                                                  {/* Whiteboard In/Out Paired Steps */}
                                                  {(() => {
                                                    const pairedSteps = formatLogisticsJourneyLogs(ord);
                                                    return (
                                                      <div className="space-y-1.5 bg-zinc-50/90 p-2.5 rounded-xl border border-zinc-200/80">
                                                        {pairedSteps.map((step, sIdx) => {
                                                          const isDone = step.status === "completed";
                                                          const isActive = step.status === "in_progress";
                                                          const isFailed = step.status === "failed";

                                                          return (
                                                            <div
                                                              key={sIdx}
                                                              className={`p-2 rounded-lg border text-[10px] font-mono transition-all ${
                                                                isFailed
                                                                  ? "bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs"
                                                                  : isActive
                                                                  ? "bg-white border-purple-300 text-purple-950 shadow-xs ring-1 ring-purple-500/20"
                                                                  : isDone
                                                                  ? "bg-white border-zinc-200 text-zinc-800"
                                                                  : "bg-zinc-100/50 border-zinc-200/50 text-zinc-400"
                                                              }`}
                                                            >
                                                              <div className="flex items-start justify-between gap-1.5">
                                                                <div className="flex items-center gap-1.5 font-bold min-w-0">
                                                                  <span
                                                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                                                      isFailed
                                                                        ? "bg-rose-600 animate-pulse"
                                                                        : isActive
                                                                        ? "bg-purple-600 animate-ping"
                                                                        : isDone
                                                                        ? "bg-emerald-500"
                                                                        : "bg-zinc-300"
                                                                    }`}
                                                                  />
                                                                  <span
                                                                    className={`truncate ${
                                                                      isActive
                                                                        ? "text-purple-700 font-bold"
                                                                        : isFailed
                                                                        ? "text-rose-700 font-bold"
                                                                        : isDone
                                                                        ? "text-zinc-900"
                                                                        : "text-zinc-500"
                                                                    }`}
                                                                  >
                                                                    {step.title}
                                                                  </span>
                                                                </div>
                                                                <span
                                                                  className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                                                    isFailed
                                                                      ? "bg-rose-600 text-white"
                                                                      : isActive
                                                                      ? "bg-purple-600 text-white"
                                                                      : isDone
                                                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                                      : "bg-zinc-200 text-zinc-500"
                                                                  }`}
                                                                >
                                                                  {step.badge}
                                                                </span>
                                                              </div>
                                                              <div className="text-[9px] text-zinc-500 mt-1 pl-3.5 leading-snug font-sans">
                                                                {step.details}
                                                              </div>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    );
                                                  })()}

                                                  {/* Expandable Raw Telemetry Stream */}
                                                  {hubEvents.length > 0 && (
                                                    <details className="text-[9px] font-mono text-zinc-500 pt-0.5 group">
                                                      <summary className="cursor-pointer hover:text-zinc-700 font-semibold select-none flex items-center justify-between text-zinc-400">
                                                        <span>▸ Raw Hub Checkpoint Entries ({hubEvents.length})</span>
                                                        <span className="group-open:rotate-180 transition-transform text-[8px]">▼</span>
                                                      </summary>
                                                      <div className="mt-1 space-y-1 bg-zinc-50/70 p-2 rounded-lg border border-zinc-200 max-h-36 overflow-y-auto">
                                                        {hubEvents.map((ev, i) => (
                                                          <div key={i} className="flex items-start justify-between gap-2 text-[9px] font-mono">
                                                            <div className="flex items-start gap-1 min-w-0">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1" />
                                                              <div className="min-w-0">
                                                                <div className="font-semibold text-zinc-700 truncate">{ev.title}</div>
                                                                <div className="text-[8px] text-zinc-400 truncate">{ev.description}</div>
                                                              </div>
                                                            </div>
                                                            <span className="text-[8px] text-zinc-400 shrink-0">
                                                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </details>
                                                  )}

                                                  <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                                    <span className="flex items-center gap-1">
                                                      <MapPin className="w-3 h-3 text-purple-500" />
                                                      <span>Station: {ord.currentHub || "Main Logistics Facility"}</span>
                                                    </span>
                                                    <span className="font-semibold text-zinc-600">TRK: #{ord.trackingNumber || `TRK-${ord.orderNumber}`}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      {/* Column 3: Live Audit Events Timeline & Custom Note (3 cols) */}
                                      <div className="lg:col-span-3 space-y-4">
                                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3">
                                          {(() => {
                                            const sortedEvents = [...(ord.events || [])].sort(
                                              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                            );

                                            return (
                                              <>
                                                <div className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-bold flex items-center justify-between pb-1 border-b border-zinc-100">
                                                  <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span>AUDIT & STATUS EVENTS ({sortedEvents.length})</span>
                                                  </div>
                                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                                    Latest on top
                                                  </span>
                                                </div>

                                                {/* Events Chronological Feed (Newest on top) */}
                                                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                                  {sortedEvents.length > 0 ? (
                                                    sortedEvents.map((ev, evIdx) => {
                                                      const isLatest = evIdx === 0;
                                                      const evDate = new Date(ev.timestamp);
                                                      const formattedDate = evDate.toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                      });
                                                      const formattedTime = evDate.toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit",
                                                        hour12: true,
                                                      });

                                                      return (
                                                        <div
                                                          key={ev.id || `${ev.timestamp}-${evIdx}`}
                                                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${isLatest
                                                            ? "bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-500/10"
                                                            : "bg-zinc-50 hover:bg-white border-zinc-100"
                                                            }`}
                                                        >
                                                          <div className="flex items-start justify-between gap-1.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                              {isLatest && (
                                                                <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono font-bold text-[8px] uppercase tracking-wider shrink-0">
                                                                  LATEST
                                                                </span>
                                                              )}
                                                              <span className={`font-bold truncate text-[11px] ${isLatest ? "text-blue-950 font-sans" : "text-zinc-900"}`}>
                                                                {ev.title}
                                                              </span>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                              <div className="text-[10px] font-mono font-semibold text-zinc-800 flex items-center gap-1 justify-end">
                                                                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                                                <span>{formattedTime}</span>
                                                              </div>
                                                              <div className="text-[9px] font-mono text-zinc-400">
                                                                {formattedDate}
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <p className="text-[11px] text-zinc-600 leading-snug">{ev.description}</p>

                                                          <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-zinc-500">
                                                            {ev.actor ? (
                                                              <span className="inline-block px-1.5 py-0.2 rounded bg-zinc-200/70 text-zinc-700">
                                                                By: {ev.actor}
                                                              </span>
                                                            ) : (
                                                              <span className="inline-block px-1.5 py-0.2 rounded bg-zinc-200/70 text-zinc-700">
                                                                By: System
                                                              </span>
                                                            )}
                                                            {ev.type && (
                                                              <span className="uppercase tracking-wider text-[8px] px-1 py-0.2 rounded border border-zinc-200 text-zinc-400">
                                                                {ev.type}
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })
                                                  ) : (
                                                    <div className="text-zinc-400 text-[11px] text-center py-4">No events logged yet</div>
                                                  )}
                                                </div>
                                              </>
                                            );
                                          })()}

                                          {/* Quick Add Event Note */}
                                          <div className="pt-2 border-t border-zinc-100 space-y-2">
                                            <input
                                              type="text"
                                              value={newEv.title || ""}
                                              onChange={(e) =>
                                                setOrderNewEvent((prev) => ({
                                                  ...prev,
                                                  [ord.orderNumber]: { ...prev[ord.orderNumber], title: e.target.value },
                                                }))
                                              }
                                              placeholder="Checkpoint title..."
                                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none"
                                            />
                                            <input
                                              type="text"
                                              value={newEv.description || ""}
                                              onChange={(e) =>
                                                setOrderNewEvent((prev) => ({
                                                  ...prev,
                                                  [ord.orderNumber]: { ...prev[ord.orderNumber], description: e.target.value },
                                                }))
                                              }
                                              placeholder="Checkpoint description..."
                                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none"
                                            />
                                            <button
                                              type="button"
                                              disabled={newEv.isAdding}
                                              onClick={() => handleAddOrderEvent(ord.orderNumber)}
                                              className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                                            >
                                              {newEv.isAdding ? "Logging..." : "+ Log Checkpoint Note"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: THE VARIATION ENGINE */}
          {activeTab === "variation-engine" && (
            <form onSubmit={handleSaveVariationEngine} className="space-y-8 animate-in fade-in duration-200">
              {/* Master Product Header */}
              <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xl font-bold text-zinc-950 font-sans">
                        The Variation Engine: Master Product Configuration
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Define parent product parameters and link dynamic child variants with specialized hardware features and stock allocations.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingVariants}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingVariants ? "Saving Engine..." : "Save Master & Child Variants"}</span>
                  </button>
                </div>

                {/* Master Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Root Product Code (productId)
                    </label>
                    <input
                      type="text"
                      value={masterProductId}
                      onChange={(e) => setMasterProductId(e.target.value)}
                      placeholder="e.g. ANC-AIR-TWS"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-zinc-900 bg-zinc-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Product Name</label>
                    <input
                      type="text"
                      value={masterName}
                      onChange={(e) => setMasterName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 bg-zinc-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Audio Category Type</label>
                    <select
                      value={masterType}
                      onChange={(e) => setMasterType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                    >
                      <option value="Over-Ear Headphones">Over-Ear Headphones</option>
                      <option value="TWS Earbuds">TWS Earbuds</option>
                      <option value="Wireless Earphones">Wireless Earphones</option>
                      <option value="Studio Reference Monitors">Studio Reference Monitors</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-semibold text-zinc-700">Description</label>
                    <textarea
                      rows={2}
                      value={masterDescription}
                      onChange={(e) => setMasterDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                    />
                  </div>

                  {/* Master Pricing & Dual-Currency Studio */}
                  <div className="sm:col-span-3 p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-zinc-50 to-zinc-50 border border-blue-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold font-mono shadow-xs">
                          ₹/$
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-950 font-sans flex items-center gap-2">
                            <span>Master Pricing & Currency Converter Studio</span>
                            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              Live Dual-Sync
                            </span>
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            Change in USD or INR automatically syncs the other. Test micro-transactions on Razorpay by entering ₹1 or ₹5.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-zinc-200 shadow-2xs">
                          <span className="text-[11px] font-semibold text-zinc-500">Rate:</span>
                          <span className="text-xs font-mono font-bold text-zinc-800">1 USD = ₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(Number(e.target.value) || 95.26)}
                            className="w-16 text-xs font-mono font-bold text-blue-700 bg-transparent focus:outline-none"
                            title="Exchange rate"
                          />
                        </div>

                        {/* Currency Mode Switcher */}
                        <div className="flex items-center p-0.5 rounded-xl bg-zinc-200/70 border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => setAdminCurrencyMode("USD")}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${adminCurrencyMode === "USD"
                              ? "bg-white text-zinc-900 shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900"
                              }`}
                          >
                            $ USD
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminCurrencyMode("INR")}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${adminCurrencyMode === "INR"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900"
                              }`}
                          >
                            ₹ INR
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dual Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* USD Price */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                          <span>Base Price (USD $)</span>
                          <span className="text-[10px] font-mono text-zinc-400">Global Storefront</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={masterBasePrice}
                            onChange={(e) => handleBasePriceChangeUSD(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-mono font-bold text-zinc-900 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* INR Price */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                          <span>Base Price (INR ₹)</span>
                          <span className="text-[10px] font-mono text-blue-600 font-bold">Razorpay Test</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={
                              masterBasePrice === 0
                                ? 0
                                : masterBasePrice < 1
                                  ? Number((masterBasePrice * exchangeRate).toFixed(2))
                                  : Math.round(masterBasePrice * exchangeRate)
                            }
                            onChange={(e) => handleBasePriceChangeINR(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-200 text-sm font-mono font-bold text-blue-900 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Discount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Base Master Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={masterBaseDiscount}
                          onChange={(e) => setMasterBaseDiscount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-mono text-zinc-900 bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Quick Razorpay Testing Presets & Cascade Controls */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-100/70">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mr-1">
                          ⚡ Quick Test Presets:
                        </span>
                        {[1, 5, 10, 50].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickRazorpayTestPreset(amt)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title={`Set price to ₹${amt} and cascade across all variants`}
                          >
                            ₹{amt} Test
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setMasterBasePrice(349);
                            setQuickPriceInput(349);
                            handleCascadePriceToAllVariants(349, Math.round(349 * exchangeRate));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer"
                          title="Reset to default $349"
                        >
                          Reset ($349)
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoCascadePrice}
                            onChange={(e) => setAutoCascadePrice(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span>Auto-cascade to all variants</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleCascadePriceToAllVariants(masterBasePrice)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          title="Force cascade this price across all architecture and colorway variants"
                        >
                          <span>⚡ Cascade to All Variants</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Global Specs Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                      Shared Global Specifications (All Variants)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSpecRow}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      ＋ Add Spec Attribute
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {globalSpecsList.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(idx, e.target.value, spec.value)}
                          placeholder="Spec Name"
                          className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-medium text-zinc-800"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(idx, spec.key, e.target.value)}
                          placeholder="Specification Value"
                          className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(idx)}
                          className="text-zinc-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hierarchical Variant Architecture & Colorway Studio */}
              <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 font-sans flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      <span>Variant Architecture & Colorway Studio ({variantGroups.length} Architectures Active)</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Model multiple variant architectures (e.g. A1 Regular Fit, A2 Streetwear Oversized Cut). Each architecture contains multiple colorways with their own stock counters, SKUs, and photography.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddArchitectureGroup}
                    className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Variant Architecture (A{variantGroups.length + 1})</span>
                  </button>
                </div>

                {/* Architectures Container */}
                <div className="space-y-6">
                  {variantGroups.map((group, gIdx) => {
                    const groupUnits = group.colors.reduce((sum, c) => sum + (c.stock || 0), 0);

                    return (
                      <div
                        key={group.id}
                        className="p-5 sm:p-6 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-5 transition-all shadow-2xs"
                      >
                        {/* Architecture Group Header Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                              {group.id}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                                  Architecture Cut #{gIdx + 1}
                                </span>
                                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                  {group.colors.length} {group.colors.length === 1 ? "colorway" : "colorways"}
                                </span>
                                <span className="text-[10px] font-mono bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full font-bold">
                                  {groupUnits} units total
                                </span>
                              </div>
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) => handleUpdateArchitectureName(group.id, e.target.value)}
                                placeholder="e.g. A1 (Regular Fit) or A2 (Oversized Cut)"
                                className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg mt-1 w-full sm:w-80 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                            <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-2 py-1 shadow-2xs">
                              <span className="text-[10px] font-bold text-zinc-400 font-mono">$</span>
                              <input
                                type="number"
                                step="any"
                                value={group.price ?? masterBasePrice}
                                onChange={(e) => handleUpdateArchitecturePrice(group.id, Number(e.target.value))}
                                className="w-16 text-xs font-mono font-bold text-zinc-900 bg-transparent focus:outline-none"
                                title="Architecture Price in USD"
                              />
                            </div>

                            <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-1 shadow-2xs">
                              <span className="text-[10px] font-bold text-blue-600 font-mono">₹</span>
                              <input
                                type="number"
                                step="any"
                                value={
                                  group.priceInr ??
                                  (group.price
                                    ? (group.price < 1 ? Number((group.price * exchangeRate).toFixed(2)) : Math.round(group.price * exchangeRate))
                                    : (masterBasePrice < 1 ? Number((masterBasePrice * exchangeRate).toFixed(2)) : Math.round(masterBasePrice * exchangeRate)))
                                }
                                onChange={(e) => {
                                  const inr = Number(e.target.value);
                                  const usd = Number((inr / exchangeRate).toFixed(2));
                                  handleUpdateArchitecturePrice(group.id, usd, inr);
                                }}
                                className="w-20 text-xs font-mono font-bold text-blue-900 bg-transparent focus:outline-none"
                                title="Architecture Price in INR"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveArchitectureGroup(group.id)}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Arch</span>
                            </button>
                          </div>
                        </div>

                        {/* Colorways Nested in this Architecture */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                              Colorways & Stock for {group.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddColorToArchitecture(group.id, `Color ${group.colors.length + 1}`, 5)}
                              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Color to {group.id}</span>
                            </button>
                          </div>

                          {group.colors.map((colorItem, cIdx) => (
                            <div
                              key={colorItem.sku || cIdx}
                              className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-4"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                    style={{ backgroundColor: colorItem.hex || "#333" }}
                                  />
                                  <span className="text-xs font-bold text-zinc-900">
                                    {colorItem.color || "Untitled Color"}
                                  </span>
                                  <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                                    {colorItem.sku}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorFromArchitecture(group.id, cIdx)}
                                  className="text-xs text-zinc-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove Color</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Color Name + Swatch Picker */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-600">Colorway Name</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={colorItem.hex || "#22252A"}
                                      onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "hex", e.target.value)}
                                      className="w-7 h-7 rounded border border-zinc-200 p-0 cursor-pointer shrink-0"
                                      title="Choose color hex"
                                    />
                                    <input
                                      type="text"
                                      value={colorItem.color}
                                      onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "color", e.target.value)}
                                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-semibold focus:bg-white"
                                    />
                                  </div>
                                </div>

                                {/* SKU */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-600">SKU (Stock Keeping Unit)</label>
                                  <input
                                    type="text"
                                    value={colorItem.sku}
                                    onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "sku", e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white"
                                  />
                                </div>

                                {/* Price Override (USD & INR) */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-600 flex items-center justify-between">
                                    <span>Color Price</span>
                                    <span className="text-[9px] font-mono text-zinc-400">$ / ₹</span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 focus-within:bg-white focus-within:border-blue-400">
                                      <span className="text-[10px] font-bold text-zinc-400 font-mono">$</span>
                                      <input
                                        type="number"
                                        step="any"
                                        value={colorItem.price ?? group.price ?? masterBasePrice}
                                        onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "price", Number(e.target.value))}
                                        className="w-full text-xs font-mono font-bold text-zinc-900 bg-transparent focus:outline-none"
                                        title="Color price in USD"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 bg-zinc-50 border border-blue-200 rounded-lg px-2 py-1 focus-within:bg-white focus-within:border-blue-400">
                                      <span className="text-[10px] font-bold text-blue-600 font-mono">₹</span>
                                      <input
                                        type="number"
                                        step="any"
                                        value={
                                          colorItem.priceInr ??
                                          (colorItem.price
                                            ? (colorItem.price < 1 ? Number((colorItem.price * exchangeRate).toFixed(2)) : Math.round(colorItem.price * exchangeRate))
                                            : (group.priceInr ?? (masterBasePrice < 1 ? Number((masterBasePrice * exchangeRate).toFixed(2)) : Math.round(masterBasePrice * exchangeRate))))
                                        }
                                        onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "priceInr", Number(e.target.value))}
                                        className="w-full text-xs font-mono font-bold text-blue-900 bg-transparent focus:outline-none"
                                        title="Color price in INR"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Real-time Inventory */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-zinc-600">Real-Time Units (Stock)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={colorItem.stock}
                                    onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "stock", Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 focus:bg-white"
                                  />
                                </div>
                              </div>

                              {/* Photography & Angles for this Color */}
                              <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[11px] font-bold text-zinc-800">
                                      Photography ({(colorItem.images || []).length} Attached)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <label
                                      htmlFor={`upload-color-${group.id}-${cIdx}`}
                                      className="cursor-pointer inline-flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>{uploadingColorKey === `${group.id}-${cIdx}` ? "Uploading S3..." : "Direct S3 Upload"}</span>
                                    </label>
                                    <input
                                      id={`upload-color-${group.id}-${cIdx}`}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      disabled={uploadingColorKey === `${group.id}-${cIdx}`}
                                      onChange={(e) => handleColorDirectS3Upload(group.id, cIdx, e)}
                                      className="hidden"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleAddImageToColor(group.id, cIdx)}
                                      className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-1 rounded-md border border-zinc-200 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Angle</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Thumbnails with Drag & Drop Reordering */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                    <span>Drag cards or click arrows to reorder. First photo is the primary cover.</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {(colorItem.images && colorItem.images.length > 0 ? colorItem.images : ["/images/hero-silver.jpg"]).map(
                                      (imgUrl, imgIdx) => {
                                        const isDraggingThis =
                                          draggedImage?.groupId === group.id &&
                                          draggedImage?.colorIndex === cIdx &&
                                          draggedImage?.imgIndex === imgIdx;
                                        const isDragOverThis =
                                          dragOverImage?.groupId === group.id &&
                                          dragOverImage?.colorIndex === cIdx &&
                                          dragOverImage?.imgIndex === imgIdx;

                                        return (
                                          <div
                                            key={imgIdx}
                                            draggable
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData("text/plain", `${imgIdx}`);
                                              setDraggedImage({ groupId: group.id, colorIndex: cIdx, imgIndex: imgIdx });
                                            }}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              e.dataTransfer.dropEffect = "move";
                                              setDragOverImage({ groupId: group.id, colorIndex: cIdx, imgIndex: imgIdx });
                                            }}
                                            onDragLeave={() => {
                                              if (dragOverImage?.imgIndex === imgIdx) setDragOverImage(null);
                                            }}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              if (
                                                draggedImage &&
                                                draggedImage.groupId === group.id &&
                                                draggedImage.colorIndex === cIdx
                                              ) {
                                                handleReorderImagesInColor(group.id, cIdx, draggedImage.imgIndex, imgIdx);
                                              }
                                              setDraggedImage(null);
                                              setDragOverImage(null);
                                            }}
                                            onDragEnd={() => {
                                              setDraggedImage(null);
                                              setDragOverImage(null);
                                            }}
                                            className={`p-1.5 rounded-lg border transition-all duration-150 space-y-1 relative group cursor-grab active:cursor-grabbing ${
                                              isDraggingThis
                                                ? "opacity-30 border-dashed border-blue-400 bg-blue-50/30"
                                                : isDragOverThis
                                                ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50 scale-105 z-10 shadow-md"
                                                : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                                            }`}
                                          >
                                            <div className="relative aspect-square rounded bg-white overflow-hidden flex items-center justify-center">
                                              <img
                                                src={imgUrl}
                                                alt={`${colorItem.color} angle ${imgIdx + 1}`}
                                                className="w-full h-full object-contain p-0.5 pointer-events-none select-none"
                                              />

                                              {/* Badge: Primary / Order */}
                                              {imgIdx === 0 ? (
                                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-2xs select-none pointer-events-none">
                                                  ★ Cover
                                                </span>
                                              ) : (
                                                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1 py-0.2 rounded select-none pointer-events-none">
                                                  #{imgIdx + 1}
                                                </span>
                                              )}

                                              {/* Remove button */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveImageFromColor(group.id, cIdx, imgIdx);
                                                }}
                                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded transition-colors"
                                                title="Remove photo"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>

                                              {/* Drag Handle & Arrow Controls */}
                                              <div className="absolute bottom-1 inset-x-1 flex items-center justify-between pointer-events-auto">
                                                <span
                                                  className="p-0.5 rounded bg-white/90 hover:bg-white text-zinc-600 shadow-2xs"
                                                  title="Drag to rearrange order"
                                                >
                                                  <GripVertical className="w-3 h-3" />
                                                </span>

                                                <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur rounded p-0.5 shadow-2xs border border-zinc-200">
                                                  {imgIdx > 0 && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReorderImagesInColor(group.id, cIdx, imgIdx, imgIdx - 1);
                                                      }}
                                                      className="hover:bg-zinc-200 p-0.5 rounded text-zinc-700"
                                                      title="Move left"
                                                    >
                                                      <ArrowLeft className="w-2.5 h-2.5" />
                                                    </button>
                                                  )}
                                                  {imgIdx < (colorItem.images?.length || 1) - 1 && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                      }}
                                                      onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        handleReorderImagesInColor(group.id, cIdx, imgIdx, imgIdx + 1);
                                                      }}
                                                      className="hover:bg-zinc-200 p-0.5 rounded text-zinc-700"
                                                      title="Move right"
                                                    >
                                                      <ArrowRight className="w-2.5 h-2.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <input
                                              type="text"
                                              value={imgUrl}
                                              onChange={(e) => handleUpdateImageInColor(group.id, cIdx, imgIdx, e.target.value)}
                                              className="w-full px-1.5 py-0.5 text-[9px] font-mono bg-white border border-zinc-200 rounded text-zinc-600 focus:outline-none"
                                            />
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Prominent Add Color to Architecture Button */}
                        <button
                          type="button"
                          onClick={() => handleAddColorToArchitecture(group.id, `Color ${group.colors.length + 1}`, 5)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add More Colors to {group.name}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleAddArchitectureGroup}
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-900 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>+ Add New Variant Architecture (A{variantGroups.length + 1})</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingVariants}
                    className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingVariants ? "Persisting Changes..." : "Save All & Revalidate Edge ISR"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: CUSTOMER REVIEWS & MEDIA PIPELINE */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-950 font-sans flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Customer Reviews & 5-Photo Media Pipeline</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Conditional verification requires active JWT + verified order. Media uploads directly to S3 via presigned URLs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${selectedSlug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3.5 py-2 rounded-xl transition-colors"
                    >
                      <span>View on Storefront</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={handleQuickDemoVerify}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
                    >
                      ＋ Grant Verified Order
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id || rev.reviewId}
                      className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified Buyer
                          </span>
                        </div>

                        <p className="text-xs text-zinc-800 leading-relaxed font-sans">
                          {rev.comment}
                        </p>

                        {/* Photo Gallery (Max 5 photos) */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="pt-2">
                            <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              <span>{rev.images.length} Verified Media Asset(s)</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto py-1">
                              {rev.images.map((imgUrl, i) => (
                                <div
                                  key={i}
                                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 shrink-0"
                                >
                                  <Image
                                    src={imgUrl}
                                    alt={`Review Photo ${i + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
                        <div>
                          <span className="font-bold text-zinc-900">{rev.author || rev.userName}</span>
                          <span className="text-zinc-400"> · {rev.variant || "Form 01"}</span>
                        </div>
                        <span className="font-mono">{rev.createdAt || "Recent"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OWNER TEAM ACCESS & ROLE ASSIGNMENT */}
          {activeTab === "team" && isOwner && (
            <div className="space-y-6">
              {/* Top Control Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                        Owner Operations Console · Team Access & Permissions
                      </h2>
                      <p className="text-xs text-zinc-600">
                        Search employees by email and dynamically grant or revoke Admin permissions in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Root Owner Authority: Active</span>
                    </span>
                  </div>
                </div>

                {/* Architecture Steps Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Employee Sign Up</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      When employees create an account on ancwave, their account is initialized with default{" "}
                      <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-bold">
                        role: &quot;user&quot;
                      </code>
                      .
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Grant Admin Access</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Search their email below and click{" "}
                      <strong className="text-emerald-700 font-semibold">&quot;Grant Admin Access&quot;</strong>. They gain access to manage inventory, variations, and review pipelines.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                        3
                      </span>
                      <span>Revoke Anytime</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Click{" "}
                      <strong className="text-red-700 font-semibold">&quot;Revoke Admin&quot;</strong>{" "}
                      to instantly demote them back to user. Root Owner accounts are managed directly in MongoDB Atlas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar & Teammates Directory */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teamSearchQuery}
                      onChange={(e) => {
                        setTeamSearchQuery(e.target.value);
                        fetchTeam(e.target.value);
                      }}
                      placeholder="Search teammate by email (e.g. employee@ancwave.com) or full name..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-zinc-50/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchTeam(teamSearchQuery)}
                      disabled={isSearchingTeam}
                      className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSearchingTeam ? "animate-spin" : ""}`} />
                      <span>Search Directory</span>
                    </button>
                    {teamSearchQuery && (
                      <button
                        onClick={() => {
                          setTeamSearchQuery("");
                          fetchTeam("");
                        }}
                        className="px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-medium transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Teammates List Table */}
                <div className="overflow-x-auto rounded-2xl border border-zinc-200/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Employee / Teammate</th>
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Current Role</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {teamUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-zinc-400">
                            {isSearchingTeam ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                <span>Querying accounts in database...</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-semibold text-zinc-700">No matching accounts found</p>
                                <p className="text-[11px] text-zinc-400">
                                  {teamSearchQuery
                                    ? `No registered user matches "${teamSearchQuery}". Ask your teammate to sign up on the site first.`
                                    : "Click 'Search Directory' to list registered accounts."}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        teamUsers.map((u) => {
                          const isThisUserOwner = u.role === "owner";
                          const isThisUserAdmin = u.role === "admin";
                          const isBusy = isUpdatingRole === u.email;

                          return (
                            <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                    {u.name?.slice(0, 2).toUpperCase() || "EM"}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {u.email.toLowerCase() === user.email.toLowerCase() && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                                          YOU
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-mono text-zinc-500">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <code className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                                  {u.id}
                                </code>
                              </td>

                              <td className="py-3.5 px-4">
                                {isThisUserOwner ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    <span>Owner</span>
                                  </span>
                                ) : isThisUserAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    <span>Admin</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                    <UserIcon className="w-3 h-3 text-zinc-400" />
                                    <span>User</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                {isThisUserOwner ? (
                                  <span className="text-[11px] font-medium text-zinc-400 italic">
                                    Root Account (Atlas Managed)
                                  </span>
                                ) : isThisUserAdmin ? (
                                  <button
                                    onClick={() => handleUpdateUserRole(u.email, "user")}
                                    disabled={isBusy}
                                    className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span>{isBusy ? "Revoking..." : "Revoke Admin Access"}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateUserRole(u.email, "admin")}
                                    disabled={isBusy}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    <span>{isBusy ? "Assigning..." : "Grant Admin Access"}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODAL 1: VARIANT RESTOCK POPUP MODAL
          Allows restocking variant by variant, color by color (e.g., A1 green: 5, black: 2, blue: 4; A2 white: 8, green: 7)
          ========================================================================= */}
      {isRestockModalOpen && restockTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                      Restock Variants & Colors
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                      {restockTargetProduct.category || "General Goods"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">
                    Product: <span className="font-semibold text-zinc-900">{restockTargetProduct.name}</span> ({restockTargetProduct.productId || restockTargetProduct.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable list of variants grouped by Architecture/Fit */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-zinc-600 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-blue-950">Precise Inventory Control</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Never blindly guess which variant is restocked. Adjust quantity counters directly for each architecture and colorway. Live total will be recalculated automatically and pushed to edge CloudFront caches.
                  </p>
                </div>
              </div>

              {/* Group variants by specOverride (Architecture e.g. A1, A2) */}
              {(() => {
                const variantsList: IVariant[] = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                  ? restockTargetProduct.childVariants
                  : (restockTargetProduct.variants || []).map((v, i) => ({
                    sku: `${restockTargetProduct.productId || restockTargetProduct.id.toUpperCase()}-VAR-${i + 1}`,
                    color: v.name,
                    specOverride: "Standard Architecture",
                    price: restockTargetProduct.price,
                    discount: 0,
                    stock: Math.max(1, Math.floor(restockTargetProduct.stock / Math.max(1, restockTargetProduct.variants.length))),
                    images: [v.image],
                    restockProcess: undefined,
                  }));

                // Group by specOverride
                const groups: Record<string, typeof variantsList> = {};
                variantsList.forEach((v) => {
                  const arch = v.specOverride || "Standard Edition";
                  if (!groups[arch]) groups[arch] = [];
                  groups[arch].push(v);
                });

                return Object.entries(groups).map(([archName, items]) => {
                  const archTotalStock = items.reduce((sum, item) => sum + (variantStockDrafts[item.sku] ?? item.stock), 0);

                  return (
                    <div key={archName} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
                      {/* Architecture Group Header */}
                      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-900 font-mono">
                            Architecture / Cut: {archName}
                          </span>
                          <span className="text-[10px] font-mono bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">
                            {items.length} {items.length === 1 ? "colorway" : "colorways"}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-zinc-700">
                          Group Units: <span className="text-blue-600">{archTotalStock}</span>
                        </span>
                      </div>

                      {/* Items in Architecture */}
                      <div className="divide-y divide-zinc-100">
                        {items.map((v) => {
                          const currentDraftStock = variantStockDrafts[v.sku] ?? v.stock;
                          const diff = currentDraftStock - v.stock;
                          const rp = v.restockProcess;
                          const hasRestockProcess = !!rp && rp.status !== "completed";
                          const isPipelineOpen = restockPipelineOpenSku === v.sku;

                          return (
                            <div key={v.sku} className="p-4 space-y-3 hover:bg-zinc-50/50 transition-colors">
                              {/* Main Variant Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Color Dot */}
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                      style={{
                                        backgroundColor:
                                          v.color.toLowerCase().includes("green") ? "#2E5339" :
                                            v.color.toLowerCase().includes("black") ? "#1A1A1A" :
                                              v.color.toLowerCase().includes("blue") ? "#3B6978" :
                                                v.color.toLowerCase().includes("white") ? "#F5F5F5" :
                                                  v.color.toLowerCase().includes("silver") ? "#D1D5DB" :
                                                    v.color.toLowerCase().includes("sandstone") ? "#D4B996" :
                                                      "#4F46E5",
                                      }}
                                    />
                                    <span className="text-xs font-bold text-zinc-900">{v.color}</span>
                                    <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                      {v.sku}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 font-mono">
                                      ${Number(v.price || 0).toFixed(2)}
                                    </span>
                                    {hasRestockProcess && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                                        Restock In-Process: {rp.remainingQty} units pending
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                    <span>Original: <strong className="font-mono text-zinc-700">{v.stock}</strong> units</span>
                                    {diff !== 0 && (
                                      <span className={`font-mono font-semibold ${diff > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                        ({diff > 0 ? `+${diff}` : diff} units)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Pathway 1 (Immediate On-Hand Counter) + Restock Process Trigger */}
                                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                                  {/* Quick Chips for Immediate Stock Add */}
                                  <div className="hidden md:flex items-center gap-1" title="Mode 1: Direct On-Hand Stock Add">
                                    {[1, 5, 10, 25].map((addQty) => (
                                      <button
                                        key={addQty}
                                        type="button"
                                        onClick={() => {
                                          setVariantStockDrafts((prev) => ({
                                            ...prev,
                                            [v.sku]: (prev[v.sku] ?? v.stock) + addQty,
                                          }));
                                        }}
                                        className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] font-mono font-semibold text-zinc-600 transition-colors cursor-pointer"
                                      >
                                        +{addQty}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Stepper */}
                                  <div className="flex items-center border border-zinc-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVariantStockDrafts((prev) => ({
                                          ...prev,
                                          [v.sku]: Math.max(0, (prev[v.sku] ?? v.stock) - 1),
                                        }));
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={currentDraftStock}
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        setVariantStockDrafts((prev) => ({
                                          ...prev,
                                          [v.sku]: val,
                                        }));
                                      }}
                                      className="w-14 text-center font-mono font-bold text-sm text-zinc-900 border-x border-zinc-200 py-1 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVariantStockDrafts((prev) => ({
                                          ...prev,
                                          [v.sku]: (prev[v.sku] ?? v.stock) + 1,
                                        }));
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <span
                                    className={`text-[10px] font-mono px-2 py-1 rounded-md font-semibold ${currentDraftStock === 0
                                      ? "bg-red-100 text-red-700"
                                      : currentDraftStock <= 5
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                      }`}
                                  >
                                    {currentDraftStock === 0 ? "SOLD OUT" : currentDraftStock <= 5 ? "LOW STOCK" : "IN STOCK"}
                                  </span>

                                  {/* Mode 2 Trigger Button: Apply Restock Process */}
                                  <button
                                    type="button"
                                    onClick={() => setRestockPipelineOpenSku(isPipelineOpen ? null : v.sku)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${hasRestockProcess
                                      ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                                      : isPipelineOpen
                                        ? "bg-zinc-200 border-zinc-300 text-zinc-800"
                                        : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                      }`}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {hasRestockProcess
                                        ? (isPipelineOpen ? "Hide Pipeline" : "Manage Restock Pipeline")
                                        : (isPipelineOpen ? "Close Form" : "⚡ Apply Restock Process")}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleModalRemoveColor(v.sku)}
                                    className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                    title="Delete colorway"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* ACTIVE RESTOCK PROCESS: Dual Progress Bar (Green + Yellow) & Partial Check-in */}
                              {hasRestockProcess && (
                                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-emerald-50/30 p-4 space-y-3.5 animate-in fade-in">
                                  {/* Header Info */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                        PO
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-amber-950 font-sans">
                                            Restock Pipeline In-Progress
                                          </span>
                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase">
                                            {rp.status.replace("_", " ")}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 font-mono">
                                          Procurement lead time: <strong className="text-zinc-800">{rp.leadTimeDays} days</strong> · Initiated: {new Date(rp.initiatedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] font-mono">
                                      <span className="text-zinc-500">
                                        Fulfillment: <strong className="text-zinc-900">{rp.receivedQty}</strong> / {rp.targetQty} units
                                      </span>
                                      <span className="text-xs font-bold text-amber-700">
                                        {Math.round((rp.receivedQty / Math.max(1, rp.targetQty)) * 100)}% Complete
                                      </span>
                                    </div>
                                  </div>

                                  {/* THE DUAL PROGRESS BAR: Green (Available On-Hand) + Yellow (Restock In-Process) */}
                                  {(() => {
                                    const onHandUnits = currentDraftStock;
                                    const pendingUnits = rp.remainingQty;
                                    const totalScale = Math.max(1, onHandUnits + pendingUnits);
                                    const greenPercent = (onHandUnits / totalScale) * 100;
                                    const yellowPercent = (pendingUnits / totalScale) * 100;

                                    return (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-mono">
                                          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                                            Green Line: On-Hand Available ({onHandUnits} units)
                                          </span>
                                          <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-ping shadow-2xs" />
                                            Yellow Line: Restock In-Process ({pendingUnits} units remaining)
                                          </span>
                                        </div>

                                        {/* Dual Track Bar */}
                                        <div className="w-full h-3.5 bg-zinc-200 rounded-full overflow-hidden flex p-0.5 shadow-inner border border-zinc-300/80">
                                          {/* Green segment: On-hand available stock */}
                                          <div
                                            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 relative"
                                            style={{ width: `${greenPercent}%` }}
                                            title={`On-Hand Available: ${onHandUnits} units (${greenPercent.toFixed(1)}%)`}
                                          />
                                          {/* Yellow segment: Pending in-process restock */}
                                          <div
                                            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-r-full transition-all duration-500 relative overflow-hidden"
                                            style={{ width: `${yellowPercent}%` }}
                                            title={`Restock In-Process: ${pendingUnits} units remaining (${yellowPercent.toFixed(1)}%)`}
                                          >
                                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                          <span>🟢 Available live stock: {onHandUnits} units</span>
                                          <span>🟡 Processing pipeline: {pendingUnits} units ({rp.leadTimeDays}d ETA)</span>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Check-in Controls: Partial / Full Arrival */}
                                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold text-zinc-800">
                                        Check-in Arrived Products:
                                      </span>
                                      <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50">
                                        <input
                                          type="number"
                                          min="1"
                                          max={rp.remainingQty}
                                          value={restockReceiveQtyInput[v.sku] ?? Math.min(rp.remainingQty, 3)}
                                          onChange={(e) => {
                                            const val = Math.max(1, Math.min(rp.remainingQty, parseInt(e.target.value) || 1));
                                            setRestockReceiveQtyInput((prev) => ({ ...prev, [v.sku]: val }));
                                          }}
                                          className="w-14 text-center font-mono font-bold text-xs py-1 text-zinc-900 bg-white focus:outline-none"
                                        />
                                        <span className="px-2 text-[10px] font-mono text-zinc-400">
                                          / {rp.remainingQty} left
                                        </span>
                                      </div>

                                      {/* Quick partial chips */}
                                      {rp.remainingQty > 1 && (
                                        <div className="flex items-center gap-1">
                                          {[1, Math.min(3, rp.remainingQty), rp.remainingQty].filter((q, idx, arr) => arr.indexOf(q) === idx).map((qty) => (
                                            <button
                                              key={qty}
                                              type="button"
                                              onClick={() => setRestockReceiveQtyInput((prev) => ({ ...prev, [v.sku]: qty }))}
                                              className="px-2 py-1 rounded bg-zinc-100 hover:bg-amber-100 text-[10px] font-mono font-bold text-zinc-700 transition-colors cursor-pointer"
                                            >
                                              {qty === rp.remainingQty ? `All (${qty})` : `+${qty}`}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        disabled={isProcessingRestockPipeline}
                                        onClick={() => handleReceiveRestockStock(v.sku, rp.remainingQty)}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>
                                          Mark +{restockReceiveQtyInput[v.sku] ?? Math.min(rp.remainingQty, 3)} Arrived
                                        </span>
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isProcessingRestockPipeline}
                                      onClick={() => handleCancelRestockProcess(v.sku)}
                                      className="text-[11px] text-zinc-400 hover:text-red-600 underline transition-colors cursor-pointer self-end sm:self-auto"
                                    >
                                      Abort PO Pipeline
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* INITIATE RESTOCK PROCESS FORM (Mode 2 when not active) */}
                              {!hasRestockProcess && isPipelineOpen && (
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-3 animate-in fade-in">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <h4 className="text-xs font-bold text-blue-950 font-sans">
                                        Apply Restock Process for {v.color} ({v.sku})
                                      </h4>
                                    </div>
                                    <span className="text-[10px] font-mono bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                      Procurement PO
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                                    When stock is about to go low, create an official restock order with a processing time of <strong className="text-zinc-900">n days</strong>. The table will show the <strong className="text-emerald-700">Green line</strong> (current stock) and <strong className="text-amber-600">Yellow line</strong> (restock in process). As units arrive, check them in to incrementally decrease the yellow line and increase the green line.
                                  </p>

                                  <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-zinc-700">Target Restock Qty:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={restockTargetQtyInput[v.sku] ?? 5}
                                        onChange={(e) => {
                                          const val = Math.max(1, parseInt(e.target.value) || 1);
                                          setRestockTargetQtyInput((prev) => ({ ...prev, [v.sku]: val }));
                                        }}
                                        className="w-16 px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white font-mono font-bold text-xs text-center text-zinc-900 focus:outline-none"
                                      />
                                      {/* Quick chips */}
                                      <div className="flex items-center gap-1">
                                        {[5, 10, 25].map((q) => (
                                          <button
                                            key={q}
                                            type="button"
                                            onClick={() => setRestockTargetQtyInput((prev) => ({ ...prev, [v.sku]: q }))}
                                            className="px-2 py-1 rounded bg-blue-100/70 hover:bg-blue-200 text-[10px] font-mono font-bold text-blue-800 transition-colors cursor-pointer"
                                          >
                                            {q}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-zinc-700">Lead Time:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={restockLeadDaysInput[v.sku] ?? 5}
                                        onChange={(e) => {
                                          const val = Math.max(1, parseInt(e.target.value) || 1);
                                          setRestockLeadDaysInput((prev) => ({ ...prev, [v.sku]: val }));
                                        }}
                                        className="w-16 px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white font-mono font-bold text-xs text-center text-zinc-900 focus:outline-none"
                                      />
                                      <span className="text-xs text-zinc-500 font-mono">days</span>
                                      <div className="flex items-center gap-1">
                                        {[3, 5, 7, 14].map((d) => (
                                          <button
                                            key={d}
                                            type="button"
                                            onClick={() => setRestockLeadDaysInput((prev) => ({ ...prev, [v.sku]: d }))}
                                            className="px-2 py-1 rounded bg-blue-100/70 hover:bg-blue-200 text-[10px] font-mono font-bold text-blue-800 transition-colors cursor-pointer"
                                          >
                                            {d}d
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isProcessingRestockPipeline}
                                      onClick={() => handleApplyRestockProcess(v.sku)}
                                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 ml-auto"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Start Restock Process</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Add Colorway to Architecture within Restock Modal */}
                      <div className="p-3 bg-blue-50/60 border-t border-blue-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Add colorway to ${archName} (e.g., Heather Grey)`}
                          id={`modal-color-name-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          defaultValue={5}
                          id={`modal-color-stock-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          placeholder="Qty"
                          className="w-16 px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-mono font-bold text-center text-zinc-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const nameId = `modal-color-name-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            const stockId = `modal-color-stock-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            const nameEl = document.getElementById(nameId) as HTMLInputElement;
                            const stockEl = document.getElementById(stockId) as HTMLInputElement;
                            const colorName = nameEl?.value?.trim();
                            const initialQty = parseInt(stockEl?.value) || 5;
                            if (!colorName) return;
                            await handleModalAddColor(archName, colorName, initialQty);
                            if (nameEl) nameEl.value = "";
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Color</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Calculation & Actions */}
            <div className="p-4 sm:p-6 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                {(() => {
                  const originalSum = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                    ? restockTargetProduct.childVariants.reduce((sum, v) => sum + v.stock, 0)
                    : restockTargetProduct.stock;
                  const newSum = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                    ? restockTargetProduct.childVariants.reduce((sum, v) => sum + (variantStockDrafts[v.sku] ?? v.stock), 0)
                    : Object.values(variantStockDrafts).reduce((a, b) => a + b, 0);
                  const netChange = newSum - originalSum;

                  return (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 font-mono uppercase">Master Inventory:</span>
                        <span className="font-mono text-zinc-400 line-through">{originalSum} units</span>
                        <span>&rarr;</span>
                        <span className="font-mono font-bold text-sm text-zinc-950">{newSum} units</span>
                        {netChange !== 0 && (
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${netChange > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {netChange > 0 ? `+${netChange}` : netChange} units
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Calculated dynamically by summing all child variant stocks.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchRestock}
                  disabled={isSubmittingRestock}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRestock ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restocking & Purging...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Apply Variant Restock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: DYNAMIC PRODUCT CREATOR STUDIO
          Supports ANY e-commerce category (10 Top-Selling Categories)
          ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                    Dynamic Product Studio
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Add any product category: Apparel, Electronics, Beauty, Home, Fitness, Decor, Wearables & more
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Form */}
            <form onSubmit={handleCreateNewProduct} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Step 1: 10 Top-Selling E-Commerce Categories */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    1. Select E-Commerce Category
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">10 Top-Selling Market Niches</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ECOMMERCE_CATEGORIES.map((cat) => {
                    const isSelected = newProdCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500"
                          : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                          }`}
                      >
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                        <span className="text-[9px] text-zinc-400 truncate mt-1">{cat.topSellingItems.split(",")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Core Details */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    2. Core Product Information
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadNovaSmartphoneExample}
                      className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Load "Nova X1 Smartphone" Example (6.0" 5500mAh vs 5.5" 4700mAh)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadProductAExample}
                      className="text-[11px] text-zinc-600 hover:text-zinc-900 font-medium underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Load "Product A" Example</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => {
                        setNewProdName(e.target.value);
                        if (!newProdSlug) {
                          setNewProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                        }
                      }}
                      placeholder="e.g. Product A - Studio Minimalist Hoodie"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">URL Slug / Identifier *</label>
                    <input
                      type="text"
                      required
                      value={newProdSlug}
                      onChange={(e) => setNewProdSlug(e.target.value)}
                      placeholder="product-a"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Model / Edition Tag</label>
                    <input
                      type="text"
                      value={newProdModel}
                      onChange={(e) => setNewProdModel(e.target.value)}
                      placeholder="ORGANIC HEAVYWEIGHT 450 GSM"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Retail Price ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Original MSRP ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProdOriginalPrice}
                      onChange={(e) => setNewProdOriginalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Tagline / Key Value Highlight</label>
                  <input
                    type="text"
                    value={newProdTagline}
                    onChange={(e) => setNewProdTagline(e.target.value)}
                    placeholder="Ultra-dense combed cotton with tailored architectural cut."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Description</label>
                  <textarea
                    rows={2}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    placeholder="Detailed description of features, materials, and origin..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 3: Dynamic Category Specifications */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                      3. Technical & Category Specifications
                    </label>
                    <p className="text-[11px] text-zinc-500">Key-value parameters displayed on the storefront specifications table</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProdSpecs([...newProdSpecs, { key: "New Spec", value: "Value" }])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newProdSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => {
                          const updated = [...newProdSpecs];
                          updated[sIdx].key = e.target.value;
                          setNewProdSpecs(updated);
                        }}
                        placeholder="Spec Attribute"
                        className="w-1/3 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold focus:outline-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...newProdSpecs];
                          updated[sIdx].value = e.target.value;
                          setNewProdSpecs(updated);
                        }}
                        placeholder="Spec Value"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...newProdSpecs];
                          updated.splice(sIdx, 1);
                          setNewProdSpecs(updated);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Multi-Variant Architecture & Colors Builder */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>4. Variant Architectures & Colorways</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Organize products into architecture cuts (A1, A2, or custom cuts) with nested color stocks and pricing
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewProdAddArchitecture}
                    className="text-xs text-white bg-zinc-950 hover:bg-zinc-800 font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Architecture Cut</span>
                  </button>
                </div>

                {/* Architecture Cuts List */}
                <div className="space-y-4">
                  {newProdArchitectures.map((arch, archIdx) => {
                    const archTotalUnits = (arch.colors || []).reduce((sum, c) => sum + (Number(c.stock) || 0), 0);

                    return (
                      <div
                        key={arch.id || archIdx}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/70 overflow-hidden shadow-xs transition-all space-y-3 p-4"
                      >
                        {/* Architecture Cut Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold shrink-0">
                              Cut #{String(archIdx + 1).padStart(2, "0")}
                            </span>

                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <input
                                type="text"
                                value={arch.id}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "id", e.target.value)}
                                placeholder="A1"
                                className="w-16 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                title="Architecture ID (e.g. A1, A2, CUT-1)"
                              />
                              <input
                                type="text"
                                value={arch.name}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "name", e.target.value)}
                                placeholder="e.g. A1 (Regular Fit) or Attached Mic"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center gap-1 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[10px] text-zinc-400 font-mono">Base $</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={arch.price}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "price", parseFloat(e.target.value) || 0)}
                                className="w-14 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                              />
                            </div>

                            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-200/80 text-zinc-800">
                              {archTotalUnits} units
                            </span>

                            {newProdArchitectures.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleNewProdRemoveArchitecture(archIdx)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Architecture Cut"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Architecture Spec Overrides (Inheritance & Divergence Studio) */}
                        <div
                          className="p-3.5 rounded-xl bg-white border border-zinc-200/90 shadow-2xs space-y-3"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const key = e.dataTransfer.getData("text/plain");
                            if (key) {
                              handleNewProdAddSpecOverride(archIdx, key);
                            }
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                                  Architecture Spec Overrides & Divergence
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                  {(arch.variantSpecs || []).length} overridden
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                Attributes that differ from Global Specs for this cut (e.g. Display Size, Battery, Protection Glass). Click or drag chips below to diverge.
                              </p>
                            </div>

                            {/* Quick action: Add custom divergence */}
                            <button
                              type="button"
                              onClick={() => handleNewProdAddSpecOverride(archIdx, "New Spec Attribute", "Custom Divergent Value")}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Custom Override</span>
                            </button>
                          </div>

                          {/* Global Spec Chips (Click to diverge or Drag into Cut) */}
                          {newProdSpecs.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                Click or drag global specs into {arch.id || `Arch ${archIdx + 1}`} to override:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {newProdSpecs.map((gSpec, gsIdx) => {
                                  const isAlreadyOverridden = (arch.variantSpecs || []).some(
                                    (s) => s.key.toLowerCase() === gSpec.key.toLowerCase()
                                  );

                                  if (isAlreadyOverridden) {
                                    return (
                                      <span
                                        key={gsIdx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/90 text-[11px] font-medium"
                                        title={`Already overridden in ${arch.id || "this cut"}`}
                                      >
                                        <span className="text-[10px] font-mono font-bold text-amber-600">⚡</span>
                                        <span className="font-semibold">{gSpec.key}</span>
                                        <span className="text-[10px] text-amber-700 font-mono">(Diverged)</span>
                                      </span>
                                    );
                                  }

                                  return (
                                    <button
                                      key={gsIdx}
                                      type="button"
                                      draggable
                                      onDragStart={(e) => e.dataTransfer.setData("text/plain", gSpec.key)}
                                      onClick={() => handleNewProdAddSpecOverride(archIdx, gSpec.key, gSpec.value)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium border border-zinc-200 transition-colors cursor-pointer group"
                                      title="Click or drag to diverge this spec in this architecture cut"
                                    >
                                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700" />
                                      <span>{gSpec.key}</span>
                                      <span className="text-[10px] text-zinc-400 font-mono">({gSpec.value})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Active Overrides Rows */}
                          {(arch.variantSpecs || []).length === 0 ? (
                            <div className="p-2.5 rounded-lg bg-zinc-50 border border-dashed border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>🌐</span>
                                <span>Inheriting 100% of Global Specs (Display, Battery, RAM, etc. inherit seamlessly from Master).</span>
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">Click any chip above to diverge</span>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1 border-t border-zinc-100">
                              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                <span>Active Overrides for {arch.id || `Cut ${archIdx + 1}`}:</span>
                                <span className="text-[10px] font-mono text-amber-700 font-semibold">
                                  {(arch.variantSpecs || []).length} Divergent {arch.variantSpecs?.length === 1 ? "Spec" : "Specs"}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {(arch.variantSpecs || []).map((vSpec, vsIdx) => (
                                  <div
                                    key={vsIdx}
                                    className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50/70 border border-amber-200/80"
                                  >
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold shrink-0">
                                      ⚡ OVERRIDE
                                    </span>
                                    <input
                                      type="text"
                                      value={vSpec.key}
                                      onChange={(e) => handleNewProdUpdateSpecOverride(archIdx, vsIdx, "key", e.target.value)}
                                      placeholder="Attribute Key"
                                      className="w-1/3 px-2.5 py-1 rounded-md border border-amber-200/90 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <input
                                      type="text"
                                      value={vSpec.value}
                                      onChange={(e) => handleNewProdUpdateSpecOverride(archIdx, vsIdx, "value", e.target.value)}
                                      placeholder="Overridden Value (e.g. 6.0 inch LTPO AMOLED)"
                                      className="flex-1 px-2.5 py-1 rounded-md border border-amber-200/90 text-xs font-mono font-medium text-amber-950 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleNewProdRemoveSpecOverride(archIdx, vsIdx)}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                                      title="Revert back to Global Spec inheritance"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Colorways Table inside this Architecture Cut */}
                        <div className="space-y-2">
                          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-mono text-zinc-500 uppercase px-2 font-semibold">
                            <div className="col-span-4">Colorway & Swatch</div>
                            <div className="col-span-3">Variant SKU</div>
                            <div className="col-span-2">Initial Units</div>
                            <div className="col-span-2">Price ($)</div>
                            <div className="col-span-1 text-right">Action</div>
                          </div>

                          {arch.colors.map((c, cIdx) => (
                            <div
                              key={c.id || cIdx}
                              className="p-2.5 sm:p-2 rounded-xl bg-white border border-zinc-200/90 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center shadow-2xs"
                            >
                              {/* Color & Hex */}
                              <div className="sm:col-span-4 flex items-center gap-2">
                                <input
                                  type="color"
                                  value={c.hex || "#333333"}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "hex", e.target.value)}
                                  className="w-7 h-7 rounded border border-zinc-300 p-0 cursor-pointer shrink-0"
                                  title="Pick Color Hex Swatch"
                                />
                                <input
                                  type="text"
                                  value={c.color}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "color", e.target.value)}
                                  placeholder="Color Name (e.g. Pitch Black)"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* SKU */}
                              <div className="sm:col-span-3">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">SKU</label>
                                <input
                                  type="text"
                                  value={c.sku}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "sku", e.target.value)}
                                  placeholder="PROD-A1-BLK"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Stock */}
                              <div className="sm:col-span-2">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">Stock Units</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={c.stock}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "stock", parseInt(e.target.value) || 0)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Price */}
                              <div className="sm:col-span-2">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">Price ($)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={c.price}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "price", parseFloat(e.target.value) || 0)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Delete Color */}
                              <div className="sm:col-span-1 flex items-center justify-end">
                                {arch.colors.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleNewProdRemoveColor(archIdx, cIdx)}
                                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                    title="Remove this color"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* + Add Color Button for THIS Architecture Cut */}
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleNewProdAddColor(archIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200/80 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Color to {arch.id || `Arch ${archIdx + 1}`}</span>
                          </button>

                          <span className="text-[11px] font-mono text-zinc-500">
                            {arch.colors.length} {arch.colors.length === 1 ? "colorway" : "colorways"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Master Inventory Calculated Box */}
                {(() => {
                  const masterTotalUnits = newProdArchitectures.reduce(
                    (total, arch) => total + (arch.colors || []).reduce((sum, c) => sum + (Number(c.stock) || 0), 0),
                    0
                  );
                  const totalColorways = newProdArchitectures.reduce(
                    (total, arch) => total + (arch.colors || []).length,
                    0
                  );

                  return (
                    <div className="p-4 bg-zinc-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Calculated Master Inventory
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {masterTotalUnits} units total
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            across {newProdArchitectures.length} {newProdArchitectures.length === 1 ? "cut" : "cuts"} & {totalColorways} colorways
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {newProdArchitectures.map((arch, aIdx) => {
                          const units = (arch.colors || []).reduce((s, c) => s + (Number(c.stock) || 0), 0);
                          return (
                            <span
                              key={arch.id || aIdx}
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200"
                            >
                              <strong className="text-white">{arch.id || `A${aIdx + 1}`}</strong>: {units} u
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating & Purging Cache...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Deploy Product to Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Proof of Delivery Image Modal (Lightbox) */}
      {/* Full-Screen Proof of Delivery Image Modal (Lightbox) */}
      {podModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-2.5 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPodModalImage(null)}
        >
          {/* Modal Header */}
          <div
            className="w-full max-w-5xl flex items-center justify-between py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl sm:rounded-2xl bg-zinc-900/95 border border-zinc-800 text-white shrink-0 z-10 shadow-2xl gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-zinc-100 truncate">{podModalImage.title}</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800/60 font-semibold shrink-0">
                  Damage Inspection Passed
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">
                {podModalImage.subtitle} {podModalImage.name && `· ${podModalImage.name}`}{" "}
                {podModalImage.size ? `(${(podModalImage.size / (1024 * 1024)).toFixed(2)} MB)` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href={podModalImage.src}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] sm:text-xs font-semibold text-zinc-200 flex items-center gap-1 sm:gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Raw</span>
              </a>
              <button
                type="button"
                onClick={() => setPodModalImage(null)}
                className="p-1.5 rounded-lg sm:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Modal Image Body */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={podModalImage.src}
              alt={podModalImage.title}
              className="max-h-[72vh] sm:max-h-[78vh] max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-zinc-800 select-none"
            />
          </div>

          {/* Modal Footer Note */}
          <div
            className="w-full max-w-5xl text-center text-zinc-400 text-[10px] sm:text-xs font-mono py-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            High-resolution Proof of Delivery archive · Authenticated by carrier terminal · Press ESC or click backdrop to close
          </div>
        </div>
      )}

      {/* DENY VEHICLE LOADING MODAL (REVERT TO SORTING DOCK) */}
      {denyLoadingModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDenyLoadingModalOrder(null)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Deny Vehicle Loading
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Revert Consignment <span className="text-cyan-400 font-mono font-bold">#{denyLoadingModalOrder.orderNumber}</span> to Sorting Dock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDenyLoadingModalOrder(null)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-1">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Immediate Sorting Dock Reversion</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Found a mistake or mislabeled information before loading into the vehicle? Denying loading stops dispatch and immediately returns the consignment back to the <strong>Sorting Dock</strong> so you can adjust the destination hub, fleet mode, or vehicle details.
              </p>
            </div>

            {/* Consignment Details */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="text-zinc-200 font-medium">
                  {denyLoadingModalOrder.customer?.fullName} ({denyLoadingModalOrder.customer?.city})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Assigned Staging:</span>
                <span className="text-purple-300 font-medium">
                  {denyLoadingModalOrder.nextHub || "Next Transit Gateway"} ({denyLoadingModalOrder.transitMode?.toUpperCase() || "VAN"})
                </span>
              </div>
              {denyLoadingModalOrder.vehicleNo && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vehicle / Plate:</span>
                  <span className="text-zinc-300 font-mono">{denyLoadingModalOrder.vehicleNo}</span>
                </div>
              )}
            </div>

            {/* Preset Denial Reasons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Select Reason for Loading Denial & Return:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "🏷️ Mislabeled Destination / Routing",
                  "🚆 Wrong Train / Flight / Vehicle ID",
                  "🔄 Wrong Transport Fleet Mode",
                  "📍 Address Proximity Flag Mismatch",
                  "📦 Packaging / Manifest Discrepancy",
                  "⚠️ Operator Labeling Correction",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDenyLoadingReason(reason)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                      denyLoadingReason === reason
                        ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-xs"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">
                Additional Clarification / Notes (Optional):
              </label>
              <input
                type="text"
                value={customDenyNotes}
                onChange={(e) => setCustomDenyNotes(e.target.value)}
                placeholder="e.g. Train number was filled as 12302 instead of 12004, fix destination to Patna"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDenyLoadingModalOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={hubActionLoading === denyLoadingModalOrder.orderNumber}
                onClick={async () => {
                  const reasonPayload = `${denyLoadingReason}${customDenyNotes ? ` · Note: ${customDenyNotes}` : ""}`;
                  await handleHubQueueAction(
                    denyLoadingModalOrder.orderNumber,
                    "deny_loading",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    reasonPayload
                  );
                  setDenyLoadingModalOrder(null);
                  setCustomDenyNotes("");
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {hubActionLoading === denyLoadingModalOrder.orderNumber ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Revert to Sorting Dock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
