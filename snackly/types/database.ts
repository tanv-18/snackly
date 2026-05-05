export interface User {
    user_id: number;
    username: string;
    role: 'customer' | 'admin';
    created_at: string; // in sql it's TIMESTAMP
}

export interface Snack {
    snack_id: number;
    name: string;
    category: 'Popcorn' | 'Drink' | 'Candy' | 'Combo';
    price: number;
    stock_quantity: number;
    is_available: boolean;
    image_url: string;
}

export interface Order {
    order_id: number;
    user_id: number;
    hall_number: number;
    seat_number: string;
    total_price: number;
    order_status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

}

export interface OrderItem {
    item_id: number;
    order_id: number;
    snack_id: number;
    quantity: number;
    price_at_time: number;
}

export interface InventoryLog {
    log_id: number;
    msg: string;
    tstamp: string;
}

export interface SnackRanking {
    name: string;
    total_sold: number;
    sales_rank: number;
}