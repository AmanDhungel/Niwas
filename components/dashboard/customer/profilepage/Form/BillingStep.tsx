import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

const history = [
  {
    id: "INV-001",
    status: "Paid",
    type: "Short-term rental booking",
    date: "2025-01-15",
    amount: 750,
  },
  {
    id: "INV-002",
    status: "Paid",
    type: "Property inspection service",
    date: "2025-01-25",
    amount: 150,
  },
  {
    id: "INV-003",
    status: "Pending",
    type: "Monthly rent - February",
    date: "2025-02-01",
    amount: 3200,
  },
];

export default function BillingForm() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing History</h3>
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-xl">
              <div className="flex gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1e293b]">{item.id}</span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Paid"
                          ? "bg-emerald-50 text-emerald-600 border-none"
                          : "bg-amber-50 text-amber-600 border-none"
                      }>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                  <p className="text-xs text-slate-400">{item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-bold text-lg">${item.amount}</span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing Address</h3>
        <div className="p-6 border rounded-xl bg-slate-50/50">
          <p className="font-bold text-slate-900">Guest User</p>
          <p className="text-slate-500 text-sm mt-1">
            123 Main Street
            <br />
            New York, NY 10001
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            Update Address
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-orange-500 hover:bg-orange-600 px-8">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
