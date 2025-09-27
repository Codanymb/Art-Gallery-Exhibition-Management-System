const { db } = require("../database/db")

const createCart = (req, res) => {
    const user_id = req.user.id;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const cart_query = "SELECT * FROM Cart WHERE user_id = ?";

    db.get(cart_query, [user_id], (err, existingCart) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (existingCart) {
            return res.status(200).json({ message: "Cart already exists", cart_id: existingCart.cart_id });
        }

        const status = "1";
        const add_query = "INSERT INTO Cart (user_id, status) VALUES (?, ?)";

        db.run(add_query, [user_id, status], function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to create cart", details: err.message });
            }

            res.status(201).json({ message: "Cart created", cart_id: this.lastID });
        });
    });
};

const addToCart = (req, res) => {
    const user_id = req.user.id;
    const {product_id, quantity} = req.body;

    if(!user_id || !product_id || quantity <=0){
        return res.status(400).json({Error: "There is an error"})
    }

    const checkCartQuery = "SELECT cart_id FROM Cart WHERE user_id = ? AND Status =1";
    db.get(checkCartQuery, [ user_id], (err, cart) => {

         if(err){
        return res.status(500).json({Error: "Error with the database or server", details: err.message})
    };

    if(!cart){
        return res.status(404).json({error: "No cart exist"})
    }

    const checkProductQuery = "SELECT  *  FROM cartItems WHERE product_id =? AND cart_id = ?" ;
    db.get(checkProductQuery, [product_id,cart.cart_id], (err,item) =>{
        if(err){
            return res.status(500).json({Error: "Error with the datbase or server", details: err.message});

        }
        if(item){
            const quant = Number( item.quantity) +Number(quantity);

            const updateQuery = "UPDATE cartItems SET quantity =?  WHERE item_id=?";

             db.run(updateQuery, [quant, item.item_id], function (err) {
                    if (err) return res.status(500).json({ error: "Update failed", details: err.message });
                    res.json({ message: "Item quantity updated well", item_id: item.item_id });
                });
        }else{
            const insertQuery = "INSERT INTO CartItems (cart_id, product_id, quantity) VALUES (?, ?, ?)";
            db.run(insertQuery, [cart.cart_id, product_id, quantity], function (err) {
                    if (err) return res.status(500).json({ error: "Insert failed", details: err.message });
                    res.status(201).json({ message: "Item added to cart", item_id: this.lastID });
                });

                    
        };

    } );
        
    });
   
};

const removeFromCart = (req,res) => {
    const {product_id} = req.body;
    const user_id = req.user.id;

    
        if(!product_id){
            return res.status(400).json({Error: "No product"})
        }

    const checkQuery = "SELECT cart_id FROM Cart WHERE user_id =? AND status = 1";//Get the active cart
    db.get(checkQuery, [ user_id], (err, cart) =>
        {
            if(err){
                return res.status(500).json({err: "database error", Message: err.message});
            }
            
            if(!cart){
                return res.status(404).json({error: "Cart not found"});
            }

            
            const checkProductQuery = "SELECT * FROM cartItems WHERE cart_id =? AND product_id =? "
            db.get(checkProductQuery, [cart.cart_id, product_id], (err, product) =>{
                if(err){
                    return res.status(500).json({error: "Database error", details: err.message})
                }
                if(!product){
                    return res.status(404).json({Error: "No product found"});
                }
                
                  const deleteQuery = "DELETE FROM cartItems WHERE product_id= ? ";
        db.run(deleteQuery, [product.product_id], function(err){
            if(err){
                return res.status(500).json({error: "Database error", details: err.message})
            }
            return res.status(200).json({message: "Successfully deleted the product", product_id: product.product_id})
        });
            })

          

    });
};

const viewCart = (req, res) =>{
    const user_id = req.user.id
    
    const checkCartQuery = "SELECT cart_id FROM cart WHERE user_id =? AND Status=1";
    db.get(checkCartQuery, [user_id], (err, cart) =>{

         if(err){
                return res.status(500).json({error: "Something wrong wwith db", details: err.message});
            }

        if(!cart){
            return res.status(404).json({error: "no carts found"})
        }

        //I want to retrieve these specific columns from the two tables
        //Join each row in CartItems with the matching row in Products, where their product_id values are the same
        const itemsQuery = " SELECT  ci.item_id, ci.quantity, c.product_id, c.product_name, c.product_description FROM CartItems ci JOIN Products c ON ci.product_id = c.product_id WHERE ci.cart_id = ? ";

        db.all(itemsQuery, [ cart.cart_id], (err, items) => {
            if(err){
                return res.status(500).json({Error: "Something wrong with db", details: err.message});
            }
            return res.status(200).json({
                cart_id: cart.cart_id,
                items:items
            });
              });
           
    });

};

const checkOut = (req, res) => {
    const user_id = req.user.id;
    const { delivery_address, is_pickup } = req.body;

    // Get active cart for user
    const cartQuery = "SELECT cart_id FROM cart WHERE user_id = ? AND Status = 1";
    db.get(cartQuery, [user_id], (err, cart) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (!cart) {
            return res.status(404).json({ error: "Add items to the cart first!" });
        }

        const cart_id = cart.cart_id;

        // Get items in cart + stock level
        const itemQuery = `
            SELECT ci.product_id, ci.quantity AS requested_quantity, c.stock_level 
            FROM CartItems ci 
            JOIN Products c ON ci.product_id = c.product_id 
            WHERE ci.cart_id = ?`;

        db.all(itemQuery, [cart_id], (err, items) => {
            if (err) {
                return res.status(500).json({ error: "Failed to get items", details: err.message });
            }

            // Check stock availability
            for (let item of items) {
                if (item.requested_quantity > item.stock_level) {
                    return res.status(400).json({
                        error: `Not enough stock for product ${item.product_id}`,
                        requested: item.requested_quantity,
                        available: item.stock_level
                    });
                }
            }

            // Deduct stock
            let stockUpdateErrors = [];
            items.forEach(item => {
                const newStock = item.stock_level - item.requested_quantity;
                const updateStock = "UPDATE Products SET stock_level = ? WHERE product_id = ?";
                db.run(updateStock, [newStock, item.product_id], (err) => {
                    if (err) stockUpdateErrors.push({ product_id: item.product_id, error: err.message });
                });
            });

            let isPickupValue;
            if(is_pickup === "Yes"){
                isPickupValue ="Yes";
            }

            if (is_pickup === "No"){
                isPickupValue = "No";
            }


            let finalAddress = is_pickup === "Yes" ? "N/A" : delivery_address;
            
            

            // Insert order
            const orderQuery = "INSERT INTO Orders (id, delivery_address, is_pickup) VALUES (?, ?, ?)";
            db.run(orderQuery, [user_id, finalAddress, isPickupValue], function (err) {
                if (err) {
                    return res.status(500).json({ error: "Insert error", details: err.message });
                }

                // Close the cart
                const updateStatus = "UPDATE cart SET status = 0 WHERE cart_id = ?";
                db.run(updateStatus, [cart_id], (err) => {
                    if (err) {
                        return res.status(500).json({ error: "Failed to close cart", details: err.message });
                    }

                    return res.status(200).json({
                        message: "Order placed and stock updated successfully",
                        order_id: this.lastID
                    });
                });
            });
        });
    });
};

const getAllOrders = (req, res)=> {
    const getQuey = "SELECT * FROM Orders";
    db.all (getQuey, [], (err, rows) => {
        if(err){
            return res.status(500).json({err: "Failed to get products"})
        }
        return res.status(200).json({orders: rows})
    })
}

const UserOrder = (req, res) => {
    const user_id = req.user.id;

    const orderQuery = "SELECT * FROM Orders WHERE id=?";
    db.all(orderQuery, [user_id], (err,order)=>{

        if(err){
            return res.status(500).json({error: "e1", details: err.message})
        }

        if(!order){
            return res.json({"message": "No order"})
        }

        return res.json({"My order": order})
    })
}

const  getEachOrder = (req, res) => {
    const order_id = req.params.order_id;


    const getQuery = "SELECT * FROM Orders WHERE order_id = ?";
    db.get(getQuery, [order_id], (err, order) => {
        if(err){
            return res.status(500).json({details: err.message})
        }

        if(!order){
            return res.status(404).json({"Error": "There is no order with this ID"})
        }
    return res.json({"Order": order});

    })
}



//  process.on('SIGINT', () => {
//     db.close((err) => {
//         if (err) {
//             console.error('Error closing database:', err.message);
//         }
//         console.log('Database connection closed.');
//         process.exit(0);
//     });
// });

module.exports = {
    createCart,addToCart,removeFromCart,viewCart, checkOut, getAllOrders,UserOrder,getEachOrder
}