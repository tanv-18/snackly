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
    category ENUM('Popcorn', 'Drink', 'Snack', 'Combo') NOT NULL,
    price DECIMAL(10, 2) NOT NULL, 
    stock_quantity INT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (snack_id) REFERENCES snacks(snack_id)
);














DELIMITER //

CREATE PROCEDURE CreateOrderHeader(
    IN p_user_id INT,
    IN p_hall INT,
    IN p_seat VARCHAR(10),
    OUT p_new_order_id INT
)
BEGIN
    INSERT INTO orders (user_id, hall_number, seat_number, total_price)
    VALUES (p_user_id, p_hall, p_seat, 0);
    SET p_new_order_id = LAST_INSERT_ID();
END //

CREATE PROCEDURE AddItemToOrder(
    IN p_order_id INT,
    IN p_snack_id INT,
    IN p_qty INT
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    SELECT price INTO v_price FROM snacks WHERE snack_id = p_snack_id;
    
    INSERT INTO order_items (order_id, snack_id, quantity, price_at_time)
    VALUES (p_order_id, p_snack_id, p_qty, v_price);
    
    UPDATE orders SET total_price = total_price + (v_price * p_qty)
    WHERE order_id = p_order_id;
    
    UPDATE snacks SET stock_quantity = stock_quantity - p_qty 
    WHERE snack_id = p_snack_id;
END //

-- Module 5: Triggers for Automation
CREATE TABLE inventory_logs (log_id INT AUTO_INCREMENT PRIMARY KEY, msg VARCHAR(255), tstamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TRIGGER low_stock_warning
AFTER UPDATE ON snacks
FOR EACH ROW
BEGIN
    IF NEW.stock_quantity < 5 THEN
        INSERT INTO inventory_logs (msg) VALUES (CONCAT('URGENT: ', NEW.name, ' is nearly out of stock!'));
    END IF;
END //

DELIMITER ;
















-- INSERT INTO users (username, password, role) VALUES 
-- ('admin', 'admin123', 'admin'),
-- ('user', 'user123', 'customer');

INSERT INTO snacks (name, category, price, stock_quantity) VALUES
('Caramel Popcorn', 'Popcorn', 250, 40),
('Pepsi Black', 'Drink', 90, 100),
('Peri Peri Fries', 'Snack', 180, 25),
('Movie Night Combo', 'Combo', 500, 15);
