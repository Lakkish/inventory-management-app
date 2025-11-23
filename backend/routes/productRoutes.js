const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db/database");
const router = express.Router();

// --- Shared Base Validation Rules (Reusable) ---
const baseProductValidationRules = [
  body("name").notEmpty().withMessage("Name is required"),
  body("unit").notEmpty().withMessage("Unit is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("brand").notEmpty().withMessage("Brand is required"),
  body("status").notEmpty().withMessage("Status is required"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

// --- GET /api/products (and search) ---
router.get("/", (req, res) => {
  const { name } = req.query;
  let sql = "SELECT * FROM products";
  const params = [];

  if (name) {
    sql += " WHERE name LIKE ? COLLATE NOCASE";
    params.push(`%${name}%`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// --- POST /api/products (Create New Product) ---
router.post("/", baseProductValidationRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit, category, brand, stock, status, image } = req.body;

  // Manual check for uniqueness for a NEW product (id should not exist)
  db.get(
    "SELECT id FROM products WHERE name = ? COLLATE NOCASE",
    [name],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        return res
          .status(409)
          .json({ message: "A product with this name already exists." });
      }

      const sql = `
      INSERT INTO products (name, unit, category, brand, stock, status, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
      const params = [name, unit, category, brand, stock, status, image];

      db.run(sql, params, function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: insertErr.message });
        }
        res.status(201).json({
          message: "Product created successfully",
          productId: this.lastID,
          data: req.body,
        });
      });
    }
  );
});

// --- PUT /api/products/:id (Update Product with Validation) ---
router.put("/:id", baseProductValidationRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, unit, category, brand, stock, status, image } = req.body;
  // Manual check for uniqueness for an EXISTING product (exclude current id)
  db.get(
    "SELECT id FROM products WHERE name = ? COLLATE NOCASE AND id != ?",
    [name, id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        return res
          .status(409)
          .json({ message: "Product name must be unique." });
      }

      const sql = `
      UPDATE products
      SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
      const params = [name, unit, category, brand, stock, status, image, id];

      db.run(sql, params, function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: "Product not found." });
        }
        res.json({
          id: id,
          ...req.body,
          message: "Product updated successfully.",
        });
      });
    }
  );
});

module.exports = router;
