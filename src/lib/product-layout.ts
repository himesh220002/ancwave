import {
  ECOMMERCE_CATEGORIES,
  ProductData,
  IVariant,
  IVariantGroup,
} from "@/types";

export type ProductLayoutFamily =
  | "audio-over-ear"
  | "audio-tws"
  | "audio-in-ear"
  | "apparel"
  | "smartphone"
  | "general";

export interface ProductLayoutProfile {
  family: ProductLayoutFamily;
  isAudio: boolean;
  label: string;
  shortLabel: string;
  eyebrow: string;
  specTitle: string;
  galleryLabels: string[];
  accent: string;
}

const AUDIO_GALLERY_LABELS = [
  "Studio Front View",
  "Precision Macro Detail",
  "Ergonomic Profile",
  "Lifestyle In-Use",
  "Acoustic Chamber",
  "Architectural Angle",
];

const GENERAL_GALLERY_LABELS = [
  "Studio Front View",
  "Material Detail",
  "Construction Profile",
  "Lifestyle In-Use",
  "Edition Detail",
  "Packaging",
];

export function resolveProductLayout(
  product: Pick<ProductData, "categorySlug" | "category" | "type" | "isTws" | "name">
): ProductLayoutProfile {
  const haystack = `${product.categorySlug || ""} ${product.category || ""} ${product.type || ""} ${product.name || ""}`.toLowerCase();

  const isEarbuds =
    product.categorySlug === "earbuds" ||
    product.isTws === true ||
    /true wireless|tws|earbud/.test(haystack);

  if (product.categorySlug === "headphones" || /over-ear|over ear/.test(haystack)) {
    return {
      family: "audio-over-ear",
      isAudio: true,
      label: "Over-Ear Headphones",
      shortLabel: "Over-ear",
      eyebrow: "ACOUSTIC ARCHITECTURE / OVER-EAR",
      specTitle: "Detailed Hardware Specifications",
      galleryLabels: AUDIO_GALLERY_LABELS,
      accent: "blue",
    };
  }

  if (isEarbuds) {
    return {
      family: "audio-tws",
      isAudio: true,
      label: "True Wireless Earbuds",
      shortLabel: "True wireless",
      eyebrow: "ACOUSTIC ARCHITECTURE / TRUE WIRELESS",
      specTitle: "Detailed Earbud Specifications",
      galleryLabels: AUDIO_GALLERY_LABELS,
      accent: "blue",
    };
  }

  if (product.categorySlug === "earphones" || /in-ear|in ear|sports|iem/.test(haystack)) {
    return {
      family: "audio-in-ear",
      isAudio: true,
      label: "In-Ear Sports Earphones",
      shortLabel: "In-ear sports",
      eyebrow: "ACOUSTIC ARCHITECTURE / IN-EAR SPORT",
      specTitle: "Detailed In-Ear Specifications",
      galleryLabels: AUDIO_GALLERY_LABELS,
      accent: "blue",
    };
  }

  if (/apparel|fashion|clothing|hoodie|fabric/.test(haystack)) {
    return {
      family: "apparel",
      isAudio: false,
      label: "Apparel & Fashion",
      shortLabel: "Apparel",
      eyebrow: "MATERIAL STUDY / APPAREL",
      specTitle: "Fabric, Fit & Construction",
      galleryLabels: GENERAL_GALLERY_LABELS,
      accent: "stone",
    };
  }

  if (/smartphone|electronics|mobile|display|chipset/.test(haystack)) {
    return {
      family: "smartphone",
      isAudio: false,
      label: "Electronics & Mobile",
      shortLabel: "Electronics",
      eyebrow: "ENGINEERING STUDY / MOBILE HARDWARE",
      specTitle: "Technical Specifications",
      galleryLabels: GENERAL_GALLERY_LABELS,
      accent: "blue",
    };
  }

  return {
    family: "general",
    isAudio: false,
    label: product.category || "ancwave Object",
    shortLabel: product.category || "Object",
    eyebrow: "MATERIAL STUDY / ANC WAVE OBJECT",
    specTitle: "Materials, Dimensions & Construction",
    galleryLabels: GENERAL_GALLERY_LABELS,
    accent: "stone",
  };
}

export function formatCategoryLabel(categorySlug?: string, fallback?: string): string {
  if (!categorySlug || categorySlug === "all") return "All audio";
  const known = ECOMMERCE_CATEGORIES.find((c) => c.slug === categorySlug);
  if (categorySlug === "headphones") return "Over-ear";
  if (categorySlug === "earbuds") return "True wireless";
  if (categorySlug === "earphones") return "In-ear sports";
  if (known) return known.name;
  return fallback?.split("/").pop()?.trim() || "Catalog";
}

export function getCatalogHref(product: Pick<ProductData, "slug">) {
  return `/products/${product.slug}`;
}

export function getPrimaryProductImage(product: ProductData, child?: IVariant | null): string {
  return (
    child?.images?.[0] ||
    product.variants?.[0]?.images?.[0] ||
    product.variants?.[0]?.image ||
    product.mediaGallery?.[0]?.url ||
    "/images/hero-silver.jpg"
  );
}

export function getAlternateProductImage(product: ProductData, child?: IVariant | null): string {
  const candidates = [
    child?.images?.[1],
    product.variants?.[0]?.images?.[1],
    product.mediaGallery?.find((m) => m.type === "360" || m.type === "macro")?.url,
    product.explodedView?.image,
    product.variants?.[0]?.images?.[0],
    product.variants?.[0]?.image,
  ].filter((v): v is string => Boolean(v));

  return candidates.find((src) => src !== getPrimaryProductImage(product, child)) || getPrimaryProductImage(product, child);
}

export function mergeSpecEntries(
  product: ProductData,
  child?: IVariant | null
): Array<{ label: string; value: string; isOverride?: boolean }> {
  const global = product.globalSpecs || {};
  const overrides = child?.variantSpecs || {};
  const keys = Array.from(new Set([...Object.keys(global), ...Object.keys(overrides)]));

  const rows = keys
    .map((label) => ({
      label,
      value: overrides[label] || global[label] || "",
      isOverride: label in overrides,
    }))
    .filter((row) => Boolean(row.value));

  if (rows.length > 0) return rows;

  const specRows = Object.entries(product.specs || {})
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label: humanizeSpecKey(label), value: String(value) }));

  if (specRows.length > 0) return specRows;

  return [
    { label: "Warranty", value: `${product.warrantyYears || 2} years included` },
    { label: "Trial", value: `${product.returnDays || 30}-day home trial` },
    { label: "Construction", value: product.specs?.materials || "Precision engineered" },
  ];
}

export function humanizeSpecKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function groupsForProduct(product: ProductData): IVariantGroup[] {
  if (product.variantGroups && product.variantGroups.length > 0) {
    return product.variantGroups;
  }
  return product.childVariants && product.childVariants.length > 0
    ? [
        {
          id: "editions",
          name: "Available Editions",
          specOverride: "Available Editions",
          price: product.price,
          colors: product.childVariants.map((cv, idx) => ({
            id: `edition-${idx + 1}`,
            sku: cv.sku,
            color: cv.color,
            price: cv.price,
            priceInr: cv.priceInr,
            stock: cv.stock,
            images: cv.images,
          })),
        },
      ]
    : [];
}
