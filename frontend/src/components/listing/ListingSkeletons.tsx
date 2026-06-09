import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for a single listing card in list/grid view
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden flex flex-col justify-between h-96">
      {/* Thumbnail image placeholder */}
      <div className="relative h-48 bg-gray-100 animate-pulse">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Price tag placeholder */}
        <div className="absolute top-3 right-3 w-24 h-7 bg-white/95 rounded-full px-3 py-1 flex items-center justify-center">
          <Skeleton className="w-16 h-4" />
        </div>
      </div>

      {/* Details placeholder */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Title */}
          <Skeleton className="w-5/6 h-6 rounded-lg" />
          <Skeleton className="w-2/3 h-4 rounded-lg" />
          
          {/* Address */}
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-3/4 h-3.5 rounded-lg" />
          </div>
        </div>

        {/* Footer info placeholder */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-150">
          <div className="flex items-center gap-2">
            <Skeleton className="w-12 h-4 rounded-lg" />
            <Skeleton className="w-1.5 h-1.5 rounded-full" />
            <Skeleton className="w-16 h-4 rounded-lg" />
          </div>
          <Skeleton className="w-10 h-4 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for the entire listing detail page
export function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 w-48 h-5">
          <Skeleton className="w-16 h-full rounded" />
          <Skeleton className="w-3 h-full rounded" />
          <Skeleton className="w-24 h-full rounded" />
        </div>

        {/* Title and location header skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2.5 w-full md:w-2/3">
              <Skeleton className="w-11/12 h-8 rounded-xl" />
              <Skeleton className="w-1/2 h-5 rounded-lg" />
            </div>
            <div className="w-28 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>

        {/* Gallery grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px] md:h-[450px]">
          <div className="md:col-span-2 h-full bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-sm">
            <Skeleton className="w-full h-full rounded-none" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <div className="flex-1 bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-sm">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="flex-1 bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-sm">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
          </div>
        </div>

        {/* Main Content & Sidebar grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Highlights (area, room type, pricing) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm grid grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <Skeleton className="w-8 h-8 mx-auto rounded-full" />
                <Skeleton className="w-12 h-4 mx-auto rounded" />
              </div>
              <div className="text-center space-y-2 border-x border-gray-100">
                <Skeleton className="w-8 h-8 mx-auto rounded-full" />
                <Skeleton className="w-14 h-4 mx-auto rounded" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="w-8 h-8 mx-auto rounded-full" />
                <Skeleton className="w-10 h-4 mx-auto rounded" />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
              <Skeleton className="w-32 h-6 rounded-lg" />
              <div className="space-y-2.5">
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-11/12 h-4 rounded" />
                <Skeleton className="w-4/5 h-4 rounded" />
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
              <Skeleton className="w-40 h-6 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-md" />
                    <Skeleton className="w-16 h-4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            
            {/* Landlord profile block */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-24 h-4 rounded" />
                  <Skeleton className="w-16 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Skeleton for comments / reviews
export function ReviewSkeleton() {
  return (
    <div className="border-b border-gray-100 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-16 h-3.5 rounded" />
          </div>
          <Skeleton className="w-20 h-3 rounded" />
        </div>
      </div>
      <div className="space-y-1.5 pl-13">
        <Skeleton className="w-full h-4 rounded" />
        <Skeleton className="w-5/6 h-4 rounded" />
      </div>
    </div>
  );
}
