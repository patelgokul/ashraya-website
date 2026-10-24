import Image from "next/image";

export function PresenceMap() {
  return (
    <section className="bg-orange-50/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Image
          src="/images/presence-map.jpg"
          alt="Ashraya presence across India: 27 locations, 18 cities, and 13 states and union territories"
          width={1024}
          height={684}
          className="w-full h-auto rounded-3xl border border-orange-100 shadow-sm"
          priority
        />
      </div>
    </section>
  );
}
