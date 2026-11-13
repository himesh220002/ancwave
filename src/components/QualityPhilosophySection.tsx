import React from "react";
import { BadgeCheck, FlaskConical, PackageCheck, ShieldCheck } from "lucide-react";

const PILLARS = [
  {
    number: "01",
    icon: BadgeCheck,
    tag: "MATERIAL CERTIFICATION",
    title: "Raw, uncompromised materials.",
    description:
      "Every alloy, polymer, and textile enters the build with a traceable certificate. No substituted grades, no mystery suppliers, no cosmetic shortcuts.",
    proof: "Mill certificates on file",
  },
  {
    number: "02",
    icon: FlaskConical,
    tag: "INTERNAL QUALITY AUDITS",
    title: "No misleading labels.",
    description:
      "Acoustic output, battery endurance, and attenuation are measured on our own benches. Published figures are the figures we record — not the ones marketing prefers.",
    proof: "Bench-tested, not borrowed",
  },
  {
    number: "03",
    icon: PackageCheck,
    tag: "HERMETIC CLEANLINESS",
    title: "Factory-sealed, always.",
    description:
      "Each unit is assembled, inspected, and sealed in a controlled environment. The first person to open your ancwave object is you.",
    proof: "Single-use hygiene seal",
  },
];

const MARQUEE_ITEMS = [
  "MATERIAL CERTIFICATION",
  "INTERNAL QUALITY AUDITS",
  "HERMETIC CLEANLINESS",
  "NO BORROWED BENCHMARKS",
  "FACTORY-SEALED DELIVERY",
];

/** Lightweight horizontal ticker used between the manifesto and the pillars. */
function QualityMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#141613] py-3.5">
      <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#141613] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#141613] to-transparent z-10 pointer-events-none" />
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {[0, 1].map((loop) => (
          <div key={loop} className="flex items-center gap-8" aria-hidden={loop === 1}>
            {MARQUEE_ITEMS.map((item) => (
              <span key={`${loop}-${item}`} className="flex items-center gap-8">
                <span className="text-[10px] font-mono tracking-[0.24em] text-white/55 uppercase">
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-500/80" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QualityPhilosophySection() {
  return (
    <section
      id="refined-quality"
      className="relative bg-[#181B18] text-white overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.5), transparent 45%), radial-gradient(circle at 85% 100%, rgba(255,255,255,0.18), transparent 50%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 sm:pt-24 pb-14 sm:pb-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-mono tracking-[0.18em] text-white/50 uppercase">
                03 / REFINED QUALITY
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              Purity is a process.
              <br />
              <span className="text-white/45">Not a claim.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-1">
            <p className="text-sm text-white/55 leading-relaxed">
              ancwave exists to remove the distance between what a product says
              and what it actually is. Three internal standards govern every
              object we seal — from the raw material certificate to the final
              hermetic wrap.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.number}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-7 space-y-5 transition-colors duration-500 hover:bg-white/[0.06] hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-white/30">
                    {pillar.number}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono tracking-[0.16em] text-blue-300/80 uppercase font-semibold">
                    {pillar.tag}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-white/50 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {pillar.proof}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <QualityMarquee />
    </section>
  );
}
