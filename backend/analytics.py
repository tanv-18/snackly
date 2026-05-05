import mysql.connector

class CinemaAnalytics:
    def __init__(self):
        self.config = {
            'host': 'localhost',
            'user': 'snackly',
            'password': 'get-food',
            'database': 'cinema_snack_system'
        }

    def get_connection(self):
        return mysql.connector.connect(**self.config)

    # --- Advanced Querying: CTEs and Window Functions (Module 2) ---
    def get_snack_ranking(self):
        """Ranks snacks by popularity using Window Functions."""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            WITH SnackSales AS (
                SELECT s.name, COALESCE(SUM(oi.quantity), 0) as total_sold
                FROM snacks s
                LEFT JOIN order_items oi ON s.snack_id = oi.snack_id
                GROUP BY s.snack_id, s.name
            )
            SELECT name, total_sold,
                RANK() OVER (ORDER BY total_sold DESC) as sales_rank
            FROM SnackSales;
        """
        cursor.execute(query)
        res = cursor.fetchall()
        cursor.close()
        conn.close()
        return res

    # --- Conversion Funnel Analysis (Module 12) ---
    def get_conversion_stats(self):
        """Calculates basic conversion: Total Users vs Users who Ordered."""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role='customer') as total_customers,
                (SELECT COUNT(DISTINCT user_id) FROM orders) as customers_who_ordered
        """
        cursor.execute(query)
        res = cursor.fetchone()
        cursor.close()
        conn.close()
        return res

    # --- Traffic Analysis (Module 12) ---
    def get_hall_occupancy(self):
        """Analyzes which halls are generating the most orders."""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT hall_number, COUNT(order_id) as order_count, SUM(total_price) as revenue
            FROM orders
            GROUP BY hall_number
            ORDER BY revenue DESC;
        """
        cursor.execute(query)
        res = cursor.fetchall()
        cursor.close()
        conn.close()
        return res
