"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; // Import your auth hook
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Order {
    order_id: number;
    user_id: number;
    hall_number: number;
    seat_number: string;
    total_price: number;
    order_status: string;
    created_at: string;
}

export default function MyOrders() {
    // 2. Tell useState this is an array of Orders: <Order[]>
    const [orders, setOrders] = useState<Order[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.user_id) return;

        const fetchOrders = () => {
            fetch(`http://localhost:5000/api/orders/history/${user.user_id}`)
                .then((res) => res.json())
                .then((data) => {
                    // 3. Cast the data or ensure it's the right type
                    if (Array.isArray(data)) {
                        setOrders(data as Order[]);
                    }
                });
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [user?.user_id]);

    // Helper to color-code the status
    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s.includes("delivered")) return "bg-green-500";
        if (s.includes("preparing") || s.includes("pending")) return "bg-orange-500 animate-pulse";
        if (s.includes("out") || s.includes("delivery")) return "bg-blue-500 animate-bounce";
        if (s.includes("cancelled")) return "bg-destructive";
        return "bg-secondary";
    };

    // If the user state hasn't loaded yet
    if (!user) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <p className="text-muted-foreground animate-pulse">Synchronizing secure access...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-mono">
            <header className="mb-10">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary">
                    Order History
                </h1>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                    Records for: {user.username} (UID: {user.user_id})
                </p>
            </header>

            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/20">
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground italic text-sm">
                                    No deployments found. Visit the menu to initialize an order.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        orders.map((order: any) => (
                            <Card key={order.order_id} className="border-primary/10 shadow-lg hover:border-primary/30 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between py-4">
                                    <div>
                                        <CardTitle className="text-xs text-muted-foreground uppercase font-black">
                                            ID_REF: #{order.order_id}
                                        </CardTitle>
                                        <p className="text-[10px] opacity-70">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusColor(order.order_status)} text-white border-none text-[10px] font-black uppercase italic`}>
                                        {order.order_status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center pb-4">
                                    <div className="text-xs font-bold uppercase tracking-tight">
                                        Location: Hall {order.hall_number} <span className="text-primary mx-1">|</span> Unit {order.seat_number}
                                    </div>
                                    <div className="text-2xl font-black italic tracking-tighter text-foreground">
                                        ₹{order.total_price}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}