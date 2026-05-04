// components/property/MortgageCalculator.tsx
import { Slider } from "@/components/ui/slider";

export const MortgageCalculator = () => (
  <section className="py-16 border-t">
    <h3 className="text-2xl font-bold text-orange-600 mb-10">
      Mortgage Calculator
    </h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
      <div className="space-y-8">
        <div>
          <label className="block font-bold mb-4">Home Price</label>
          <input
            className="w-full p-4 bg-slate-50 border-none rounded-lg text-lg font-bold"
            defaultValue="$825,000"
          />
          <Slider
            defaultValue={[825000]}
            max={1000000}
            step={1000}
            className="mt-4"
          />
        </div>
        <div>
          <label className="block font-bold mb-4">Interest Rate (%)</label>
          <input
            className="w-full p-4 bg-slate-50 border-none rounded-lg"
            defaultValue="3.5%"
          />
          <Slider defaultValue={[3.5]} max={10} step={0.1} className="mt-4" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center border-l pl-20">
        <div className="relative w-64 h-64 border-[16px] border-orange-500 rounded-full flex flex-col items-center justify-center">
          <div className="text-4xl font-bold">$3,459.16</div>
          <div className="text-slate-400">per month</div>
        </div>
        <div className="mt-8 space-y-2 text-center">
          <p className="font-bold">30 Years Fixed, 3.5% Interest</p>
          <p className="text-slate-500">
            Principal and Interest: $1,245,296.45
          </p>
        </div>
      </div>
    </div>
  </section>
);
