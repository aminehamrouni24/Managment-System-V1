 const mongoose = require("mongoose");

 const fournisseurSchema = new mongoose.Schema(
   {
     name: {
       type: String,
       required: true,
       trim: true,
     },
     contact: {
       type: Number, // 📞 numeric contact
       required: true,
     },

     produitsFournis: [
       {
         product: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Product",
           required: true,
         },
         quantite: {
           type: Number,
           required: true,
           min: 1,
         },
         prixAchat: {
           type: Number,
           required: true,
           min: 0,
         },
         montantTotal: {
           type: Number,
           required: true,
           min: 0,
         },
         montantPaye: {
           type: Number,
           required: true,
           min: 0,
           default: 0,
         },
         resteAPayer: {
           type: Number,
           required: true,
           min: 0,
         },
         status: {
           type: String,
           enum: ["paid", "pending"],
           default: "pending",
         },
         dateFourniture: {
           type: Date,
           default: Date.now,
         },
       },
     ],
   },
   { timestamps: true }
 );

 // 🧮 Automatically compute total & remaining amounts before saving
 fournisseurSchema.pre("save", function (next) {
   this.produitsFournis.forEach((item) => {
     item.montantTotal = item.prixAchat * item.quantite;
     item.resteAPayer = item.montantTotal - item.montantPaye;
     item.status = item.resteAPayer <= 0 ? "paid" : "pending";
   });
   next();
 });

 module.exports = mongoose.model("Fournisseur", fournisseurSchema);
