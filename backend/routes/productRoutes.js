const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db/database");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });
// Add to your server.js or routes
const fs = require("fs");
const path = require("path");

// Backup database (call before redeploying)
app.get("/api/backup", (req, res) => {
  const dbPath = path.join("/tmp", "inventory.db");

  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory-backup.db"'
    );
    res.send(data);
  } else {
    res.status(404).json({ error: "Database file not found" });
  }
});

// Restore database (POST backup file)
app.post("/api/restore", (req, res) => {
  if (!req.files || !req.files.backup) {
    return res.status(400).json({ error: "No backup file provided" });
  }

  const backupFile = req.files.backup;
  const dbPath = path.join("/tmp", "inventory.db");

  fs.writeFileSync(dbPath, backupFile.data);
  res.json({ message: "Database restored successfully" });
});

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
// --- POST /api/products/import (CSV Import API) ---
// Use multer middleware to handle a single file upload named 'csvFile'
router.post("/import", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const results = [];
  const duplicates = [];
  let addedCount = 0;
  const filePath = req.file.path;

  // Use fs.createReadStream and csv-parser to process the file
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        results.forEach((product, index) => {
          // Check for duplicate name (case-insensitive)
          db.get(
            "SELECT id FROM products WHERE name = ? COLLATE NOCASE",
            [product.name],
            (err, row) => {
              if (err) {
                console.error(
                  `Error checking duplicate for ${product.name}: ${err.message}`
                );
                return;
              }

              if (row) {
                duplicates.push({ name: product.name, existingId: row.id });
              } else {
                // No duplicate, insert the new product
                const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                const params = [
                  product.name,
                  product.unit,
                  product.category,
                  product.brand,
                  product.stock || 0,
                  product.status,
                  product.image || null,
                ];

                db.run(sql, params, (insertErr) => {
                  if (insertErr) {
                    console.error(
                      `Error inserting ${product.name}: ${insertErr.message}`
                    );
                  } else {
                    addedCount++;
                  }
                });
              }

              // Check if this is the last iteration
              if (index === results.length - 1) {
                db.run("COMMIT", (commitErr) => {
                  fs.unlinkSync(filePath);
                  if (commitErr) {
                    return res.status(500).json({
                      message: "Transaction failed",
                      error: commitErr.message,
                    });
                  }
                  res.status(200).json({
                    message: "CSV import processed.",
                    added: addedCount,
                    skipped: duplicates.length, // Skipped count is known immediately
                    duplicates: duplicates,
                  });
                });
              }
            }
          );
        });

        // Handling the case where the CSV was empty
        if (results.length === 0) {
          db.run("COMMIT");
          fs.unlinkSync(filePath);
          res.status(200).json({
            message: "CSV file was empty.",
            added: 0,
            skipped: 0,
            duplicates: [],
          });
        }
      });
    });
});
router.get("/export", (req, res) => {
  const sql =
    "SELECT name, unit, category, brand, stock, status, image, created_at, updated_at FROM products";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "No products to export." });
    }

    const headers = Object.keys(rows[0]).join(",") + "\n";
    const csvData = rows.map((row) => Object.values(row).join(",")).join("\n");
    const fullCsv = headers + csvData;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="products.csv"');
    res.status(200).send(fullCsv);
  });
});
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

  // Manual check for uniqueness for an existing product (excluding its own ID)
  db.get(
    "SELECT id, stock AS old_stock FROM products WHERE name = ? COLLATE NOCASE AND id != ?",
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

      // Now fetch the *original* stock value before the update
      db.get(
        "SELECT stock AS old_stock FROM products WHERE id = ?",
        [id],
        (err, product) => {
          if (err || !product) {
            return res
              .status(404)
              .json({ message: "Product not found before update check." });
          }

          const oldStock = product.old_stock;
          const newStock = stock;
          const stockChanged = oldStock !== newStock;

          // Use db.serialize() to run multiple commands sequentially and ensure the log happens after the update
          db.serialize(() => {
            // 1. Run the UPDATE query
            const updateSql = `
          UPDATE products
          SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
            const updateParams = [
              name,
              unit,
              category,
              brand,
              stock,
              status,
              image,
              id,
            ];

            db.run(updateSql, updateParams, function (updateErr) {
              if (updateErr) {
                return res.status(500).json({ error: updateErr.message });
              }
              if (this.changes === 0) {
                return res.status(404).json({
                  message: "Product not found or data was identical.",
                });
              }

              // 2. If stock changed, insert into logs table
              if (stockChanged) {
                const logSql = `
              INSERT INTO inventory_logs (product_id, old_stock, new_stock, changed_by)
              VALUES (?, ?, ?, ?)
            `;

                const logParams = [id, oldStock, newStock, "admin"];

                db.run(logSql, logParams, (logErr) => {
                  if (logErr) {
                    console.error(
                      "Failed to insert inventory log:",
                      logErr.message
                    );
                  }
                  console.log(
                    `Logged stock change for product ${id}: ${oldStock} -> ${newStock}`
                  );
                });
              }

              // 3. Send final response after both operations are queued
              res.json({
                id: id,
                ...req.body,
                message: "Product updated successfully, logs tracked.",
              });
            });
          });
        }
      );
    }
  );
});

router.get("/:id/history", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM inventory_logs 
    WHERE product_id = ? 
    ORDER BY timestamp DESC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No inventory history found for this product ID." });
    }
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({
      message: "Product deleted successfully.",
      changes: this.changes,
    });
  });
});
module.exports = router;
