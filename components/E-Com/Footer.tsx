import { Mail, Phone, MapPin } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Footer() {
  return (
    <footer className="bg-gray-50 pt-20 pb-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-[#051e3a]">
            Niwas RentChain — The smarter way to rent
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            We combine powerful technology with exceptional service to create a
            seamless rental journey. Built for modern living. Designed for you.
          </p>
        </div>

        <div className="space-y-6">
          <h4 className="font-bold text-sm">Change Your Currency</h4>
          <Select defaultValue="eur">
            <SelectTrigger className="w-24 bg-white">
              <SelectValue placeholder="€" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eur">€ EUR</SelectItem>
              <SelectItem value="usd">$ USD</SelectItem>
              <SelectItem value="usd">NPR</SelectItem>
            </SelectContent>
          </Select>
          {/* <div className="grid grid-cols-5 gap-2 w-fit">
            {[Facebook, Instagram, Twitter, Youtube, Mail].map((Icon, i) => (
              <div
                key={i}
                className="p-2 bg-gray-200 rounded-full cursor-pointer hover:bg-[#ff6b35] hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div> */}
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm">Contact</h4>
          <div className="space-y-3 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> R. Nova de São Pedro 11, Funchal
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> (305) 555-489
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> email@yourdomain.com
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm">Featured Listings</h4>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex gap-4 items-center group cursor-pointer">
              <img
                src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg"
                className="w-16 h-12 rounded-md object-cover"
                alt="thumb"
              />
              <div>
                <p className="text-xs font-bold group-hover:text-[#ff6b35]">
                  Demetriou Paradisos Sea View
                </p>
                <p className="text-[10px] text-gray-400">€ 23/night</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 mt-20 pt-8 border-t flex flex-col md:flex-row justify-between text-[10px] text-gray-400">
        <p>Copyright @2026 Gurukul Hub</p>
        <div className="flex gap-4">
          <span>Terms and Conditions</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}
