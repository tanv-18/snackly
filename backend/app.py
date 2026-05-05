import streamlit as st
from database import CinemaDB
from analytics import CinemaAnalytics

# Initialize our backend classes
db = CinemaDB()
analytics = CinemaAnalytics()

st.set_page_config(page_title="Smart Cinema Snacks", layout="wide")

# 1. Login Logic
if 'user' not in st.session_state:
    st.session_state.user = None

if st.session_state.user is None:
    st.title("Cinema Login")
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")
    
    if st.button("Login"):
        user = db.login(username, password)
        if user:
            st.session_state.user = user
            st.rerun()
        else:
            st.error("Invalid Username or Password")
else:
    # 2. Navigation Sidebar
    user_role = st.session_state.user['role']
    st.sidebar.title(f"Welcome, {st.session_state.user['username']}")
    
    if user_role == 'admin':
        page = st.sidebar.radio("Navigate", ["Kitchen Dashboard", "Inventory Management", "Advanced Analytics"])
    else:
        page = st.sidebar.radio("Navigate", ["Order Snacks", "My History"])
    
    if st.sidebar.button("Logout"):
        st.session_state.user = None
        st.rerun()

    # --- ADMIN PAGES ---
    if page == "Kitchen Dashboard":
        st.title("Kitchen Dashboard")
        orders = db.get_all_orders()
        for o in orders:
            # Using Expander to show Order Details (Items)
            with st.expander(f"Order #{o['order_id']} - Seat {o['seat_number']} (Hall {o['hall_number']}) - Status: {o['order_status']}"):
                # Fetch snack items for this specific order
                items = db.get_order_details(o['order_id'])
                st.table(items)
                
                c1, c2 = st.columns([2, 1])
                new_status = c1.selectbox("Update Status", 
                                        ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], 
                                        index=['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].index(o['order_status']),
                                        key=f"status_{o['order_id']}")
                
                if c2.button("Update", key=f"btn_{o['order_id']}"):
                    db.update_status(o['order_id'], new_status)
                    st.success(f"Order #{o['order_id']} updated!")
                    st.rerun()

    elif page == "Inventory Management":
        st.title("Inventory Management")
        # admin_view=True shows even unavailable snacks
        st.subheader("Smart Inventory Alerts (From SQL Trigger)")
        alerts = db.get_inventory_alerts()
        if alerts:
            for a in alerts:
                st.warning(f"{a['tstamp']}: {a['msg']}")
        else:
            st.success("All stock levels are healthy!")
        snacks = db.get_snacks() 
        for s in snacks:
            with st.container(border=True):
                col1, col2, col3, col4 = st.columns([2, 1, 1, 1])
                col1.write(f"**{s['name']}** ({s['category']})")
                new_p = col2.number_input("Price (INR)", value=int(s['price']), key=f"p_{s['snack_id']}")
                new_s = col3.number_input("Stock", value=int(s['stock_quantity']), key=f"s_{s['snack_id']}")
                
                if col4.button("Update Item", key=f"upd_{s['snack_id']}"):
                    db.update_inventory(s['snack_id'], new_p, new_s)
                    st.success(f"Updated {s['name']}!")
                    st.rerun()

    elif page == "Advanced Analytics":
        st.title("Smart Business Insights")
        try:
            st.subheader("Top Selling Snacks (Window Function Rank)")
            rankings = analytics.get_snack_ranking()
            st.table(rankings)
            
            st.subheader("Customer Conversion")
            conv = analytics.get_conversion_stats()
            c1, c2 = st.columns(2)
            c1.metric("Total Customers", conv['total_customers'])
            c2.metric("Customers who Ordered", conv['customers_who_ordered'])
        except Exception as e:
            st.error(f"Analytics Error: Check your database password in analytics.py. \nDetail: {e}")

    # --- CUSTOMER PAGES ---
    elif page == "Order Snacks":
        st.title("Select Your Snacks")
        snacks = db.get_snacks()
        
        col1, col2 = st.columns(2)
        hall = col1.number_input("Hall No", min_value=1, value=1)
        seat = col2.text_input("Seat No (e.g., A10)")
        
        cart = []
        for s in snacks:
            qty = st.number_input(f"{s['name']} (₹{s['price']}) - Stock: {s['stock_quantity']}", 
                                 min_value=0, max_value=s['stock_quantity'], key=s['snack_id'])
            if qty > 0:
                cart.append({'id': s['snack_id'], 'name': s['name'], 'qty': qty, 'price': s['price']})
        
        if st.button("Confirm Order"):
            if not seat or not cart:
                st.error("Please provide seat number and select items.")
            else:
                success, msg = db.place_order(st.session_state.user['user_id'], hall, seat, cart)
                if success:
                    st.success(f"Order #{msg} placed! Enjoy the movie!")
                else:
                    st.error(f"Failed to place order: {msg}")

    elif page == "My History":
        st.title("Your Order History")
        # Fetch only orders belonging to this user
        history = db.get_all_orders() # Ideally update database.py to have a get_user_orders(user_id)
        user_id = st.session_state.user['user_id']
        
        my_orders = [o for o in history if o['user_id'] == user_id]
        
        if not my_orders:
            st.info("No past orders found.")
        else:
            for o in my_orders:
                with st.expander(f"Order #{o['order_id']} - {o['order_status']} - Total: ₹{o['total_price']}"):
                    items = db.get_order_details(o['order_id'])
                    st.table(items)
                    st.write(f"Ordered on: {o['created_at']}")