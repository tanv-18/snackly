USE cinema_snack_system

INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('user', 'user123', 'customer');

INSERT INTO snacks (name, category, price, stock_quantity) VALUES
('Caramel Popcorn', 'Popcorn', 250, 40),
('Pepsi Black', 'Drink', 90, 100),
('Peri Peri Fries', 'Candy', 180, 25),
('Movie Night Combo', 'Combo', 500, 15);