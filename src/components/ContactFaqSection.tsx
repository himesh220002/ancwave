"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "@/components/Toaster";

export function ContactFaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0); // First item open by default like screenshot
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      question: "When will my Form 01 arrive?",
      answer:
        "Standard US shipping is $12. Your headphones arrive in 3–5 business days, with tracking sent to your inbox as soon as they leave us.",
    },
    {
      question: "Can I return them? · 30-day returns",
      answer:
        "Yes, absolutely. We offer a 30-day trial period from the date of delivery. If Form 01 isn't the perfect fit, return it in original packaging for a full refund with free prepaid return shipping.",
    },
    {
      question: "What's covered? · 2-year warranty",
      answer:
        "Every pair of Form 01 is backed by our comprehensive 2-year manufacturer warranty covering acoustic drivers, ANC active microphones, Bluetooth chipset, and structural hardware defects.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        type: "error",
        title: "Missing Fields",
        description: "Please fill out your name, email, and message before sending.",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate swift server response
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        type: "success",
        title: "Note Received",
        description: `Thank you, ${formData.name}. We'll get back to ${formData.email} within one business day.`,
      });
      setFormData({ name: "", email: "", message: "" });
    }, 600);
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-gray-50 border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-14 sm:space-y-16">
        {/* Section Eyebrow & Big Typography Header */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              05 / HERE WHEN YOU NEED US
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-tight">
              We&apos;re all ears.
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-zinc-500 max-w-sm md:text-right font-normal leading-relaxed">
              A question about your next pair? A little help with the ones you love? Let&apos;s talk.
            </p>
          </div>
        </div>

        {/* 2-Column Grid: Left Note Form & Right FAQ Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-2">
          {/* Left Column: Drop us a note */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              Drop us a note.
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0E0DB] bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0E0DB] bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help?"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0E0DB] bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <span>{isSubmitting ? "Sending..." : "Send message"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-zinc-500">
                  Real conversations. A reply within one business day.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: A few good answers & Direct Contacts */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                A few good answers.
              </h3>

              {/* FAQ Accordion List */}
              <div className="divide-y divide-[#EAEAE5] border-y border-[#EAEAE5]">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="py-4 sm:py-4.5">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left group cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-semibold text-[#111111] group-hover:text-blue-600 transition-colors pr-4">
                          {faq.question}
                        </span>
                        <span
                          className={`text-xl font-light transition-colors duration-200 shrink-0 leading-none ${isOpen ? "text-blue-600 font-medium" : "text-zinc-500 group-hover:text-zinc-800"
                            }`}
                        >
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="mt-3 text-xs sm:text-sm text-zinc-500 leading-relaxed pr-6 animate-fadeIn">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Contacts Strip */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#F0F0EB] sm:border-0 sm:pt-0">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase block mb-1">
                  WRITE TO US
                </span>
                <a
                  href="mailto:hello@ancwave.com"
                  className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition inline-flex items-center gap-1 group"
                >
                  hello@ancwave.com
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase block mb-1">
                  MON–FRI / 9–5 PT
                </span>
                <span className="text-xs sm:text-sm font-medium text-zinc-800">
                  +1 (503) 555-0148
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
