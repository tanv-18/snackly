DELIMITER //

USE cinema_snack_system

-- Module 5: Transaction Management & Error Handling
CREATE PROCEDURE PlaceOrderSingleItem(
    IN p_user_id INT,
    IN p_hall INT,
    IN p_seat VARCHAR(10),
    IN p_snack_id INT,
    IN p_qty INT
)
BEGIN
    DECLARE v_price INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
        -- Fetch current price
        SELECT price INTO v_price FROM snacks WHERE snack_id = p_snack_id;
        
        -- Create Order
        INSERT INTO orders (user_id, hall_number, seat_number, total_price)
        VALUES (p_user_id, p_hall, p_seat, (v_price * p_qty));
        
        SET @last_order = LAST_INSERT_ID();
        
        -- Create Line Item
        INSERT INTO order_items (order_id, snack_id, quantity, price_at_time)
        VALUES (@last_order, p_snack_id, p_qty, v_price);
        
        -- Update Inventory
        UPDATE snacks SET stock_quantity = stock_quantity - p_qty 
        WHERE snack_id = p_snack_id;
    COMMIT;
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