const express = require("express");
const cors = require("cors");
const db = require("./db/database");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// Use product routes
app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
