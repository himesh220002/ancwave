import React from "react";
import { NavbarSkeleton, Skeleton } from "@/components/Skeleton";

export default function AWSArchitectureLoading() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <NavbarSkeleton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-8 w-full flex-1">
        <div className="space-y-3">
          <Skeleton className="w-36 h-4 rounded-full" />
          <Skeleton className="w-2/3 h-10 rounded-xl" />
          <Skeleton className="w-1/2 h-4 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
