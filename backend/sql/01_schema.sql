CREATE DATABASE IF NOT EXISTS cinema_snack_system;
USE cinema_snack_system;

-- Module 3: Keys and Constraints
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snacks (
    snack_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Popcorn', 'Drink', 'Candy', 'Combo') NOT NULL,
    price INT NOT NULL, 
    stock_quantity INT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    hall_number INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    total_price INT NOT NULL,
    order_status ENUM('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Module 3: Normalization (Linking table)
CREATE TABLE order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    snack_id INT,
    quantity INT NOT NULL,
    price_at_time INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (snack_id) REFERENCES snacks(snack_id)
);