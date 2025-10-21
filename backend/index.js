const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

// GLOBAL VARIABLES
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
// imports
const adminAuthRoutes = require('./routes/auth.routes')
const adminUsersCrud = require('./routes/admin.routes')
const adminProduct = require("./routes/product.routes");
const fournisseurRoutes = require('./routes/fournisseur.routes')
const statsRoutes = require('./routes/stats.routes')
const clientRoutes = require('./routes/client.routes')
const bonRoutes = require("./routes/bonlivraison.routes");
//  middlewares
// Allow all origins (for development)
app.use(cors());
app.use(express.json());
app.use(express.static("frontend/dist"));

//  routes
app.use('/api/auth', adminAuthRoutes)
app.use("/api", adminUsersCrud);
app.use('/api/product' , adminProduct)
app.use('/api/fournisseur', fournisseurRoutes)
app.use("/api/stats", statsRoutes);
app.use('/api/client' , clientRoutes)
app.use("/api/bonlivraison", bonRoutes);

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
