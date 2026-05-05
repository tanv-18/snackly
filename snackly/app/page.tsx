import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100-64px)] py-20 text-center space-y-8">
      <div className="space-y-2">
        <h1 className="text-8xl font-black italic tracking-tighter text-primary">
          CRAVE. CLICK. EAT.
        </h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-sm">
          The ultimate cinema snack experience
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg" className="font-black italic text-xl px-10 h-16 shadow-2xl">
          <Link href="/login">ORDER NOW</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="font-black italic text-xl px-10 h-16">
          <Link href="/register">JOIN THE CLUB</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-10 pt-20 max-w-4xl">
        <div className="space-y-2">
          <h3 className="font-black italic text-2xl">01. FAST</h3>
          <p className="text-xs text-muted-foreground uppercase font-bold">Delivery to your seat in under 10 mins.</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-black italic text-2xl">02. FRESH</h3>
          <p className="text-xs text-muted-foreground uppercase font-bold">Popcorn popped specifically for your order.</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-black italic text-2xl">03. EASY</h3>
          <p className="text-xs text-muted-foreground uppercase font-bold">Pay once, eat forever (almost).</p>
        </div>
      </div>
    </div>
  );
}