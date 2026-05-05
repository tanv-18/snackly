"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  name: string;
  quantity: number;
  price_at_time: number;
  subtotal: number;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/orders/details/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error("Detail Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchOrderDetails();
  }, [params.id, fetchOrderDetails]);

  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  if (loading) return <div className="p-12 animate-pulse text-primary font-black italic">ACCESSING ENCRYPTED DATA...</div>;

  return (
    <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary gap-2 text-[10px] font-black uppercase italic"
          >
            <ArrowLeft className="w-3 h-3" /> Return to Terminal
          </Button>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">Manifest <span className="text-primary">#{params.id}</span></h1>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="font-black italic uppercase text-[10px] border-primary/20" onClick={() => window.print()}>
            <Printer className="w-3 h-3 mr-2" /> Print Receipt
          </Button>
          <Button className="font-black italic uppercase text-[10px] bg-primary text-black hover:bg-primary/90">
            <PackageCheck className="w-3 h-3 mr-2" /> Mark Processed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ITEM LIST */}
        <Card className="lg:col-span-2 bg-card/30 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary">Consumables List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-primary/10">
                  <TableHead className="text-[10px] font-black uppercase italic">Item Description</TableHead>
                  <TableHead className="text-[10px] font-black uppercase italic text-center">Qty</TableHead>
                  <TableHead className="text-[10px] font-black uppercase italic text-right">Unit</TableHead>
                  <TableHead className="text-[10px] font-black uppercase italic text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="border-primary/5">
                    <TableCell className="font-bold uppercase text-xs">{item.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs">x{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-xs">₹{Number(item.price_at_time).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-black text-primary text-xs">₹{Number(item.subtotal).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SUMMARY SIDEBAR */}
        <div className="space-y-6">
          <Card className="bg-primary text-black border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <PackageCheck className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase italic mb-1 opacity-70">Total Payable</p>
              <h2 className="text-4xl font-black italic tracking-tighter">₹{total.toFixed(2)}</h2>
              <div className="mt-4 pt-4 border-t border-black/10">
<Badge 
    variant="outline" 
    className="bg-emerald-500/20 border-emerald-600/50 text-emerald-950 font-black uppercase italic text-[9px]"
  >                  Status: Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-primary/10">
            <CardContent className="p-6 space-y-4">
              <div>
                <h4 className="text-[9px] font-black uppercase text-muted-foreground mb-1">Fulfillment Logic</h4>
                <p className="text-[11px] font-bold uppercase leading-relaxed">
                  Ensure all items are sealed and temperature-checked before dispatching to the hall.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}