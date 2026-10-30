import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, sampleCatalog } from "@/lib/store";
import { ProductDetailView } from "@/components/ProductDetailView";
import { ProductData, ColorVariant, normalizeProductData } from "@/types";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProduct(slug: string): Promise<ProductData | null> {
  try {
    const db = await connectDB();
    if (db) {
      const doc = await ProductModel.findOne({
        $or: [{ slug }, { productId: slug }, { id: slug }],
      }).lean();
      if (doc) {
        return normalizeProductData(doc as any);
      }
    }
  } catch (err) {
    console.warn("DB product lookup notice:", err);
  }
  const fallback = getProductBySlug(slug);
  return fallback ? normalizeProductData(fallback) : null;
}

async function fetchRelatedProducts(currentSlug: string): Promise<ProductData[]> {
  try {
    const db = await connectDB();
    if (db) {
      const docs = await ProductModel.find({
        $and: [{ slug: { $ne: currentSlug } }, { productId: { $ne: currentSlug } }],
      })
        .limit(4)
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => normalizeProductData(d));
      }
    }
  } catch (err) {
    console.warn("DB related products notice:", err);
  }
  return sampleCatalog.filter((p) => p.slug !== currentSlug).map(normalizeProductData);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Audio Platform Not Found | ancwave",
      description: "The requested audio hardware is not currently available in the catalog.",
    };
  }

  // Dynamic Metadata Formula per specification:
  // [Brand] [Model] [Category Type] - Features, Specs & Reviews | [Store Name]
  const title = `ancwave ${product.name} ${product.model} - Features, Specs & Reviews | ancwave`;
  const specHighlights = product.specs?.driver
    ? `Featuring ${product.specs.noiseControl || "Adaptive Shield"}, ${product.specs.driver}, and ${product.specs.batteryLife || "Extended battery"}.`
    : product.description;
  const description = `${product.tagline} Meet ${product.name} (${product.category}). ${specHighlights} Insured delivery with 30-day home trial.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://ancwave.com/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://ancwave.com/products/${product.slug}`,
      siteName: "ancwave Acoustics",
      images: [
        {
          url: product.variants[0]?.image || "/images/hero-silver.jpg",
          width: 1200,
          height: 630,
          alt: `${product.name} - ${product.tagline}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.variants[0]?.image || "/images/hero-silver.jpg"],
    },
  };
}

export default async function ProductSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const rawProduct = await fetchProduct(slug);

  if (!rawProduct) {
    notFound();
  }

  const product: ProductData = JSON.parse(JSON.stringify(rawProduct));

  // Filter other products for the "More from ancwave Acoustics" lineup recommendations
  const relatedProducts: ProductData[] = await fetchRelatedProducts(product.slug);

  // Structured JSON-LD SEO Schema per specification
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `ancwave ${product.name}`,
    image: (product.variants || []).map((v: ColorVariant) => `https://ancwave.com${v.image}`),
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: "ancwave",
    },
    offers: {
      "@type": "Offer",
      url: `https://ancwave.com/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      priceValidUntil: "2027-12-31",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ancwave.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Audio Lineup",
        item: "https://ancwave.com/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `https://ancwave.com/products?category=${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `https://ancwave.com/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Product JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Breadcrumbs JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Main Interactive Product Slug View */}
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
