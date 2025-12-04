// db.js - Updated for Render compatibility
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Use /tmp directory which is writable on Render
// WARNING: Files in /tmp disappear on service restart!
const dbPath =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", "inventory.db") // Render uses /tmp
    : "./inventory.db"; // Local development

console.log(`Using database at: ${dbPath}`);

// Ensure directory exists
if (process.env.NODE_ENV === "production") {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
    createTables();
  }
});

function createTables() {
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      status TEXT NOT NULL,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(createProductsTable, (err) => {
    if (err) {
      console.error("Error creating products table:", err.message);
    } else {
      console.log("Products table ensured.");
      createInventoryLogsTable();
    }
  });
}

function createInventoryLogsTable() {
  const createLogsTable = `
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      old_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      changed_by TEXT NOT NULL DEFAULT 'admin',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;

  db.run(createLogsTable, (err) => {
    if (err) {
      console.error("Error creating inventory_logs table:", err.message);
    } else {
      console.log("Inventory logs table ensured.");
    }
  });
}

module.exports = db;
