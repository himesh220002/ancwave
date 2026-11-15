import { TransportMode, LogisticsHub } from "@/types";
import { STANDARD_HUBS, CENTRAL_STOCK_CENTER, getHubById } from "@/lib/logistics-service";

// ============================================================================
// 1. INDIA 29 KEY LOGISTICS NODES & GEOGRAPHIC TOPOLOGY
// ============================================================================

export type IndiaZone = "North" | "South" | "East" | "West" | "Central" | "Northeast";

export interface IndiaCityNode {
  id: string; // 3-letter IATA / Railway code e.g. DEL, BOM, CCU, NAG
  code: string;
  name: string;
  state: string;
  zone: IndiaZone;
  x: number; // 0 to 1000 SVG coordinate projection
  y: number; // 0 to 1100 SVG coordinate projection
  hubId: string; // Associated LogisticsHub id in ancwave system
  isMajorGateway: boolean;
  hasAirport: boolean;
  hasRailJunction: boolean;
  hasNationalHighway: boolean;
  arterialCorridor: string;
  populationTier: "Tier-1" | "Tier-2" | "Strategic Gateway";
}

/**
 * 29 Master Cities / Logistics Nodes across India with accurate geographical layout coordinates
 */
export const INDIA_29_CITIES: IndiaCityNode[] = [
  // NORTH ZONE (8 Cities)
  {
    id: "SXR",
    code: "SXR",
    name: "Srinagar",
    state: "Jammu & Kashmir",
    zone: "North",
    x: 360,
    y: 75,
    hubId: "HUB-DEL-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: false,
    hasNationalHighway: true,
    arterialCorridor: "NH-44 Himalayan Northern Apex",
    populationTier: "Strategic Gateway",
  },
  {
    id: "IXC",
    code: "IXC",
    name: "Chandigarh",
    state: "Punjab / Haryana",
    zone: "North",
    x: 350,
    y: 190,
    hubId: "HUB-DEL-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "GT Road / NH-44 Northern Agricultural Belt",
    populationTier: "Tier-1",
  },
  {
    id: "DED",
    code: "DED",
    name: "Dehradun",
    state: "Uttarakhand",
    zone: "North",
    x: 405,
    y: 205,
    hubId: "HUB-DEL-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Delhi-Dehradun Expressway Corridor",
    populationTier: "Tier-2",
  },
  {
    id: "DEL",
    code: "DEL",
    name: "Delhi-NCR",
    state: "Delhi NCR",
    zone: "North",
    x: 365,
    y: 285,
    hubId: "HUB-DEL-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "National Capital Gateway / Northern Logistics Core",
    populationTier: "Tier-1",
  },
  {
    id: "JAI",
    code: "JAI",
    name: "Jaipur",
    state: "Rajasthan",
    zone: "North",
    x: 300,
    y: 350,
    hubId: "HUB-DEL-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Delhi-Mumbai Industrial Expressway (DMIC)",
    populationTier: "Tier-1",
  },
  {
    id: "LKO",
    code: "LKO",
    name: "Lucknow",
    state: "Uttar Pradesh",
    zone: "North",
    x: 490,
    y: 355,
    hubId: "HUB-LKO-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Purvanchal Expressway & Gangetic Plain Hub",
    populationTier: "Tier-1",
  },
  {
    id: "KNU",
    code: "KNU",
    name: "Kanpur",
    state: "Uttar Pradesh",
    zone: "North",
    x: 470,
    y: 375,
    hubId: "HUB-LKO-01",
    isMajorGateway: false,
    hasAirport: false,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern DFC Heavy Industrial Rail Corridor",
    populationTier: "Tier-1",
  },
  {
    id: "VNS",
    code: "VNS",
    name: "Varanasi",
    state: "Uttar Pradesh",
    zone: "North",
    x: 565,
    y: 405,
    hubId: "HUB-LKO-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern Freight Junction / Inland Waterway Terminal",
    populationTier: "Tier-2",
  },

  // EAST ZONE (5 Cities)
  {
    id: "PAT",
    code: "PAT",
    name: "Patna",
    state: "Bihar",
    zone: "East",
    x: 635,
    y: 395,
    hubId: "HUB-PAT-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern Gangetic Rail & Road Corridor",
    populationTier: "Tier-1",
  },
  {
    id: "IXR",
    code: "IXR",
    name: "Ranchi",
    state: "Jharkhand",
    zone: "East",
    x: 645,
    y: 470,
    hubId: "HUB-CCU-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Chota Nagpur Heavy Industrial & Mineral Trunk",
    populationTier: "Tier-2",
  },
  {
    id: "ASN",
    code: "ASN",
    name: "Asansol",
    state: "West Bengal",
    zone: "East",
    x: 690,
    y: 450,
    hubId: "HUB-ASN-01",
    isMajorGateway: false,
    hasAirport: false,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern DFC High-Capacity Rail Trunk (Grand Chord)",
    populationTier: "Strategic Gateway",
  },
  {
    id: "CCU",
    code: "CCU",
    name: "Kolkata",
    state: "West Bengal",
    zone: "East",
    x: 725,
    y: 495,
    hubId: "HUB-CCU-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Bay of Bengal Maritime & Eastern Apex Hub",
    populationTier: "Tier-1",
  },
  {
    id: "BBI",
    code: "BBI",
    name: "Bhubaneswar",
    state: "Odisha",
    zone: "East",
    x: 660,
    y: 575,
    hubId: "HUB-CCU-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern Coastal NH-16 / Paradip Port Link",
    populationTier: "Tier-2",
  },

  // NORTHEAST ZONE (1 City)
  {
    id: "GAU",
    code: "GAU",
    name: "Guwahati",
    state: "Assam",
    zone: "Northeast",
    x: 840,
    y: 360,
    hubId: "HUB-GAU-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Siliguri Corridor / 7-Sisters Lifeline Gateway",
    populationTier: "Tier-1",
  },

  // CENTRAL ZONE (4 Cities)
  {
    id: "BHO",
    code: "BHO",
    name: "Bhopal",
    state: "Madhya Pradesh",
    zone: "Central",
    x: 395,
    y: 480,
    hubId: "HUB-NAG-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "North-South Grand Trunk Railway Junction",
    populationTier: "Tier-1",
  },
  {
    id: "IDR",
    code: "IDR",
    name: "Indore",
    state: "Madhya Pradesh",
    zone: "Central",
    x: 335,
    y: 490,
    hubId: "HUB-NAG-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Malwa Commercial & High-Tech Manufacturing Hub",
    populationTier: "Tier-1",
  },
  {
    id: "NAG",
    code: "NAG",
    name: "Nagpur (Zero-Mile)",
    state: "Maharashtra",
    zone: "Central",
    x: 440,
    y: 540,
    hubId: "STOCK-CTR-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Zero-Mile Geographic Center & National Stock Depot",
    populationTier: "Strategic Gateway",
  },
  {
    id: "RPR",
    code: "RPR",
    name: "Raipur",
    state: "Chhattisgarh",
    zone: "Central",
    x: 545,
    y: 535,
    hubId: "HUB-NAG-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "East-West NH-53 Mineral & Manufacturing Link",
    populationTier: "Tier-2",
  },

  // WEST ZONE (5 Cities)
  {
    id: "AMD",
    code: "AMD",
    name: "Ahmedabad",
    state: "Gujarat",
    zone: "West",
    x: 230,
    y: 460,
    hubId: "HUB-AMD-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Western DFC Industrial & Cargo Axis",
    populationTier: "Tier-1",
  },
  {
    id: "STV",
    code: "STV",
    name: "Surat",
    state: "Gujarat",
    zone: "West",
    x: 235,
    y: 535,
    hubId: "HUB-AMD-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Hazira Port & Western Coastal Highway",
    populationTier: "Tier-1",
  },
  {
    id: "BOM",
    code: "BOM",
    name: "Mumbai",
    state: "Maharashtra",
    zone: "West",
    x: 240,
    y: 615,
    hubId: "HUB-BOM-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "JNPA Maritime Container Terminal & Financial Hub",
    populationTier: "Tier-1",
  },
  {
    id: "PNQ",
    code: "PNQ",
    name: "Pune",
    state: "Maharashtra",
    zone: "West",
    x: 275,
    y: 650,
    hubId: "HUB-BOM-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Mumbai-Pune Expressway & Auto/Electronics Cluster",
    populationTier: "Tier-1",
  },
  {
    id: "GOI",
    code: "GOI",
    name: "Goa / Panaji",
    state: "Goa",
    zone: "West",
    x: 270,
    y: 755,
    hubId: "HUB-BOM-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Konkan Coastal Rail & Highway NH-66",
    populationTier: "Tier-2",
  },

  // SOUTH ZONE (6 Cities)
  {
    id: "HYD",
    code: "HYD",
    name: "Hyderabad",
    state: "Telangana",
    zone: "South",
    x: 430,
    y: 675,
    hubId: "HUB-BLR-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "South-Central Deccan Tech & Pharma Logistics Core",
    populationTier: "Tier-1",
  },
  {
    id: "VTZ",
    code: "VTZ",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    zone: "South",
    x: 585,
    y: 650,
    hubId: "HUB-MAA-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Eastern Seaboard Deepwater Port & NH-16",
    populationTier: "Tier-2",
  },
  {
    id: "BLR",
    code: "BLR",
    name: "Bengaluru",
    state: "Karnataka",
    zone: "South",
    x: 380,
    y: 810,
    hubId: "HUB-BLR-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Silicon Valley South-West Electronics & Cargo Hub",
    populationTier: "Tier-1",
  },
  {
    id: "MAA",
    code: "MAA",
    name: "Chennai",
    state: "Tamil Nadu",
    zone: "South",
    x: 485,
    y: 815,
    hubId: "HUB-MAA-01",
    isMajorGateway: true,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Automotive/Hardware Export Port & South-East Gateway",
    populationTier: "Tier-1",
  },
  {
    id: "CJB",
    code: "CJB",
    name: "Coimbatore",
    state: "Tamil Nadu",
    zone: "South",
    x: 350,
    y: 895,
    hubId: "HUB-MAA-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Kongu Industrial Belt & Palakkad Gap Connector",
    populationTier: "Tier-2",
  },
  {
    id: "COK",
    code: "COK",
    name: "Kochi",
    state: "Kerala",
    zone: "South",
    x: 335,
    y: 940,
    hubId: "HUB-BLR-01",
    isMajorGateway: false,
    hasAirport: true,
    hasRailJunction: true,
    hasNationalHighway: true,
    arterialCorridor: "Vallarpadam International Transshipment Terminal",
    populationTier: "Tier-1",
  },
];

// ============================================================================
// 2. MULTI-MODAL LOGISTICS NETWORK EDGES (TRAIN, ROAD, PLANE)
// ============================================================================

export interface IndiaLogisticsEdge {
  from: string; // City code e.g. "DEL"
  to: string; // City code e.g. "BOM"
  modes: TransportMode[]; // ["train", "truck", "plane"]
  distanceKm: number;
  corridorName: string;
  durations: {
    train?: number; // hours
    truck?: number; // hours
    plane?: number; // hours
  };
}

export const INDIA_LOGISTICS_EDGES: IndiaLogisticsEdge[] = [
  // Northern Arterial Links
  { from: "SXR", to: "IXC", modes: ["truck", "plane"], distanceKm: 560, corridorName: "NH-44 Himalayan Express", durations: { truck: 13, plane: 1.2 } },
  { from: "IXC", to: "DEL", modes: ["truck", "train"], distanceKm: 245, corridorName: "NH-44 / Northern Shatabdi Line", durations: { truck: 4.5, train: 3.5 } },
  { from: "DED", to: "DEL", modes: ["truck", "train"], distanceKm: 250, corridorName: "Delhi-Dehradun Expressway", durations: { truck: 4.5, train: 4.0 } },
  { from: "DEL", to: "JAI", modes: ["truck", "train"], distanceKm: 270, corridorName: "Delhi-Jaipur Expressway / Western DFC", durations: { truck: 4.5, train: 4.2 } },
  { from: "DEL", to: "KNU", modes: ["train", "truck"], distanceKm: 440, corridorName: "Eastern DFC Northern Leg", durations: { train: 5.0, truck: 7.5 } },
  { from: "KNU", to: "LKO", modes: ["truck", "train"], distanceKm: 85, corridorName: "Kanpur-Lucknow Expressway", durations: { truck: 1.5, train: 1.2 } },
  { from: "LKO", to: "VNS", modes: ["train", "truck"], distanceKm: 310, corridorName: "Purvanchal Expressway & Rail", durations: { train: 4.5, truck: 5.5 } },
  { from: "DEL", to: "LKO", modes: ["truck", "train", "plane"], distanceKm: 550, corridorName: "Yamuna & Agra-Lucknow Expressway", durations: { plane: 1.0, train: 6.5, truck: 7.5 } },

  // Eastern DFC & Gangetic Corridor
  { from: "VNS", to: "PAT", modes: ["train", "truck"], distanceKm: 255, corridorName: "Grand Trunk / Eastern DFC", durations: { train: 3.5, truck: 5.0 } },
  { from: "PAT", to: "ASN", modes: ["train", "truck"], distanceKm: 360, corridorName: "Eastern Rail Trunk", durations: { train: 5.0, truck: 7.0 } },
  { from: "ASN", to: "CCU", modes: ["train", "truck"], distanceKm: 215, corridorName: "Grand Chord Rail / NH-19", durations: { train: 3.2, truck: 4.5 } },
  { from: "PAT", to: "IXR", modes: ["truck", "train"], distanceKm: 330, corridorName: "Patna-Ranchi Expressway", durations: { train: 6.0, truck: 6.5 } },
  { from: "IXR", to: "CCU", modes: ["train", "truck"], distanceKm: 410, corridorName: "NH-18 Jharkhand-Bengal Trunk", durations: { train: 6.5, truck: 8.0 } },
  { from: "CCU", to: "BBI", modes: ["train", "truck", "plane"], distanceKm: 440, corridorName: "NH-16 Eastern Coastal Corriodor", durations: { plane: 1.1, train: 6.0, truck: 8.5 } },

  // Northeast Link
  { from: "CCU", to: "GAU", modes: ["plane", "train", "truck"], distanceKm: 990, corridorName: "Siliguri Chicken-Neck Corridor / Air Cargo", durations: { plane: 1.2, train: 18, truck: 24 } },
  { from: "PAT", to: "GAU", modes: ["train", "truck"], distanceKm: 870, corridorName: "East-West Highway NH-27", durations: { train: 16, truck: 20 } },

  // Central Hub (Nagpur Zero-Mile Core) Connectors
  { from: "DEL", to: "BHO", modes: ["train", "truck"], distanceKm: 780, corridorName: "North-South Grand Trunk Railway", durations: { train: 9.5, truck: 14 } },
  { from: "BHO", to: "NAG", modes: ["train", "truck"], distanceKm: 350, corridorName: "Itarsi-Nagpur Central Rail Line", durations: { train: 5.5, truck: 6.5 } },
  { from: "IDR", to: "BHO", modes: ["truck", "train"], distanceKm: 195, corridorName: "Bhopal-Indore Super Corridor", durations: { truck: 3.5, train: 3.2 } },
  { from: "IDR", to: "NAG", modes: ["truck"], distanceKm: 445, corridorName: "Central Agro-Industrial Road", durations: { truck: 8.5 } },
  { from: "NAG", to: "RPR", modes: ["train", "truck"], distanceKm: 285, corridorName: "NH-53 East-West Rail & Road", durations: { train: 4.2, truck: 5.5 } },
  { from: "RPR", to: "BBI", modes: ["train", "truck"], distanceKm: 540, corridorName: "Central-East Mineral Express", durations: { train: 9.5, truck: 11 } },
  { from: "RPR", to: "CCU", modes: ["train", "plane"], distanceKm: 830, corridorName: "Howrah-Mumbai Direct Rail Trunk", durations: { plane: 1.4, train: 14 } },

  // Western Corridor & Western DFC
  { from: "JAI", to: "AMD", modes: ["train", "truck"], distanceKm: 660, corridorName: "Western DFC / NH-48", durations: { train: 8.5, truck: 11.5 } },
  { from: "AMD", to: "STV", modes: ["train", "truck"], distanceKm: 265, corridorName: "Vadodara-Surat Express Highway", durations: { train: 3.2, truck: 4.0 } },
  { from: "STV", to: "BOM", modes: ["train", "truck"], distanceKm: 280, corridorName: "Western Coastal Freight Corridor", durations: { train: 3.5, truck: 5.0 } },
  { from: "BOM", to: "PNQ", modes: ["truck", "train"], distanceKm: 150, corridorName: "Mumbai-Pune High-Speed Expressway", durations: { truck: 2.5, train: 3.0 } },
  { from: "PNQ", to: "GOI", modes: ["truck", "train"], distanceKm: 450, corridorName: "Konkan Highway NH-48", durations: { truck: 8.5, train: 9.5 } },
  { from: "NAG", to: "BOM", modes: ["train", "truck", "plane"], distanceKm: 810, corridorName: "Samruddhi Mahamarg & Central Rail", durations: { plane: 1.3, truck: 9.0, train: 12 } },
  { from: "NAG", to: "PNQ", modes: ["truck", "train"], distanceKm: 720, corridorName: "Maharashtra Central-West Expressway", durations: { truck: 11, train: 13 } },

  // South-Central & Southern Corridors
  { from: "NAG", to: "HYD", modes: ["train", "truck", "plane"], distanceKm: 500, corridorName: "NH-44 North-South Super Corridor", durations: { plane: 1.1, train: 7.5, truck: 8.5 } },
  { from: "HYD", to: "BLR", modes: ["truck", "train", "plane"], distanceKm: 570, corridorName: "NH-44 Deccan Tech Highway", durations: { plane: 1.1, train: 8.5, truck: 9.5 } },
  { from: "HYD", to: "VTZ", modes: ["train", "truck"], distanceKm: 620, corridorName: "Andhra Industrial Rail Link", durations: { train: 9.5, truck: 11.5 } },
  { from: "VTZ", to: "MAA", modes: ["train", "truck"], distanceKm: 800, corridorName: "Coromandel Coastal Rail", durations: { train: 12, truck: 14 } },
  { from: "HYD", to: "MAA", modes: ["train", "truck", "plane"], distanceKm: 630, corridorName: "NH-16 South-East Trunk", durations: { plane: 1.1, train: 10, truck: 11.5 } },
  { from: "BLR", to: "MAA", modes: ["train", "truck"], distanceKm: 345, corridorName: "Bengaluru-Chennai Expressway", durations: { train: 4.5, truck: 5.5 } },
  { from: "BLR", to: "CJB", modes: ["train", "truck"], distanceKm: 360, corridorName: "Salem-Coimbatore Industrial Road", durations: { train: 5.5, truck: 6.5 } },
  { from: "CJB", to: "COK", modes: ["train", "truck"], distanceKm: 190, corridorName: "Palakkad Gap Highway NH-544", durations: { train: 3.5, truck: 4.2 } },
  { from: "GOI", to: "COK", modes: ["train", "truck"], distanceKm: 730, corridorName: "Konkan Coastal Rail Link", durations: { train: 12.5, truck: 15 } },
  { from: "MAA", to: "CJB", modes: ["train", "truck"], distanceKm: 500, corridorName: "Tamil Nadu East-West Rail Trunk", durations: { train: 7.0, truck: 8.5 } },

  // National Air Cargo Express Direct Trunks (Hub-to-Hub flights)
  { from: "DEL", to: "BOM", modes: ["plane"], distanceKm: 1150, corridorName: "IndiGo / Air India Cargo Express Trunk", durations: { plane: 2.1 } },
  { from: "DEL", to: "CCU", modes: ["plane"], distanceKm: 1300, corridorName: "AeroAPI Trans-Gangetic Air Freight", durations: { plane: 2.2 } },
  { from: "DEL", to: "BLR", modes: ["plane"], distanceKm: 1740, corridorName: "North-South Priority Cargo Airlink", durations: { plane: 2.6 } },
  { from: "DEL", to: "MAA", modes: ["plane"], distanceKm: 1760, corridorName: "Capital-Coast Express Air Corridor", durations: { plane: 2.7 } },
  { from: "DEL", to: "GAU", modes: ["plane"], distanceKm: 1460, corridorName: "Northeast Lifeline Air Express", durations: { plane: 2.3 } },
  { from: "BOM", to: "CCU", modes: ["plane"], distanceKm: 1650, corridorName: "Cross-Coast Transcontinental Air Corridor", durations: { plane: 2.5 } },
  { from: "BOM", to: "BLR", modes: ["plane"], distanceKm: 840, corridorName: "Western-Southern Tech Air Shuttle", durations: { plane: 1.6 } },
  { from: "BOM", to: "MAA", modes: ["plane"], distanceKm: 1030, corridorName: "Peninsular Cross-Coast Air Corridor", durations: { plane: 1.8 } },
  { from: "BOM", to: "COK", modes: ["plane"], distanceKm: 1070, corridorName: "Arabian Sea Air Express", durations: { plane: 1.9 } },
  { from: "BLR", to: "CCU", modes: ["plane"], distanceKm: 1560, corridorName: "Eastern Tech Corriodor Flight", durations: { plane: 2.4 } },
  { from: "NAG", to: "DEL", modes: ["plane"], distanceKm: 860, corridorName: "Nagpur-Capital Air Feeder", durations: { plane: 1.5 } },
  { from: "NAG", to: "BLR", modes: ["plane"], distanceKm: 920, corridorName: "Zero-Mile Southern Air Feeder", durations: { plane: 1.6 } },
  { from: "NAG", to: "CCU", modes: ["plane"], distanceKm: 970, corridorName: "Zero-Mile Eastern Air Feeder", durations: { plane: 1.7 } },
];

// ============================================================================
// 3. UP NEXT ROUTE RECOMMENDATION INTERFACES
// ============================================================================

export interface UpNextRouteOption {
  id: string;
  category: "optimal" | "air" | "train" | "road";
  title: string;
  badge: string;
  recommended: boolean;
  targetHubId: string;
  targetHubName: string;
  targetNodeCode: string;
  targetCity: string;
  transitMode: TransportMode;
  vehiclePlateOrId: string;
  durationText: string;
  distanceKm: number;
  corridorName: string;
  fullPathNodes: string[]; // e.g. ["NAG", "BHO", "DEL"]
  description: string;
  costTier: "Lowest Cost" | "Economical" | "Fastest" | "Priority Express";
  whyPickThis: string;
}

// ============================================================================
// 4. CITY TO GRAPH NODE RESOLVER
// ============================================================================

export function resolveCityToNode(cityName?: string, stateName?: string): IndiaCityNode {
  const city = (cityName || "").toLowerCase().trim();
  const state = (stateName || "").toLowerCase().trim();

  // Direct match by node name or id
  const directMatch = INDIA_29_CITIES.find(
    (c) => c.name.toLowerCase() === city || c.id.toLowerCase() === city || c.code.toLowerCase() === city
  );
  if (directMatch) return directMatch;

  // Partial match by city keyword
  if (city.includes("delhi") || city.includes("noida") || city.includes("gurgaon") || city.includes("gurugram") || city.includes("faridabad") || city.includes("ghaziabad")) {
    return INDIA_29_CITIES.find((c) => c.id === "DEL")!;
  }
  if (city.includes("mumbai") || city.includes("thane") || city.includes("navi mumbai") || city.includes("kalyan")) {
    return INDIA_29_CITIES.find((c) => c.id === "BOM")!;
  }
  if (city.includes("kolkata") || city.includes("howrah") || city.includes("hooghly")) {
    return INDIA_29_CITIES.find((c) => c.id === "CCU")!;
  }
  if (city.includes("asansol") || city.includes("durgapur") || city.includes("raniganj") || city.includes("bardhaman")) {
    return INDIA_29_CITIES.find((c) => c.id === "ASN")!;
  }
  if (city.includes("bengaluru") || city.includes("bangalore") || city.includes("whitefield") || city.includes("mysore") || city.includes("mysuru")) {
    return INDIA_29_CITIES.find((c) => c.id === "BLR")!;
  }
  if (city.includes("chennai") || city.includes("madras") || city.includes("kanchipuram")) {
    return INDIA_29_CITIES.find((c) => c.id === "MAA")!;
  }
  if (city.includes("hyderabad") || city.includes("secunderabad") || city.includes("cyberabad")) {
    return INDIA_29_CITIES.find((c) => c.id === "HYD")!;
  }
  if (city.includes("ahmedabad") || city.includes("gandhinagar") || city.includes("vadodara")) {
    return INDIA_29_CITIES.find((c) => c.id === "AMD")!;
  }
  if (city.includes("surat") || city.includes("bharuch") || city.includes("navsari") || city.includes("vapi")) {
    return INDIA_29_CITIES.find((c) => c.id === "STV")!;
  }
  if (city.includes("pune") || city.includes("pimpri") || city.includes("chinchwad") || city.includes("satara")) {
    return INDIA_29_CITIES.find((c) => c.id === "PNQ")!;
  }
  if (city.includes("nagpur") || city.includes("wardha") || city.includes("amravati") || city.includes("chandrapur")) {
    return INDIA_29_CITIES.find((c) => c.id === "NAG")!;
  }
  if (city.includes("patna") || city.includes("rathur") || city.includes("gaya") || city.includes("muzaffarpur") || city.includes("bhagalpur")) {
    return INDIA_29_CITIES.find((c) => c.id === "PAT")!;
  }
  if (city.includes("ranchi") || city.includes("jamshedpur") || city.includes("dhanbad") || city.includes("bokaro")) {
    return INDIA_29_CITIES.find((c) => c.id === "IXR")!;
  }
  if (city.includes("bhubaneswar") || city.includes("cuttack") || city.includes("puri") || city.includes("rourkela")) {
    return INDIA_29_CITIES.find((c) => c.id === "BBI")!;
  }
  if (city.includes("lucknow") || city.includes("ayodhya") || city.includes("barabanki")) {
    return INDIA_29_CITIES.find((c) => c.id === "LKO")!;
  }
  if (city.includes("kanpur") || city.includes("unnao")) {
    return INDIA_29_CITIES.find((c) => c.id === "KNU")!;
  }
  if (city.includes("varanasi") || city.includes("benaras") || city.includes("prayagraj") || city.includes("allahabad") || city.includes("mirzapur")) {
    return INDIA_29_CITIES.find((c) => c.id === "VNS")!;
  }
  if (city.includes("jaipur") || city.includes("ajmer") || city.includes("jodhpur") || city.includes("kota") || city.includes("udaipur")) {
    return INDIA_29_CITIES.find((c) => c.id === "JAI")!;
  }
  if (city.includes("chandigarh") || city.includes("mohali") || city.includes("panchkula") || city.includes("ludhiana") || city.includes("amritsar") || city.includes("jalandhar")) {
    return INDIA_29_CITIES.find((c) => c.id === "IXC")!;
  }
  if (city.includes("dehradun") || city.includes("haridwar") || city.includes("rishikesh") || city.includes("roorkee") || city.includes("nainital")) {
    return INDIA_29_CITIES.find((c) => c.id === "DED")!;
  }
  if (city.includes("srinagar") || city.includes("jammu") || city.includes("anantnag") || city.includes("baramulla")) {
    return INDIA_29_CITIES.find((c) => c.id === "SXR")!;
  }
  if (city.includes("guwahati") || city.includes("dispur") || city.includes("silchar") || city.includes("shillong") || city.includes("agartala") || city.includes("dibrugarh") || city.includes("jorhat")) {
    return INDIA_29_CITIES.find((c) => c.id === "GAU")!;
  }
  if (city.includes("bhopal") || city.includes("ujjain") || city.includes("gwalior") || city.includes("jabalpur")) {
    return INDIA_29_CITIES.find((c) => c.id === "BHO")!;
  }
  if (city.includes("indore") || city.includes("dewas")) {
    return INDIA_29_CITIES.find((c) => c.id === "IDR")!;
  }
  if (city.includes("raipur") || city.includes("bhilai") || city.includes("bilaspur") || city.includes("durg")) {
    return INDIA_29_CITIES.find((c) => c.id === "RPR")!;
  }
  if (city.includes("goa") || city.includes("panaji") || city.includes("margao") || city.includes("vasco")) {
    return INDIA_29_CITIES.find((c) => c.id === "GOI")!;
  }
  if (city.includes("visakhapatnam") || city.includes("vizag") || city.includes("vijayawada") || city.includes("guntur") || city.includes("tirupati")) {
    return INDIA_29_CITIES.find((c) => c.id === "VTZ")!;
  }
  if (city.includes("coimbatore") || city.includes("salem") || city.includes("erode") || city.includes("tirupur") || city.includes("madurai")) {
    return INDIA_29_CITIES.find((c) => c.id === "CJB")!;
  }
  if (city.includes("kochi") || city.includes("cochin") || city.includes("thiruvananthapuram") || city.includes("trivandrum") || city.includes("kozhikode") || city.includes("calicut") || city.includes("kollam") || city.includes("thrissur")) {
    return INDIA_29_CITIES.find((c) => c.id === "COK")!;
  }

  // Fallback by State
  if (state.includes("kashmir") || state.includes("jammu") || state.includes("ladakh")) return INDIA_29_CITIES.find((c) => c.id === "SXR")!;
  if (state.includes("punjab") || state.includes("haryana") || state.includes("himachal")) return INDIA_29_CITIES.find((c) => c.id === "IXC")!;
  if (state.includes("uttarakhand")) return INDIA_29_CITIES.find((c) => c.id === "DED")!;
  if (state.includes("rajasthan")) return INDIA_29_CITIES.find((c) => c.id === "JAI")!;
  if (state.includes("uttar pradesh") || state.includes("up")) return INDIA_29_CITIES.find((c) => c.id === "LKO")!;
  if (state.includes("bihar")) return INDIA_29_CITIES.find((c) => c.id === "PAT")!;
  if (state.includes("jharkhand")) return INDIA_29_CITIES.find((c) => c.id === "IXR")!;
  if (state.includes("bengal")) return INDIA_29_CITIES.find((c) => c.id === "CCU")!;
  if (state.includes("odisha") || state.includes("orissa")) return INDIA_29_CITIES.find((c) => c.id === "BBI")!;
  if (state.includes("assam") || state.includes("meghalaya") || state.includes("tripura") || state.includes("mizoram") || state.includes("manipur") || state.includes("nagaland") || state.includes("arunachal")) return INDIA_29_CITIES.find((c) => c.id === "GAU")!;
  if (state.includes("madhya pradesh") || state.includes("mp")) return INDIA_29_CITIES.find((c) => c.id === "BHO")!;
  if (state.includes("chhattisgarh")) return INDIA_29_CITIES.find((c) => c.id === "RPR")!;
  if (state.includes("gujarat")) return INDIA_29_CITIES.find((c) => c.id === "AMD")!;
  if (state.includes("maharashtra")) return INDIA_29_CITIES.find((c) => c.id === "BOM")!;
  if (state.includes("goa")) return INDIA_29_CITIES.find((c) => c.id === "GOI")!;
  if (state.includes("telangana")) return INDIA_29_CITIES.find((c) => c.id === "HYD")!;
  if (state.includes("andhra")) return INDIA_29_CITIES.find((c) => c.id === "VTZ")!;
  if (state.includes("karnataka")) return INDIA_29_CITIES.find((c) => c.id === "BLR")!;
  if (state.includes("tamil")) return INDIA_29_CITIES.find((c) => c.id === "MAA")!;
  if (state.includes("kerala")) return INDIA_29_CITIES.find((c) => c.id === "COK")!;

  // Absolute Central Hub fallback (Nagpur Zero-Mile)
  return INDIA_29_CITIES.find((c) => c.id === "NAG")!;
}

export function resolveHubIdToNode(hubId?: string): IndiaCityNode {
  if (!hubId) return INDIA_29_CITIES.find((c) => c.id === "NAG")!;
  const idLower = hubId.toLowerCase();

  if (idLower.includes("stk") || idLower.includes("stock") || idLower.includes("nag")) {
    return INDIA_29_CITIES.find((c) => c.id === "NAG")!;
  }
  if (idLower.includes("del")) return INDIA_29_CITIES.find((c) => c.id === "DEL")!;
  if (idLower.includes("bom")) return INDIA_29_CITIES.find((c) => c.id === "BOM")!;
  if (idLower.includes("ccu")) return INDIA_29_CITIES.find((c) => c.id === "CCU")!;
  if (idLower.includes("blr")) return INDIA_29_CITIES.find((c) => c.id === "BLR")!;
  if (idLower.includes("maa")) return INDIA_29_CITIES.find((c) => c.id === "MAA")!;
  if (idLower.includes("gau")) return INDIA_29_CITIES.find((c) => c.id === "GAU")!;
  if (idLower.includes("amd")) return INDIA_29_CITIES.find((c) => c.id === "AMD")!;
  if (idLower.includes("lko")) return INDIA_29_CITIES.find((c) => c.id === "LKO")!;
  if (idLower.includes("asn")) return INDIA_29_CITIES.find((c) => c.id === "ASN")!;
  if (idLower.includes("pat")) return INDIA_29_CITIES.find((c) => c.id === "PAT")!;

  return INDIA_29_CITIES.find((c) => c.id === "NAG")!;
}

// ============================================================================
// 5. GRAPH PATHFINDING & MULTI-MODAL PRE-ROUTING ENGINE
// ============================================================================

interface GraphPathResult {
  path: string[]; // Node codes e.g. ["NAG", "CCU", "ASN"]
  totalKm: number;
  primaryMode: TransportMode;
  corridorName: string;
  durationHours: number;
}

/**
 * Breadth-first / edge-weighted multi-modal graph search between two nodes
 */
export function findGraphPath(
  startNodeId: string,
  endNodeId: string,
  preferredMode?: TransportMode
): GraphPathResult {
  if (startNodeId === endNodeId) {
    return {
      path: [startNodeId],
      totalKm: 25,
      primaryMode: "van",
      corridorName: "Local Metro & Last-Mile Corridor",
      durationHours: 1.5,
    };
  }

  // Direct edge check first
  const directEdge = INDIA_LOGISTICS_EDGES.find(
    (e) =>
      ((e.from === startNodeId && e.to === endNodeId) ||
        (e.from === endNodeId && e.to === startNodeId)) &&
      (!preferredMode || e.modes.includes(preferredMode))
  );

  if (directEdge) {
    const mode = preferredMode && directEdge.modes.includes(preferredMode)
      ? preferredMode
      : directEdge.modes[0];
    const dur = directEdge.durations[mode as keyof typeof directEdge.durations] || 6;
    return {
      path: [startNodeId, endNodeId],
      totalKm: directEdge.distanceKm,
      primaryMode: mode,
      corridorName: directEdge.corridorName,
      durationHours: dur,
    };
  }

  // BFS Queue to find connected path
  const queue: { current: string; path: string[]; totalKm: number; duration: number }[] = [
    { current: startNodeId, path: [startNodeId], totalKm: 0, duration: 0 },
  ];
  const visited = new Set<string>([startNodeId]);

  let bestResult: GraphPathResult | null = null;

  while (queue.length > 0) {
    const { current, path, totalKm, duration } = queue.shift()!;

    if (current === endNodeId) {
      bestResult = {
        path,
        totalKm,
        primaryMode: preferredMode || "train",
        corridorName: "Multi-Hop National Logistics Network",
        durationHours: duration,
      };
      break;
    }

    // Find neighbors
    const edges = INDIA_LOGISTICS_EDGES.filter(
      (e) =>
        (e.from === current || e.to === current) &&
        (!preferredMode || e.modes.includes(preferredMode))
    );

    for (const edge of edges) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const mode = preferredMode && edge.modes.includes(preferredMode)
          ? preferredMode
          : edge.modes[0];
        const edgeDur = edge.durations[mode as keyof typeof edge.durations] || 5;
        queue.push({
          current: neighbor,
          path: [...path, neighbor],
          totalKm: totalKm + edge.distanceKm,
          duration: duration + edgeDur,
        });
      }
    }
  }

  if (bestResult) return bestResult;

  // Fallback direct synthetic path if disconnected in preferred mode
  return {
    path: [startNodeId, endNodeId],
    totalKm: 850,
    primaryMode: preferredMode || "truck",
    corridorName: "Direct Trunk Highway / Airlink",
    durationHours: preferredMode === "plane" ? 2.5 : 14,
  };
}

// ============================================================================
// 6. GENERATE UP-NEXT SMART ROUTE SELECTION OPTIONS
// ============================================================================

export function getUpNextRoutingOptions(
  activeHubId: string,
  customer?: { city?: string; state?: string; address?: string }
): UpNextRouteOption[] {
  const currentNode = resolveHubIdToNode(activeHubId);
  const destNode = resolveCityToNode(customer?.city, customer?.state);

  const isAlreadyAtDestHub = currentNode.id === destNode.id || currentNode.hubId === destNode.hubId;

  // 1. If package is already at destination hub: Local Last-Mile Doorstep options
  if (isAlreadyAtDestHub) {
    return [
      {
        id: "opt-lastmile-van",
        category: "optimal",
        title: "⚡ Priority Doorstep Courier (Van Delivery)",
        badge: "RECOMMENDED LAST-MILE",
        recommended: true,
        targetHubId: destNode.hubId,
        targetHubName: `${destNode.name} Delivery Gate`,
        targetNodeCode: destNode.id,
        targetCity: destNode.name,
        transitMode: "van",
        vehiclePlateOrId: `${destNode.code}-VN-4091`,
        durationText: "2 - 4 Hours",
        distanceKm: 25,
        corridorName: "Intra-City Doorstep Sector Handover",
        fullPathNodes: [currentNode.id, destNode.id],
        description: `Consignment is in the local destination zone (${destNode.name}). Stage for afternoon courier route directly to doorstep address.`,
        costTier: "Lowest Cost",
        whyPickThis: "Same-city destination. Direct delivery to customer entrance with live OTP and signature proof of delivery.",
      },
      {
        id: "opt-lastmile-bike",
        category: "road",
        title: "⚡ Express 2-Wheeler Courier (Bike Delivery)",
        badge: "HYPERLOCAL EXPRESS",
        recommended: false,
        targetHubId: destNode.hubId,
        targetHubName: `${destNode.name} Fast Gate`,
        targetNodeCode: destNode.id,
        targetCity: destNode.name,
        transitMode: "bike",
        vehiclePlateOrId: `${destNode.code}-BK-8820`,
        durationText: "60 - 90 Mins",
        distanceKm: 15,
        corridorName: "Hyperlocal High-Speed Traffic Bypass",
        fullPathNodes: [currentNode.id, destNode.id],
        description: "Lightweight audio headset package. Ideal for rapid city navigation through dense metro traffic.",
        costTier: "Lowest Cost",
        whyPickThis: "Fastest intra-city traversal through dense downtown corridors.",
      },
    ];
  }

  // 2. Inter-Hub Traversal Paths (Air, Rail, Road, Optimal)
  const airPath = findGraphPath(currentNode.id, destNode.id, "plane");
  const railPath = findGraphPath(currentNode.id, destNode.id, "train");
  const roadPath = findGraphPath(currentNode.id, destNode.id, "truck");

  // Determine optimal path:
  // If distance > 900 km, Air or Rail is optimal. If < 500 km, Road/Rail is optimal.
  const isHighDistance = roadPath.totalKm > 800;
  const optimalPath = isHighDistance ? (airPath.totalKm > 0 ? airPath : railPath) : railPath;

  // Resolve immediate next hop node
  const getNextHopNode = (path: string[]) => {
    if (path.length >= 2) {
      const code = path[1];
      return INDIA_29_CITIES.find((c) => c.id === code) || destNode;
    }
    return destNode;
  };

  const nextOptNode = getNextHopNode(optimalPath.path);
  const nextAirNode = getNextHopNode(airPath.path);
  const nextRailNode = getNextHopNode(railPath.path);
  const nextRoadNode = getNextHopNode(roadPath.path);

  const options: UpNextRouteOption[] = [
    // 1. OPTIMAL BALANCED MULTI-MODAL ROUTE
    {
      id: "opt-balanced",
      category: "optimal",
      title: `⚡ Recommended Trunk Route: ${currentNode.name} ➔ ${nextOptNode.name}`,
      badge: "OPTIMAL EFFICIENCY",
      recommended: true,
      targetHubId: nextOptNode.hubId,
      targetHubName: nextOptNode.name,
      targetNodeCode: nextOptNode.id,
      targetCity: nextOptNode.name,
      transitMode: optimalPath.primaryMode,
      vehiclePlateOrId:
        optimalPath.primaryMode === "train"
          ? "IR-12302"
          : optimalPath.primaryMode === "plane"
          ? "FLT-6E-204"
          : `${currentNode.code}-TRK-8812`,
      durationText: `${Math.round(optimalPath.durationHours)} Hours (Trunk)`,
      distanceKm: optimalPath.totalKm,
      corridorName: optimalPath.corridorName,
      fullPathNodes: optimalPath.path,
      description: `Automated corridor calculation: Staging consignment to ${nextOptNode.name} via ${optimalPath.primaryMode.toUpperCase()} provides the fastest verified delivery timeline towards ${destNode.name}.`,
      costTier: "Economical",
      whyPickThis: `Best balance of velocity & handling capacity along ${optimalPath.corridorName}.`,
    },

    // 2. DEDICATED FREIGHT RAIL (INDIAN RAILWAYS)
    {
      id: "opt-rail",
      category: "train",
      title: `🚆 Indian Railways Dedicated Freight: ${currentNode.name} ➔ ${nextRailNode.name}`,
      badge: "HEAVY RAIL DFC",
      recommended: !isHighDistance,
      targetHubId: nextRailNode.hubId,
      targetHubName: nextRailNode.name,
      targetNodeCode: nextRailNode.id,
      targetCity: nextRailNode.name,
      transitMode: "train",
      vehiclePlateOrId: "IR-12302",
      durationText: `${Math.round(railPath.durationHours)} Hours`,
      distanceKm: railPath.totalKm,
      corridorName: railPath.corridorName,
      fullPathNodes: railPath.path,
      description: `High-capacity bulk freight rake scheduled on Dedicated Freight Corridor (DFC). Monitored live via Indian Railways FOIS telematics.`,
      costTier: "Lowest Cost",
      whyPickThis: "Eco-friendly bulk rail transport with zero highway toll congestion and high transit reliability.",
    },

    // 3. AIR CARGO PRIORITY EXPRESS
    {
      id: "opt-air",
      category: "air",
      title: `✈️ Air Cargo Express: ${currentNode.name} ➔ ${nextAirNode.name}`,
      badge: "FASTEST VELOCITY",
      recommended: isHighDistance,
      targetHubId: nextAirNode.hubId,
      targetHubName: nextAirNode.name,
      targetNodeCode: nextAirNode.id,
      targetCity: nextAirNode.name,
      transitMode: "plane",
      vehiclePlateOrId: "FLT-6E-204",
      durationText: `${Math.round(airPath.durationHours)} - 3.5 Hours`,
      distanceKm: airPath.totalKm,
      corridorName: airPath.corridorName,
      fullPathNodes: airPath.path,
      description: `Direct air cargo bellyhold allocation. Handed over at airport cargo terminal and tracked via AeroAPI / FlightAware ADS-B.`,
      costTier: "Priority Express",
      whyPickThis: "Crucial for long-distance multi-state consignments requiring same-day or next-morning arrival.",
    },

    // 4. NATIONAL HIGHWAY ROAD TRUCK
    {
      id: "opt-road",
      category: "road",
      title: `🚛 National Highway Trunk: ${currentNode.name} ➔ ${nextRoadNode.name}`,
      badge: "EXPRESSWAY TRUCK",
      recommended: false,
      targetHubId: nextRoadNode.hubId,
      targetHubName: nextRoadNode.name,
      targetNodeCode: nextRoadNode.id,
      targetCity: nextRoadNode.name,
      transitMode: "truck",
      vehiclePlateOrId: `${currentNode.code}-01-TRK-9000`,
      durationText: `${Math.round(roadPath.durationHours)} Hours`,
      distanceKm: roadPath.totalKm,
      corridorName: roadPath.corridorName,
      fullPathNodes: roadPath.path,
      description: `Containerized heavy truck moving along Golden Quadrilateral / National Expressways. Automated toll verification via FASTag RFID pings.`,
      costTier: "Economical",
      whyPickThis: "Direct flexible highway link with continuous door-to-door transit and no airport/rail yard handling delays.",
    },
  ];

  return options;
}

