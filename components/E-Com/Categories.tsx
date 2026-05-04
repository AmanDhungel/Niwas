import {
  Building2,
  Home,
  Tent,
  Building,
  Castle,
  Warehouse,
  Hotel,
  Bed,
  PartyPopper,
  Waves,
  WavesLadder,
} from "lucide-react";

const CATS = [
  { label: "Apartments", icon: Building2 },
  { label: "Bungalows", icon: Home },
  { label: "Cabins", icon: Tent },
  { label: "Condos", icon: Building },
  { label: "Villas", icon: Castle },
  { label: "Loft Rooms", icon: Warehouse },
  { label: "Entire Home", icon: Hotel },
  { label: "Private Room", icon: Bed },
  { label: "Events Suitable", icon: PartyPopper },
  { label: "Beachfront", icon: Waves },
  { label: "With Pool", icon: WavesLadder },
];

export default function Categories() {
  return (
    <section className="flex items-center justify-between overflow-x-auto py-8 gap-8 no-scrollbar">
      {CATS.map((item) => (
        <button
          key={item.label}
          className="flex flex-col items-center gap-3 min-w-fit group transition-all">
          <div className="p-3 rounded-full bg-gray-50 group-hover:bg-orange-50 transition-colors">
            <item.icon
              className="w-6 h-6 text-gray-500 group-hover:text-[#ff6b35]"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 group-hover:text-black whitespace-nowrap">
            {item.label}
          </span>
        </button>
      ))}
    </section>
  );
}
