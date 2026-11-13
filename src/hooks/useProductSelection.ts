"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ProductColor,
  ProductData,
  TwsComponentOption,
  TwsComponentType,
  IVariant,
  IVariantGroup,
  childVariantsToVariantGroups,
  normalizeProductData,
} from "@/types";
import { toInr } from "@/lib/currency";
import { groupsForProduct } from "@/lib/product-layout";

interface SelectionOptions {
  initialColor?: string;
  initialComponent?: string;
}

export interface ProductSelection {
  product: ProductData;
  groups: IVariantGroup[];
  activeGroup: IVariantGroup | null;
  activeGroupColor: IVariantGroup["colors"][number] | null;
  activeVariant: ProductData["variants"][number] | null;
  activeChildVariant: IVariant | null;
  activeTwsOption: TwsComponentOption | null;
  images: string[];
  activeImageIndex: number;
  price: number;
  priceInr: number;
  originalPrice: number;
  stock: number;
  sku: string;
  groupId: string;
  colorId: ProductColor;
  childSku: string;
  twsComponentId: TwsComponentType;
  selectGroup: (groupId: string) => void;
  selectColor: (colorId: ProductColor) => void;
  selectChildSku: (sku: string) => void;
  selectTwsComponent: (component: TwsComponentType) => void;
  setActiveImageIndex: (index: number) => void;
}

function uniqueImages(...values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function useProductSelection(
  rawProduct: ProductData,
  options: SelectionOptions = {}
): ProductSelection {
  const product = useMemo(() => normalizeProductData(rawProduct), [rawProduct]);
  const groups = useMemo(() => groupsForProduct(product), [product]);

  const [groupId, setGroupId] = useState<string>(groups[0]?.id || "");
  const [colorId, setColorId] = useState<ProductColor>(
    options.initialColor || product.variants?.[0]?.id || "standard"
  );
  const [childSku, setChildSku] = useState<string>(
    product.childVariants?.[0]?.sku || ""
  );
  const [twsComponentId, setTwsComponentId] = useState<TwsComponentType>(
    (options.initialComponent as TwsComponentType) || "full-set"
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Products can be refreshed from the live API after mount. Derived values
  // below always fall back safely when a stored selection is no longer present,
  // so no state-sync effect is required.
  const activeGroup = useMemo(
    () => groups.find((group) => group.id === groupId) || groups[0] || null,
    [groups, groupId]
  );

  const activeGroupColor = useMemo(() => {
    if (!activeGroup) return null;
    return (
      activeGroup.colors.find((color) => color.sku === childSku) ||
      activeGroup.colors.find((color) => color.id === colorId) ||
      activeGroup.colors[0] ||
      null
    );
  }, [activeGroup, childSku, colorId]);

  const activeChildVariant = useMemo(() => {
    if (!product.childVariants || product.childVariants.length === 0) return null;
    return (
      product.childVariants.find((variant) => variant.sku === childSku) ||
      product.childVariants.find(
        (variant) =>
          variant.color.toLowerCase() === activeGroupColor?.color?.toLowerCase()
      ) ||
      product.childVariants[0] ||
      null
    );
  }, [product.childVariants, childSku, activeGroupColor?.color]);

  const activeVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    const targetName = (activeChildVariant?.color || activeGroupColor?.color || "").toLowerCase();
    return (
      product.variants.find((variant) => variant.id === colorId) ||
      product.variants.find((variant) => variant.name.toLowerCase() === targetName) ||
      product.variants[0] ||
      null
    );
  }, [product.variants, colorId, activeChildVariant?.color, activeGroupColor?.color]);

  const activeTwsOption = useMemo(() => {
    if (!product.isTws || !product.twsComponents) return null;
    return (
      product.twsComponents.find((component) => component.id === twsComponentId) ||
      product.twsComponents[0] ||
      null
    );
  }, [product.isTws, product.twsComponents, twsComponentId]);

  const images = useMemo(
    () =>
      uniqueImages(
        ...(activeChildVariant?.images || []),
        ...(activeVariant?.images || []),
        activeVariant?.image,
        activeGroupColor?.images?.[0],
        ...(product.mediaGallery?.map((item) => item.url) || [])
      ).slice(0, 8),
    [activeChildVariant?.images, activeVariant?.images, activeVariant?.image, activeGroupColor?.images, product.mediaGallery]
  );

  const price = useMemo(() => {
    if (activeTwsOption) return activeTwsOption.price;
    return (
      activeChildVariant?.price ??
      activeGroupColor?.price ??
      activeVariant?.price ??
      product.price
    );
  }, [activeTwsOption, activeChildVariant?.price, activeGroupColor?.price, activeVariant?.price, product.price]);

  const priceInr = useMemo(() => {
    if (activeTwsOption) return toInr(activeTwsOption.price);
    return (
      activeChildVariant?.priceInr ??
      activeGroupColor?.priceInr ??
      activeVariant?.priceInr ??
      product.priceInr ??
      toInr(price)
    );
  }, [activeTwsOption, activeChildVariant?.priceInr, activeGroupColor?.priceInr, activeVariant?.priceInr, product.priceInr, price]);

  const stock = useMemo(() => {
    if (activeTwsOption) return activeTwsOption.stock;
    return (
      activeChildVariant?.stock ??
      activeGroupColor?.stock ??
      activeVariant?.stock ??
      product.stock
    );
  }, [activeTwsOption, activeChildVariant?.stock, activeGroupColor?.stock, activeVariant?.stock, product.stock]);

  const sku = useMemo(() => {
    if (activeTwsOption) return activeTwsOption.sku;
    return activeChildVariant?.sku || activeVariant?.tag || product.sku;
  }, [activeTwsOption, activeChildVariant?.sku, activeVariant?.tag, product.sku]);

  const selectGroup = useCallback(
    (nextGroupId: string) => {
      setGroupId(nextGroupId);
      const nextGroup =
        groups.find((group) => group.id === nextGroupId) || groups[0] || null;
      const firstColor = nextGroup?.colors?.[0];
      if (firstColor) {
        setChildSku(firstColor.sku);
        const matchingVariant = product.variants.find(
          (variant) => variant.name.toLowerCase() === firstColor.color.toLowerCase()
        );
        if (matchingVariant) setColorId(matchingVariant.id);
      }
      setActiveImageIndex(0);
    },
    [groups, product.variants]
  );

  const selectColor = useCallback(
    (nextColorId: ProductColor) => {
      setColorId(nextColorId);
      const variant = product.variants.find((item) => item.id === nextColorId);
      const variantName = variant?.name?.toLowerCase() || "";
      const matchingChild = product.childVariants?.find(
        (child) => child.color.toLowerCase() === variantName
      );
      const matchingGroupColor = groups
        .flatMap((group) => group.colors.map((color) => ({ group, color })))
        .find(
          (entry) =>
            entry.color.id === nextColorId ||
            entry.color.color.toLowerCase() === variantName
        );

      if (matchingChild) {
        setChildSku(matchingChild.sku);
      } else if (matchingGroupColor?.color) {
        setChildSku(matchingGroupColor.color.sku);
      }

      if (matchingGroupColor?.group) {
        setGroupId(matchingGroupColor.group.id);
      }

      setActiveImageIndex(0);
    },
    [groups, product.childVariants, product.variants]
  );

  const selectChildSku = useCallback(
    (nextSku: string) => {
      setChildSku(nextSku);
      const child = product.childVariants?.find((variant) => variant.sku === nextSku);
      if (child) {
        const matchingVariant = product.variants.find(
          (variant) => variant.name.toLowerCase() === child.color.toLowerCase()
        );
        if (matchingVariant) setColorId(matchingVariant.id);
      }
      const ownerGroup = groups.find((group) =>
        group.colors.some((color) => color.sku === nextSku)
      );
      if (ownerGroup) setGroupId(ownerGroup.id);
      setActiveImageIndex(0);
    },
    [groups, product.childVariants, product.variants]
  );

  const selectTwsComponent = useCallback((component: TwsComponentType) => {
    setTwsComponentId(component);
    setActiveImageIndex(0);
  }, []);

  return {
    product,
    groups,
    activeGroup,
    activeGroupColor,
    activeVariant,
    activeChildVariant,
    activeTwsOption,
    images: images.length > 0 ? images : ["/images/hero-silver.jpg"],
    activeImageIndex: Math.min(activeImageIndex, Math.max(0, images.length - 1)),
    price,
    priceInr,
    originalPrice: activeTwsOption?.originalPrice ?? product.originalPrice,
    stock,
    sku,
    groupId: activeGroup?.id || groupId,
    colorId: activeVariant?.id || colorId,
    childSku: activeChildVariant?.sku || childSku,
    twsComponentId: activeTwsOption?.id || twsComponentId,
    selectGroup,
    selectColor,
    selectChildSku,
    selectTwsComponent,
    setActiveImageIndex,
  };
}

export { childVariantsToVariantGroups };
