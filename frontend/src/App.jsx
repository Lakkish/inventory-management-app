import React from "react";
import ProductDashboard from "./components/ProductDashboard";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Inventory Management</h1>
      </header>
      <main>
        <ProductDashboard />
      </main>
    </div>
  );
}

export default App;
