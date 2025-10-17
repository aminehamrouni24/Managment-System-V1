const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

// GLOBAL VARIABLES
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
// imports
const adminAuthRoutes = require('./routes/auth.routes')
const adminUsersCrud = require('./routes/admin.routes')
const adminProduct = require("./routes/product.routes");
//  middlewares
app.use(express.json());

//  routes
app.use('/api/auth', adminAuthRoutes)
app.use("/api", adminUsersCrud);
app.use('/api/product' , adminProduct)

// DATABASE

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

// SERVER
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
