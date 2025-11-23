import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { Search, Plus, Upload, Download, Filter } from "lucide-react";
import ProductTable from "./ProductTable";

const API_URL = "http://localhost:3000/api/products";

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  const fetchProducts = async (searchQuery = "", categoryQuery = "") => {
    setLoading(true);
    setError("");
    try {
      let url = API_URL;
      const params = {};
      if (searchQuery) params.name = searchQuery;

      const response = await axios.get(url, { params });

      let filteredData = response.data;
      if (categoryQuery) {
        filteredData = response.data.filter(
          (p) => p.category === categoryQuery
        );
      }

      setProducts(filteredData);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_URL}/${productId}`);
        fetchProducts(searchTerm, categoryFilter);
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete product.");
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const uniqueCategories = [
      ...new Set(products.map((item) => item.category)),
    ];
    setCategories(["All Categories", ...uniqueCategories]);
  }, [products]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    fetchProducts(query, categoryFilter);
  };

  const handleCategoryChange = (e) => {
    const query = e.target.value;
    setCategoryFilter(query === "All Categories" ? "" : query);
    fetchProducts(searchTerm, query === "All Categories" ? "" : query);
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 5).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  return (
    <div className="dashboard-container">
      {/* Statistics Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary fs-2 fw-bold">{totalProducts}</div>
              <div className="text-muted">Total Products</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning fs-2 fw-bold">
                {lowStockProducts}
              </div>
              <div className="text-muted">Low Stock</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-danger fs-2 fw-bold">
                {outOfStockProducts}
              </div>
              <div className="text-muted">Out of Stock</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success fs-2 fw-bold">
                {categories.length - 1}
              </div>
              <div className="text-muted">Categories</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="search-section">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="fw-semibold">Search Products</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Label className="fw-semibold">
                Filter by Category
              </Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={18} />
                </InputGroup.Text>
                <Form.Select
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat === "All Categories" ? "" : cat}
                    >
                      {cat}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>

            <Col md={5} className="text-end">
              <div className="d-flex gap-2 justify-content-end flex-wrap">
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center gap-1"
                >
                  <Upload size={16} />
                  Import CSV
                </Button>
                <Button
                  variant="outline-success"
                  className="d-flex align-items-center gap-1"
                >
                  <Download size={16} />
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-1"
                >
                  <Plus size={16} />
                  Add New Product
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-semibold">Product Inventory</h5>
            <Badge bg="light" text="dark" className="fs-6">
              {products.length} items
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="loading-spinner mb-3"></div>
              <p className="text-muted">Loading products...</p>
            </div>
          ) : (
            <ProductTable
              products={products}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProductDashboard;
