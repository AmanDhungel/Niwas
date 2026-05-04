import {
  Headphones,
  DollarSign,
  Info,
  Users,
  PlusCircle,
  ShieldCheck,
  Map,
  Tag,
  Gamepad2,
  UserPlus,
  CircleDollarSign,
} from "lucide-react";

export const FEATURES = [
  {
    icon: Headphones,
    title: "24/7 Support hours for customers",
    desc: "We offer you 24/7 support to manage your listing or your holiday planning starting now.",
  },
  {
    icon: CircleDollarSign,
    title: "The most affordable rentals platform",
    desc: "You will find the most affordable rentals prices for houses in Madeira on our platform.",
  },
  {
    icon: Info,
    title: "Transparent booking process",
    desc: "You will find the most affordable rentals prices for houses in Madeira on our platform.",
  },
  {
    icon: Users,
    title: "We work directly with the locals",
    desc: "You will find listings from local home owners who are ready to welcome you in their homes.",
  },
  {
    icon: UserPlus,
    title: "Register for free and add your listing",
    desc: "Add your listing on our platform and publish it without paying any fee to us while the listing is live.",
  },
  {
    icon: ShieldCheck,
    title: "Safe rental process guaranteed",
    desc: "Madeira Rentals makes it easy and quick to rent properties in your favorite holiday place.",
  },
  {
    icon: Gamepad2, // Representing "Fun Activities"
    title: "We know the fun activities",
    desc: "Madeira Rentals makes it easy and quick to rent properties in your favorite holiday place.",
  },
  {
    icon: Tag,
    title: "Rent by price per night or price per guest",
    desc: "Rent places by paying a fee for each night booked, or for each guest who checks-in.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold mb-10">
        Why choose our rentals website to book a holiday home
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
        {FEATURES.map((f, i) => (
          <div key={i} className="space-y-3">
            <f.icon className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
            <h4 className="font-bold text-sm uppercase tracking-tight">
              {f.title}
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
