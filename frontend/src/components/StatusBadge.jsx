import React from "react";
import { Badge } from "react-bootstrap";

const StatusBadge = ({ status, stock }) => {
  let variant = "secondary";
  let displayStatus = status;

  if (stock <= 0 || status === "Inactive" || status === "Out of Stock") {
    variant = "danger";
    displayStatus = "Out of Stock";
  } else if (stock > 0 || status === "Active" || status === "In Stock") {
    variant = "success";
    displayStatus = "In Stock";
  } else if (stock <= 10) {
    variant = "warning";
    displayStatus = "Low Stock";
  }

  return (
    <Badge bg={variant} className="status-badge">
      {displayStatus}
    </Badge>
  );
};

export default StatusBadge;
