import React, { useState } from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { Edit2, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import StatusBadge from "./StatusBadge";

const ProductTable = ({ products, onDeleteProduct }) => {
  const [imageErrors, setImageErrors] = useState({});

  const getStockVariant = (stock) => {
    if (stock === 0) return "danger";
    if (stock <= 5) return "warning";
    return "success";
  };

  const handleImageError = (productId) => {
    setImageErrors((prev) => ({
      ...prev,
      [productId]: true,
    }));
  };

  const getProductInitial = (productName) => {
    return productName ? productName.charAt(0).toUpperCase() : "?";
  };

  const getPlaceholderColor = (productId) => {
    const colors = [
      "primary",
      "secondary",
      "success",
      "danger",
      "warning",
      "info",
      "dark",
    ];
    const colorIndex = productId ? productId % colors.length : 0;
    return colors[colorIndex];
  };

  return (
    <div className="table-responsive" style={{ maxHeight: "600px" }}>
      <Table hover className="mb-0">
        <thead className="bg-light">
          <tr>
            <th className="text-center" style={{ width: "80px" }}>
              Image
            </th>
            <th>Product Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th className="text-center">Stock</th>
            <th className="text-center">Status</th>
            <th className="text-center" style={{ width: "150px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id} className="align-middle">
                <td className="text-center">
                  {product.image && !imageErrors[product.id] ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      onError={() => handleImageError(product.id)}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`product-image bg-${getPlaceholderColor(
                        product.id
                      )} bg-opacity-10 text-${getPlaceholderColor(
                        product.id
                      )} d-flex align-items-center justify-content-center rounded border`}
                    >
                      {product.image ? (
                        <ImageIcon size={20} />
                      ) : (
                        <span className="fw-bold fs-5">
                          {getProductInitial(product.name)}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div>
                    <div className="fw-semibold">{product.name}</div>
                    {product.sku && (
                      <small className="text-muted">SKU: {product.sku}</small>
                    )}
                  </div>
                </td>
                <td>
                  <Badge
                    bg="outline-secondary"
                    text="dark"
                    className="fw-normal"
                  >
                    {product.unit}
                  </Badge>
                </td>
                <td>
                  <span className="badge bg-info bg-opacity-10 text-info">
                    {product.category}
                  </span>
                </td>
                <td>
                  {product.brand && (
                    <span className="fw-medium">{product.brand}</span>
                  )}
                </td>
                <td className="text-center">
                  <Badge
                    bg={getStockVariant(product.stock)}
                    className={`stock-${getStockVariant(product.stock)}`}
                  >
                    {product.stock}
                  </Badge>
                </td>
                <td className="text-center">
                  <StatusBadge status={product.status} stock={product.stock} />
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="d-flex align-items-center"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="d-flex align-items-center"
                      title="Edit Product"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="d-flex align-items-center"
                      onClick={() => onDeleteProduct(product.id)}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-4">
                <div className="text-muted">
                  <h5>No products found</h5>
                  <p className="mb-0">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default ProductTable;
