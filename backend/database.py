import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash

class CinemaDB:
    def __init__(self):
        self.config = {
            'host': 'localhost',
            'user': 'snackly',
            'password': 'get-food', 
            'database': 'cinema_snack_system'
        }

    def get_connection(self):
        return mysql.connector.connect(**self.config)

    # --- Authentication Fix ---
    def login(self, username, password):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        # Search only by username
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        # Check the hash instead of a string match
        if user and check_password_hash(user['password'], password):
            return user
        return None

    def register(self, username, password, role='customer'):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            # Hash before saving
            hashed_pw = generate_password_hash(password)
            query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(query, (username, hashed_pw, role))
            conn.commit()
            return True, "User created successfully"
        except mysql.connector.Error as err:
            if err.errno == 1062: # Duplicate entry error code
                return False, "Username already exists"
            return False, str(err)
        finally:
            cursor.close()
            conn.close()

    # --- Snack Management ---
    def get_snacks(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM snacks WHERE is_available = TRUE")
        res = cursor.fetchall()
        cursor.close()
        conn.close()
        return res

    def update_inventory(self, snack_id, new_price, new_stock):
        conn = self.get_connection()
        cursor = conn.cursor()
        # This update will automatically fire the 'low_stock_warning' TRIGGER in MySQL
        cursor.execute("UPDATE snacks SET price = %s, stock_quantity = %s WHERE snack_id = %s", 
                       (new_price, new_stock, snack_id))
        conn.commit()
        cursor.close()
        conn.close()

    def place_order(self, user_id, hall, seat, cart):
            conn = self.get_connection()
            cursor = conn.cursor(buffered=True) 
            try:
                u_id = int(user_id)
                h_num = int(hall)

                args = [u_id, h_num, seat, 0]
                result_args = cursor.callproc('CreateOrderHeader', args)
                
                order_id = result_args[3]

                if not order_id or order_id == 0:
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    order_id = cursor.fetchone()[0]

                for item in cart:
                    snack_id = int(item.get('id') or item.get('snack_id'))
                    qty = int(item.get('qty') or item.get('quantity'))
                    cursor.callproc('AddItemToOrder', (order_id, snack_id, qty))
                
                conn.commit()
                return True, f"Order #{order_id} placed successfully!"
            except Error as e:
                conn.rollback()
                print(f"Database Error: {e}") 
                return False, str(e)
            finally:
                cursor.close()
                conn.close()



    # --- Admin Order Views ---
    def get_all_orders(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT o.*, u.username FROM orders o 
                          JOIN users u ON o.user_id = u.user_id 
                          ORDER BY o.created_at DESC""")
        res = cursor.fetchall()
        cursor.close()
        conn.close()
        return res

    def update_status(self, order_id, status):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET order_status = %s WHERE order_id = %s", (status, order_id))
        conn.commit()
        cursor.close()
        conn.close()

    def get_order_details(self, order_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT s.name, oi.quantity, oi.price_at_time, (oi.quantity * oi.price_at_time) as subtotal
            FROM order_items oi
            JOIN snacks s ON oi.snack_id = s.snack_id
            WHERE oi.order_id = %s
        """
        cursor.execute(query, (order_id,))
        items = cursor.fetchall()
        cursor.close()
        conn.close()
        return items

    def get_user_order_history(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC"
        cursor.execute(query, (user_id,))
        history = cursor.fetchall()
        cursor.close()
        conn.close()
        return history


    def update_snack_full(self, snack_id, name, category, price, stock, image_url):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE snacks 
            SET name = %s, category = %s, price = %s, stock_quantity = %s, image_url = %s 
            WHERE snack_id = %s
        """
        cursor.execute(query, (name, category, price, stock, image_url, snack_id))
        conn.commit()
        cursor.close()
        conn.close()
