from flask import Flask, jsonify, request
from flask_cors import CORS
from analytics import CinemaAnalytics
from database import CinemaDB

app = Flask(__name__)
CORS(app)

db = CinemaDB()
analytics = CinemaAnalytics()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'customer') # Default to customer if not provided
    
    success, message = db.register(username, password, role)
    
    if success:
        return jsonify({"message": message}), 201
    return jsonify({"error": message}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = db.login(data['username'], data['password'])
    if user:
        user.pop('password') 
        return jsonify({"user": user, "message": "Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/snacks', methods=['GET'])
def get_all_snacks():
    return jsonify(db.get_snacks())

@app.route('/api/inventory/update', methods=['POST'])
def update_stock():
    # React will send JSON: { "id": 1, "price": 5.50, "stock": 100 }
    data = request.json 
    db.update_inventory(data['id'], data['price'], data['stock'])
    return jsonify({"message": "Inventory updated!"})

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    print(f"DEBUG PAYLOAD: {data}")
    
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "Backend received no user_id"}), 400

    success, message = db.place_order(
        user_id, 
        data['hall'], 
        data['seat'], 
        data['cart']
    )
    return jsonify({"success": success, "message": message})

@app.route('/api/rankings', methods=['GET'])
def rankings():
    return jsonify(analytics.get_snack_ranking())

@app.route('/api/conversion', methods=['GET'])
def conversion():
    return jsonify(analytics.get_conversion_stats())

@app.route('/api/occupancy', methods=['GET'])
def occupancy():
    return jsonify(analytics.get_hall_occupancy())

@app.route('/api/orders/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    try:
        history = db.get_user_order_history(user_id)
        
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    return jsonify(db.get_all_orders())

@app.route('/api/admin/orders/status', methods=['POST'])
def update_order_status():
    data = request.json
    db.update_status(data['order_id'], data['status'])
    return jsonify({"success": True})

@app.route('/api/admin/snacks/add', methods=['POST'])
def add_new_snack():
    try:
        data = request.json
        conn = db.get_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO snacks (name, category, price, stock_quantity, image_url) 
            VALUES (%s, %s, %s, %s, %s)
        """
        
        # FIX: Changed data['stock'] to data['stock_quantity'] 
        # to match what your React code is sending.
        cursor.execute(query, (
            data['name'], 
            data['category'], 
            data['price'], 
            data['stock_quantity'], # <--- Updated this line
            data['image_url']
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Snack added successfully"}), 201
        
    except Exception as e:
        print(f"Error adding snack: {e}") 
        return jsonify({"success": False, "error": str(e)}), 500
    try:
        data = request.json
        conn = db.get_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO snacks (name, category, price, stock_quantity, image_url) 
            VALUES (%s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            data['name'], 
            data['category'], # Must be 'Popcorn', 'Drink', 'Snack', or 'Combo'
            data['price'], 
            data['stock'],
            data['image_url']
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Snack added successfully"}), 201
        
    except Exception as e:
        print(f"Error adding snack: {e}") 
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/admin/snacks/delete/<int:id>', methods=['DELETE'])
def remove_snack(id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE snacks SET is_available = FALSE WHERE snack_id = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})
    

# --- ADMIN ORDERS DETAILS ---
@app.route('/api/admin/orders/details/<int:order_id>', methods=['GET'])
def get_admin_order_details(order_id):
    try:
        details = db.get_order_details(order_id)
        return jsonify(details), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/snacks/update/<int:snack_id>', methods=['PATCH', 'OPTIONS'])
def patch_snack(snack_id):
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
        
    data = request.json
    
    name = data.get('name')
    category = data.get('category')
    price = data.get('price')
    stock = data.get('stock_quantity')
    image_url = data.get('image_url')

    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        updates = []
        params = []
        for key, value in data.items():
            updates.append(f"{key} = %s")
            params.append(value)
        
        params.append(snack_id)
        query = f"UPDATE snacks SET {', '.join(updates)} WHERE snack_id = %s"
        
        cursor.execute(query, tuple(params))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Snack patched"}), 200
    except Exception as e:
        print(f"Update Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
