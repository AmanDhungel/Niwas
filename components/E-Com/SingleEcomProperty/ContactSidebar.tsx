// components/property/ContactSidebar.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const ContactSidebar = () => {
  return (
    <div className="space-y-8 sticky top-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border space-y-6">
        <h3 className="text-xl font-bold text-orange-600">Schedule A Tour</h3>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Select Date" type="date" />
            <Input placeholder="10:00 am" type="time" />
          </div>
          <div className="flex p-1 bg-slate-100 rounded-md">
            <Button className="flex-1 bg-orange-600 shadow-none hover:bg-orange-700 h-9">
              In Person
            </Button>
            <Button variant="ghost" className="flex-1 h-9">
              Video Chat
            </Button>
          </div>
          <Input placeholder="Your Name" />
          <Input placeholder="Your Phone" />
          <Input placeholder="Your Email" />
          <Textarea placeholder="Message" className="h-32" />
          <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg">
            Schedule
          </Button>
        </form>
      </div>

      <div className="bg-orange-600 text-white p-8 rounded-xl relative overflow-hidden">
        <h4 className="text-2xl font-bold mb-2">
          Discover your dream property
        </h4>
        <p className="text-orange-100 mb-4">
          Book a personalized tour to explore the exquisite beauty.
        </p>
        <img
          src="/property-mini.jpg"
          className="w-full rounded-lg mt-4"
          alt="Mini"
        />
      </div>
    </div>
  );
};
