const express = require("express");
const cors = require("cors");
const db = require("./db/database");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Use product routes
app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
