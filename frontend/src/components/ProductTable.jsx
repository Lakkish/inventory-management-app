// src/components/ProductTable.jsx
import React from "react";

const ProductTable = ({ products }) => {
  return (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.image ? (
                    <img src={product.image} alt={product.name} width="50" />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.unit}</td>
                <td>{product.category}</td>
                <td>{product.brand}</td>
                <td>{product.stock}</td>
                <td>{product.status}</td>
                <td>
                  <button className="edit-btn">Edit</button>
                  <button className="delete-btn">Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
