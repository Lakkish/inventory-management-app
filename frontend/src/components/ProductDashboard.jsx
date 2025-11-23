// src/components/ProductDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductTable from "./ProductTable";

// Base URL for our backend API
const API_URL = "http://localhost:3000/api/products";

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]); // To store unique categories for dropdown

  // Function to fetch products based on search/filter criteria
  const fetchProducts = async (searchQuery = "", categoryQuery = "") => {
    setLoading(true);
    try {
      // Build the query parameters
      let url = API_URL;
      const params = {};
      if (searchQuery) params.name = searchQuery;

      // Note: Backend doesn't support category filtering yet, this is frontend filtering for now
      // We will enhance this when backend API is updated in later phases if necessary.

      const response = await axios.get(url, { params });

      // Perform frontend category filtering here
      let filteredData = response.data;
      if (categoryQuery) {
        filteredData = response.data.filter(
          (p) => p.category === categoryQuery
        );
      }

      setProducts(filteredData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Effect to extract unique categories once products are loaded
  useEffect(() => {
    const uniqueCategories = [
      ...new Set(products.map((item) => item.category)),
    ];
    setCategories(["All", ...uniqueCategories]);
  }, [products]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    // Call API with search query (backend supports name search)
    fetchProducts(query, categoryFilter);
  };

  const handleCategoryChange = (e) => {
    const query = e.target.value;
    setCategoryFilter(query === "All" ? "" : query);
    // Re-fetch/filter data
    fetchProducts(searchTerm, query === "All" ? "" : query);
  };

  return (
    <div className="dashboard-container">
      <div className="header-controls">
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="category-filter"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat === "All" ? "" : cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="action-buttons">
          <button className="import-btn">Import (CSV)</button>
          <button className="export-btn">Export (CSV)</button>
          <button className="add-btn">Add New Product</button>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
};

export default ProductDashboard;
