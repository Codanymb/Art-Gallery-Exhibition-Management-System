const express = require ("express");
const cors = require ("cors");
const bodyparser = require ("body-parser");
const sqlite3 = require ('sqlite3').verbose();
const PORT = 3000;
const app = express ();


const authRoute = require("./routes/authRoute")
const profileRoute = require("./routes/profileRoute")
const userRoute = require("./routes/userRoute")
const productRoute = require ("./routes/productRoute")
const orderRoute = require ("./routes/orderRoute")


app.use(cors());
app.use(bodyparser.json({limit: "200mb"}));
app.use("/api/auth", authRoute);
app.listen(PORT, () => console.log(`App running on port: ${PORT}`)); // start the server
app.get('/test', (req, res) => {
    res.json ({ok : true});
});

// TO CONNECT THE DATABASE
const db = new sqlite3.Database("./Ice.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error while connecting to the database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        db.run("PRAGMA busy_timeout = 6000");
        db.run("PRAGMA journal_mode = WAL"); // Allows reads and writes at the same time
    }
});


app.use("/api/viewProfile", profileRoute);
app.use("/api/updateProfile", profileRoute);
app.use("/api/deleteAccount", userRoute);
app.use("/api/getAllUser", userRoute);
app.use("/api/auth", authRoute);

app.use("/api/AddProducts", productRoute);
app.use("/api/products", productRoute);
app.use("/api/deleteProduct", productRoute);
app.use("/api/getAllProducts", productRoute);
app.use("/api/getEachProduct", productRoute);


app.use("/api/createCart", orderRoute);
app.use("/api/addToCart", orderRoute);
app.use("/api/removeFromCart", orderRoute);
app.use("/api/viewCart", orderRoute);

app.use("/api/getAllOrders", orderRoute);
app.use("/api/UserOrder", orderRoute);
app.use("/api/getEachOrder", orderRoute);

app.use("/api/checkOut", orderRoute);
module.exports = db;