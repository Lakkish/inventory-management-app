import React from "react";
import { Container } from "react-bootstrap";
import ProductDashboard from "./components/ProductDashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="bg-light border-bottom py-3 mb-4">
        <Container>
          <div className="text-center">
            <h1 className="h2 mb-0 text-primary fw-bold">
              Product Inventory Management
            </h1>
            <p className="text-muted mb-0 mt-1">
              Manage your product inventory efficiently
            </p>
          </div>
        </Container>
      </header>
      <main>
        <Container fluid>
          <ProductDashboard />
        </Container>
      </main>
    </div>
  );
}

export default App;
