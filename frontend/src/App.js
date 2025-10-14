import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Registro from './pages/Registro';
import Confirmacion from './pages/Confirmacion';

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<Registro />} />
          <Route path="/confirmar" element={<Confirmacion />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
