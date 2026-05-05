"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RefreshCcw, Trash2, ExternalLink, Plus, Package, TrendingUp, Users, MapPin } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
    Pending: "bg-amber-500/20 text-amber-500 border-amber-500/50",
    Preparing: "bg-blue-500/20 text-blue-500 border-blue-500/50",
    "Out for Delivery": "bg-purple-500/20 text-purple-500 border-purple-500/50",
    Delivered: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50",
    Cancelled: "bg-destructive/20 text-destructive border-destructive/50",
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [snacks, setSnacks] = useState<any[]>([]);
    const [snackRanks, setSnackRanks] = useState<any[]>([]);
    const [conversion, setConversion] = useState<any>(null);
    const [hallStats, setHallStats] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    const [modal, setModal] = useState<{
        open: boolean;
        title: string;
        desc: string;
        action: (() => void) | null;
    }>({ open: false, title: "", desc: "", action: null });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSnack, setNewSnack] = useState({
        name: "",
        category: "Snack",
        price: "",
        stock: "",
        image_url: ""
    });

    const loadData = useCallback(async () => {
        setIsSyncing(true);
        try {
            // FIX: Destructure all 5 results from the Promise.all array
            const [ord, snk, ranks, conv, halls] = await Promise.all([
                fetch("http://localhost:5000/api/admin/orders").then(res => res.json()),
                fetch("http://localhost:5000/api/snacks").then(res => res.json()),
                fetch("http://localhost:5000/api/rankings").then(res => res.json()),
                fetch("http://localhost:5000/api/conversion").then(res => res.json()),
                fetch("http://localhost:5000/api/occupancy").then(res => res.json()),
            ]);

            setOrders(ord);
            setSnacks(snk);
            // FIX: Set the missing state values so the cards update
            setSnackRanks(ranks);
            setConversion(conv);
            setHallStats(halls);
        } catch (err) {
            console.error("Data Update Failed:", err);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const patchSnack = async (id: number, payload: object) => {
        // Optimistic update
        setSnacks(prev => prev.map(s => s.snack_id === id ? { ...s, ...payload } : s));

        await fetch(`http://localhost:5000/api/admin/snacks/update/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        loadData(); // Ensure UI is perfectly in sync with DB
    };

    const createSnack = async () => {
        if (!newSnack.name || !newSnack.price || !newSnack.stock) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/snacks/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newSnack.name,
                    category: newSnack.category,
                    price: parseFloat(newSnack.price),
                    stock_quantity: parseInt(newSnack.stock), // Ensure key matches backend (stock_quantity)
                    image_url: newSnack.image_url || "/images/default-snack.png"
                })
            });

            if (response.ok) {
                setIsCreateOpen(false); // Close Modal
                setNewSnack({ name: "", category: "Snack", price: "", stock: "", image_url: "" }); // Reset Form
                loadData(); // Refresh the table list
            } else {
                const errorData = await response.json();
                console.error("Server Error:", errorData.message);
            }
        } catch (err) {
            console.error("Network Error:", err);
        }
    };

    const updateOrderStatus = async (orderId: number, status: string) => {
        await fetch("http://localhost:5000/api/admin/orders/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId, status })
        });
        loadData();
    };

    return (
        <div className="p-6 lg:p-12 space-y-10 min-h-screen bg-background text-foreground">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-primary/5 border-primary/20 p-10 flex flex-col justify-center">
                    <p className="text-sm font-black uppercase text-primary italic mb-2 tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> Conversion Rate</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">
                        {conversion?.total_customers > 0 ? ((conversion.customers_who_ordered / conversion.total_customers) * 100).toFixed(0) : 0}%
                    </h3>
                    <p className="text-lg font-bold uppercase text-muted-foreground mt-2">
                        {conversion?.customers_who_ordered || 0} Orders / {conversion?.total_customers || 0} Customers
                    </p>
                </Card>

                <Card className="bg-card border-primary/10 p-10 border-l-8 border-l-primary">
                    <p className="text-sm font-black uppercase text-primary italic mb-2 tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Market Leader</p>
                    <h3 className="text-2xl font-black italic uppercase leading-none truncate">
                        {snackRanks[0]?.name || "N/A"}
                    </h3>
                    <p className="text-xl font-bold uppercase text-muted-foreground mt-4">
                        Rank #{snackRanks[0]?.sales_rank || 1} — {snackRanks[0]?.total_sold || 0} Units Sold
                    </p>
                </Card>

                <Card className="bg-card border-primary/10 p-10">
                    <p className="text-sm font-black uppercase text-primary italic mb-2 tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4" /> Hot Zone</p>
                    <h3 className="text-2xl font-black italic uppercase">
                        Hall {hallStats[0]?.hall_number || "?"}
                    </h3>
                    <p className="text-xl font-bold uppercase text-emerald-500 mt-2">
                        ₹{hallStats[0]?.revenue?.toLocaleString() || "0"} Revenue
                    </p>
                </Card>
            </div>

            {/* MODALS (Confirmation & Create) ... [Keep existing modal JSX here] */}
            {/* Global Confirmation Modal */}
            <Dialog open={modal.open} onOpenChange={(o) => {
                if (!o) setModal(prev => ({ ...prev, open: false }));
                loadData(); // Revert local UI changes if user cancels
            }}>
                <DialogContent className="bg-card border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Confirm Action</DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            {modal.desc}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-4">
                        <Button variant="outline" onClick={() => {
                            setModal(prev => ({ ...prev, open: false }));
                            loadData();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant={modal.title.includes("Delete") ? "destructive" : "default"}
                            onClick={() => { modal.action?.(); setModal(prev => ({ ...prev, open: false })); }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground uppercase">DASHBOARD</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">auth: {user?.role || "Guest"}</Badge>
                        <span className="text-xs text-muted-foreground font-medium">take a look around..</span>
                    </div>
                </div>
                <Button
                    onClick={loadData}
                    disabled={isSyncing}
                    variant="outline"
                    className="gap-2"
                >
                    <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-10 items-start">

                {/* RECENT ORDERS */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-muted-foreground">Live Updates</span>
                        </div>
                    </div>

                    <ScrollArea className="h-[650px] rounded-lg border bg-card/50 p-4 shadow-sm">
                        <div className="space-y-4">
                            {orders.map((o) => (
                                <Card key={o.order_id} className="bg-card border-border overflow-hidden shadow-sm">
                                    <div className={`h-1.5 w-full ${STATUS_COLORS[o.order_status]?.split(' ')[0] || 'bg-primary'}`} />
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Order ID</p>
                                                <span className="text-2xl font-bold">#{o.order_id}</span>
                                            </div>
                                            <Link href={`/admin/orders/${o.order_id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p>
                                                <p className="text-xs font-semibold">Hall {o.hall_number} / Seat {o.seat_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Customer</p>
                                                <p className="text-xs font-semibold truncate">{o.username}</p>
                                            </div>
                                        </div>

                                        <Select
                                            defaultValue={o.order_status}
                                            onValueChange={(v) => setModal({
                                                open: true,
                                                title: "Update Order Status",
                                                desc: `Update order #${o.order_id} status to ${v}?`,
                                                action: () => updateOrderStatus(o.order_id, v)
                                            })}
                                        >
                                            <SelectTrigger className={`h-8 text-xs font-bold ${STATUS_COLORS[o.order_status]}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(STATUS_COLORS).map(s => (
                                                    <SelectItem key={s} value={s} className="text-xs font-semibold">{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </section>

                {/* INVENTORY MANAGEMENT */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold text-foreground">Inventory Details</h2>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            size="sm"
                            className="gap-2 text-xs font-bold"
                        >
                            <Plus className="w-4 h-4" /> Add Snack
                        </Button>
                    </div>

                    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    {/* Added w-full to stretch the name column */}
                                    <TableHead className="w-full text-xs font-bold uppercase text-foreground">Snack Details</TableHead>
                                    <TableHead className="w-[180px] text-xs font-bold uppercase text-foreground">Category</TableHead>
                                    <TableHead className="w-[120px] text-xs font-bold uppercase text-foreground text-center">Price</TableHead>
                                    <TableHead className="w-[120px] text-xs font-bold uppercase text-foreground text-center">Stock</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {snacks.map((s) => (
                                    <TableRow key={s.snack_id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-3">
                                            <Input
                                                defaultValue={s.name}
                                                className="h-7 w-full text-sm font-semibold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:text-primary"
                                                onBlur={(e) => {
                                                    if (e.target.value !== s.name) {
                                                        setModal({
                                                            open: true,
                                                            title: "Rename Item",
                                                            desc: `Change name of "${s.name}" to "${e.target.value}"?`,
                                                            action: () => patchSnack(s.snack_id, { name: e.target.value })
                                                        });
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ID: {s.snack_id}</span>
                                                <Input
                                                    placeholder="[link to image..]"
                                                    defaultValue={s.image_url}
                                                    className="h-3 text-[10px] text-muted-foreground/60 bg-transparent border-none p-0 focus-visible:ring-0 w-full"
                                                    onBlur={(e) => {
                                                        if (e.target.value !== s.image_url) {
                                                            setModal({
                                                                open: true,
                                                                title: "Update Image Path",
                                                                desc: `Update image path for "${s.name}"?`,
                                                                action: () => patchSnack(s.snack_id, { image_url: e.target.value })
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                onValueChange={(v) => setModal({
                                                    open: true,
                                                    title: "Change Category",
                                                    desc: `Update category for "${s.name}" to ${v}?`,
                                                    action: () => patchSnack(s.snack_id, { category: v })
                                                })}
                                                defaultValue={s.category}
                                            >
                                                {/* Changed w-fit to w-full to fill the 180px column */}
                                                <SelectTrigger className="h-7 text-xs font-medium border-none bg-transparent p-0 focus:ring-0 w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["Popcorn", "Drink", "Snack", "Combo"].map(c => (
                                                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-0.5">
                                                <span className="text-xs font-semibold">₹</span>
                                                <Input
                                                    type="number"
                                                    defaultValue={s.price}
                                                    className="w-20 h-7 text-sm font-semibold bg-transparent border-none p-0 focus-visible:ring-0 text-center"
                                                    onBlur={(e) => {
                                                        const newVal = parseFloat(e.target.value);
                                                        if (newVal !== s.price) {
                                                            setModal({
                                                                open: true,
                                                                title: "Update Price",
                                                                desc: `Update price for "${s.name}" to ₹${newVal}?`,
                                                                action: () => patchSnack(s.snack_id, { price: newVal })
                                                            });
                                                        }
                                                    }} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <Input
                                                    type="number"
                                                    defaultValue={s.stock_quantity}
                                                    className={`w-20 h-7 text-sm font-bold bg-transparent border-none p-0 focus-visible:ring-0 text-center ${s.stock_quantity < 15 ? 'text-destructive animate-pulse' : ''}`}
                                                    onBlur={(e) => {
                                                        const newVal = parseInt(e.target.value);
                                                        if (newVal !== s.stock_quantity) {
                                                            setModal({
                                                                open: true,
                                                                title: "Update Inventory",
                                                                desc: `Set stock for "${s.name}" to ${newVal}?`,
                                                                action: () => patchSnack(s.snack_id, { stock_quantity: newVal })
                                                            });
                                                        }
                                                    }}
                                                />
                                                {s.stock_quantity < 15 && <span className="text-[8px] font-bold text-destructive uppercase">Low Stock</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-transparent transition-opacity"
                                                onClick={() => setModal({
                                                    open: true,
                                                    title: "Delete Item",
                                                    desc: `Are you sure you want to delete "${s.name}" from the menu?`,
                                                    action: async () => {
                                                        await fetch(`http://localhost:5000/api/admin/snacks/delete/${s.snack_id}`, { method: "DELETE" });
                                                        loadData();
                                                    }
                                                })}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>
            {/* ADD SNACK DIALOG */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                            <Package className="w-5 h-5 text-primary" /> Add New Item
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground">
                            Create a new entry in the theater snack inventory.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Name Input */}
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Item Name</label>
                            <Input
                                value={newSnack.name}
                                onChange={e => setNewSnack({ ...newSnack, name: e.target.value })}
                                placeholder="e.g., Caramel Popcorn"
                                className="h-10 font-semibold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Price Input */}
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Price (₹)</label>
                                <Input
                                    type="number"
                                    value={newSnack.price}
                                    onChange={e => setNewSnack({ ...newSnack, price: e.target.value })}
                                    placeholder="0"
                                    className="h-10 font-bold"
                                />
                            </div>
                            {/* Stock Input */}
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Initial Stock</label>
                                <Input
                                    type="number"
                                    value={newSnack.stock}
                                    onChange={e => setNewSnack({ ...newSnack, stock: e.target.value })}
                                    placeholder="50"
                                    className="h-10 font-bold"
                                />
                            </div>
                        </div>

                        {/* Category Select */}
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Category</label>
                            <Select
                                onValueChange={v => setNewSnack({ ...newSnack, category: v })}
                                defaultValue={newSnack.category}
                            >
                                <SelectTrigger className="h-10 font-semibold">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["Popcorn", "Drink", "Snack", "Combo"].map(c => (
                                        <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Image Path */}
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Image URL / Path</label>
                            <Input
                                value={newSnack.image_url}
                                onChange={e => setNewSnack({ ...newSnack, image_url: e.target.value })}
                                placeholder="/images/popcorn.png"
                                className="h-10 text-xs font-mono"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-xs font-bold uppercase">Cancel</Button>
                        <Button
                            onClick={createSnack}
                            className="bg-primary text-primary-foreground font-black uppercase tracking-tighter px-8"
                        >
                            Save to Inventory
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}