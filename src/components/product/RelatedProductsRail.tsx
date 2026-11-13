import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { ProductData } from "@/types";
import { CurrencyPrice } from "@/context/CurrencyContext";

export function RelatedProductsRail({
  products,
  title = "More from ancwave",
  eyebrow = "CROSS-PLATFORM RECOMMENDATIONS",
}: {
  products: ProductData[];
  title?: string;
  eyebrow?: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
              {eyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {title}
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View complete catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product, index) => {
            const image =
              product.variants?.[0]?.images?.[0] ||
              product.variants?.[0]?.image ||
              product.mediaGallery?.[0]?.url ||
              "/images/hero-silver.jpg";

            return (
              <div
                key={`${product.slug}-${index}`}
                className="group rounded-3xl bg-[#FBFBFA] border border-[#EAEAE5] p-5 flex flex-col justify-between hover:border-zinc-400 transition-all hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-4/3 rounded-2xl bg-white p-4 overflow-hidden border border-zinc-100">
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800">
                      {product.model}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200/60 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CurrencyPrice
                      usd={product.price}
                      inr={product.priceInr}
                      className="text-base font-bold text-zinc-900"
                    />
                    <span className="block text-[10px] font-mono text-zinc-400 truncate">
                      {product.category}
                    </span>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1 transition-all shrink-0"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
