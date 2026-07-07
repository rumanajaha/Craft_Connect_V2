import React from "react";


function StatCardSkeleton() {
  return (
    <div className="bg-white border border-brand-border/40 p-5 rounded-2xl animate-pulse space-y-3">
      <div className="h-3 w-20 bg-brand-border/30 rounded-full" />
      <div className="h-6 w-32 bg-brand-border/20 rounded-full" />
      <div className="h-3.5 w-24 bg-brand-border/10 rounded-full" />
    </div>
  );
}


function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-brand-border/10 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-border/30" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-brand-border/20 rounded-full" />
          <div className="h-3 w-20 bg-brand-border/10 rounded-full" />
        </div>
      </div>
      <div className="h-3 w-16 bg-brand-border/20 rounded-full" />
      <div className="h-7 w-20 bg-brand-border/20 rounded-full" />
    </div>
  );
}


export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 bg-white border border-brand-border/40 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-brand-border/30 pb-4">
            <div className="h-5 w-40 bg-brand-border/30 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-brand-border/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-1">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        </div>

        
        <div className="lg:col-span-4 bg-white border border-brand-border/40 rounded-3xl p-6 space-y-6">
          <div className="h-5 w-32 bg-brand-border/30 rounded-full animate-pulse border-b border-brand-border/30 pb-4" />
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-border/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-brand-border/20 rounded-full" />
                  <div className="h-3 w-1/2 bg-brand-border/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export function GridSkeleton({ tileCount = 8 }) {
  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center pb-4">
        <div className="space-y-2 animate-pulse">
          <div className="h-6 w-48 bg-brand-border/30 rounded-full" />
          <div className="h-3 w-64 bg-brand-border/15 rounded-full" />
        </div>
        <div className="h-10 w-44 bg-brand-border/20 rounded-xl animate-pulse" />
      </div>

      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: tileCount }).map((_, i) => (
          <div key={i} className="bg-white border border-brand-border/20 rounded-2xl overflow-hidden aspect-square flex flex-col justify-between p-4">
            <div className="w-full h-full bg-brand-border/15 rounded-xl mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-brand-border/25 rounded-full" />
              <div className="h-3.5 w-1/2 bg-brand-border/15 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export function MessagesSkeleton() {
  return (
    <div className="bg-white border border-brand-border/40 rounded-3xl overflow-hidden h-[calc(100vh-180px)] min-h-[500px] grid grid-cols-12 animate-pulse">
      
      <div className="col-span-4 border-r border-brand-border/40 p-4 space-y-4">
        <div className="h-9 w-full bg-brand-border/20 rounded-xl" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-brand-border/30 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-3.5 w-2/3 bg-brand-border/20 rounded-full" />
                <div className="h-3 w-5/6 bg-brand-border/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      
      <div className="col-span-8 flex flex-col justify-between p-6 bg-brand-border/5">
        
        <div className="flex items-center gap-3 border-b border-brand-border/30 pb-4">
          <div className="w-9 h-9 rounded-full bg-brand-border/30" />
          <div className="space-y-2">
            <div className="h-3.5 w-32 bg-brand-border/20 rounded-full" />
            <div className="h-3 w-16 bg-brand-border/10 rounded-full" />
          </div>
        </div>

        
        <div className="flex-1 py-6 space-y-4">
          <div className="flex gap-2 max-w-sm">
            <div className="w-7 h-7 rounded-full bg-brand-border/30 mt-auto" />
            <div className="p-3 bg-brand-border/20 rounded-2xl rounded-bl-none flex-1 h-12" />
          </div>
          <div className="flex gap-2 max-w-sm ml-auto">
            <div className="p-3 bg-brand-primary/10 rounded-2xl rounded-br-none flex-1 h-16" />
          </div>
          <div className="flex gap-2 max-w-sm">
            <div className="w-7 h-7 rounded-full bg-brand-border/30 mt-auto" />
            <div className="p-3 bg-brand-border/20 rounded-2xl rounded-bl-none flex-1 h-10" />
          </div>
        </div>

        
        <div className="h-12 w-full bg-white border border-brand-border/30 rounded-xl" />
      </div>
    </div>
  );
}


export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      
      <div className="space-y-2 animate-pulse mb-8">
        <div className="h-7 w-48 bg-brand-border/30 rounded-full" />
        <div className="h-3.5 w-64 bg-brand-border/15 rounded-full" />
      </div>

      
      <div className="flex gap-2 border-b border-brand-border/40 pb-1 animate-pulse">
        <div className="h-8 w-24 bg-brand-border/20 rounded-lg" />
        <div className="h-8 w-24 bg-brand-border/10 rounded-lg" />
        <div className="h-8 w-24 bg-brand-border/10 rounded-lg" />
      </div>

      
      <div className="bg-white border border-brand-border/40 rounded-3xl p-6 space-y-6 animate-pulse">
        
        <div className="flex items-center gap-6 pb-4 border-b border-brand-border/10">
          <div className="w-20 h-20 rounded-full bg-brand-border/30" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-36 bg-brand-border/20 rounded-full" />
            <div className="h-3 w-56 bg-brand-border/10 rounded-full" />
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-brand-border/25 rounded-full" />
              <div className="h-10 w-full bg-brand-border/15 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <div className="h-10 w-32 bg-brand-primary/20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}


export function StudioSkeleton() {
  return (
    <div className="space-y-6">
      
      <div className="space-y-2 animate-pulse">
        <div className="h-7 w-52 bg-brand-border/30 rounded-full" />
        <div className="h-3.5 w-72 bg-brand-border/15 rounded-full" />
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-brand-border/40 rounded-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10" />
            <div className="space-y-2">
              <div className="h-4.5 w-3/4 bg-brand-border/25 rounded-full" />
              <div className="h-3 w-5/6 bg-brand-border/15 rounded-full" />
              <div className="h-3 w-2/3 bg-brand-border/10 rounded-full" />
            </div>
            <div className="pt-2">
              <div className="h-9 w-24 bg-brand-border/20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export function BrandProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      
      <div className="w-full h-64 md:h-80 bg-brand-border/20 rounded-3xl relative" />

      
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 px-6 relative z-10">
        <div className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-brand-border/20 rounded-2xl" />
        </div>
        <div className="flex-1 space-y-3 pb-2">
          <div className="h-7 w-56 bg-brand-border/30 rounded-full" />
          <div className="h-4 w-40 bg-brand-border/15 rounded-full" />
        </div>
        <div className="h-10 w-32 bg-brand-primary/20 rounded-xl shrink-0" />
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-brand-border/30 rounded-3xl p-6 space-y-4">
            <div className="h-5 w-36 bg-brand-border/30 rounded-full" />
            <div className="h-3.5 w-full bg-brand-border/15 rounded-full" />
            <div className="h-3.5 w-5/6 bg-brand-border/10 rounded-full" />
          </div>
        </div>

        
        <div className="lg:col-span-4 bg-white border border-brand-border/30 rounded-3xl p-6 space-y-4">
          <div className="h-5 w-24 bg-brand-border/30 rounded-full" />
          <div className="space-y-3">
            <div className="h-3.5 w-full bg-brand-border/15 rounded-full" />
            <div className="h-3.5 w-4/5 bg-brand-border/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
