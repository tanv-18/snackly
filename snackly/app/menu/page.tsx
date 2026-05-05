"use client";

import { useEffect, useState } from "react";
import { Snack } from "@/types/database";
import { useAuth } from "@/app/context/AuthContext"; // Ensure path is correct

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CartItem extends Snack {
  qty: number;
}

export default function Home() {
  const { user } = useAuth(); // <--- DYNAMIC USER DATA
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hall, setHall] = useState<string>("");
  const [seat, setSeat] = useState<string>("");
  const [isOrdering, setIsOrdering] = useState(false);

  const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    fetch("http://localhost:5000/api/snacks")
      .then((res) => res.json())
      .then((data) => setSnacks(data));
  }, []);

  const addToCart = (snack: Snack) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.snack_id === snack.snack_id);
      if (existing) {
        return prevCart.map((item) =>
          item.snack_id === snack.snack_id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...snack, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePlaceOrder = async () => {
    // Check for hall, seat, items AND a valid user ID
    if (!hall || !seat || cart.length === 0 || !user?.user_id) {
      alert("Please ensure you are logged in and have selected a seat.");
      return;
    }
    
    setIsOrdering(true);

    try {
      const formattedCart = cart.map(item => ({
        id: item.snack_id,
        qty: item.qty
      }));

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id, // <--- NO MORE HARDCODED 2!
          hall: parseInt(hall),
          seat: seat,
          cart: formattedCart,
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Success! ${result.message}`);
        setCart([]);
        setHall("");
        setSeat("");

        // refreshing snacks to show updated quantity
        const res = await fetch("http://localhost:5000/api/snacks");
        const data = await res.json();
        setSnacks(data);
      } else {
        alert(`Order failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Error placing order: ", err);
      alert("Could not connect to server.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-12 min-h-screen bg-background">

      {/* LEFT SIDE: THE MENU */}
      <div className="flex-1">
        <header className="mb-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-primary tracking-tighter italic">what are we feeling like today?</h1>
              <p className="text-muted-foreground mt-2">Logged in as: <span className="text-primary font-bold">{user?.username}</span></p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {snacks.map((snack) => (
            <Card key={snack.snack_id} className="overflow-hidden border-border/50 shadow-md">
              <CardHeader className="p-0 overflow-hidden bg-muted/20">
                <img
                  src={snack.image_url || "/placeholder-snack.png"}
                  alt={snack.name}
                  className="w-full h-72 object-contain p-4 transition-transform hover:scale-105"
                />
              </CardHeader>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
                    {snack.category}
                  </Badge>
                  {snack.stock_quantity < 10 && snack.stock_quantity > 0 && (
                    <span className="text-destructive text-[10px] font-black animate-pulse">LOW STOCK</span>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{snack.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-3xl font-black text-foreground">₹{snack.price}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full font-bold"
                  disabled={snack.stock_quantity === 0}
                  onClick={() => addToCart(snack)}
                >
                  {snack.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: THE CART (STICKY) */}
      <div className="w-full lg:w-[400px] flex-shrink-0">
        <Card className="sticky top-8 border-primary/20 shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tighter uppercase">Your Order</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <ScrollArea className="h-[300px] pr-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground italic text-sm">
                  Your cart is empty...
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.snack_id} className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">Qty: {item.qty}</span>
                      </div>
                      <span className="font-mono font-bold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Hall</Label>
                  <Input
                    type="number"
                    placeholder="00"
                    value={hall}
                    onChange={(e) => setHall(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Seat</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={(val) => setSeat(val + seat.replace(/^[A-Z]/, ""))}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder="Row" />
                      </SelectTrigger>
                      <SelectContent>
                        {rows.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="1"
                      className="flex-1"
                      onChange={(e) => setSeat((seat.charAt(0) || "A") + e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4">
                <span className="text-muted-foreground uppercase text-xs font-bold">Total Amount</span>
                <span className="text-4xl font-black text-primary tracking-tighter">₹{total}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              size="lg"
              className="w-full text-lg font-black italic tracking-tight"
              disabled={!hall || !seat || cart.length === 0 || isOrdering}
              onClick={handlePlaceOrder}
            >
              {isOrdering ? "Processing..." : "CONFIRM ORDER"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}