require("dotenv").config();

const express = require("express");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());


app.use(productRoutes);
app.use(authRoutes);

app.get("/", (req, res) => {
    res.send("CartScale API is running");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});