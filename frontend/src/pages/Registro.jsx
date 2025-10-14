import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import logo from "../assets/logo.png"; // ✅ asegúrate de tener este archivo

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    email: '',
    cargo: '',
    entidad: ''
  });
  const [qr, setQr] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setQr(null);

    try {
      const { data } = await axios.post(`${API_URL}/inscripcion`, form);

      // ✅ Mostrar mensaje y QR devuelto (nuevo o existente)
      setQr(data.qrCode);
      setMensaje(data.mensaje || 'Inscripción registrada exitosamente');

    } catch (error) {
      if (error.response?.status === 409) {
        // 409 = ya está registrada
        setMensaje(error.response.data.error);
      } else {
        console.error(error);
        setMensaje('❌ Error al registrar la inscripción. Intenta de nuevo.');
      }
    }
  };

  const handleDescargar = () => {
    if (!qr) return;
    const link = document.createElement('a');
    const nombreArchivo = `qr_${form.nombre.replace(/\s+/g, '_')}_${form.cedula}.png`;
    link.href = qr;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        background: "linear-gradient(135deg, #00C3FF, #004E92)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 40,
          borderRadius: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          textAlign: "center",
          width: "90%",
          maxWidth: 480,
        }}
      >
        
      <div>
        <img src={logo} alt="Logo Aries" style={{ width: 180, marginBottom: 20 }} />
        <h2 style={{ color: "#004E92", marginBottom: 20 }}>Registro al Evento</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2px', marginBottom: '15px' }}>
          <input name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} required />
          <input name="cedula" placeholder="Cédula" value={form.cedula} onChange={handleChange} required />
          <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
          <input name="cargo" placeholder="Cargo / Rol" value={form.cargo} onChange={handleChange} />
          <input name="entidad" placeholder="Entidad / Empresa" value={form.entidad} onChange={handleChange} />
          <button
            type="submit"
            style={{
                width: "100%",
                padding: "10px 12px",
                background: "linear-gradient(90deg, #00C3FF, #004E92)",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
              }}
          >
            Registrar
          </button>
        </form>

        {mensaje && <p style={{ fontWeight: 'bold', color: mensaje.includes('registrada') ? 'orange' : 'green' }}>{mensaje}</p>}
      </div>

      {qr && (
        <div>
          <h3>Código QR generado:</h3>
          <img
            src={qr}
            alt="QR de confirmación"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '600px',
              border: '1px solid #ccc',
              borderRadius: '1px',
              padding: '1px',
              backgroundColor: 'white',
              display: 'block',
              margin: '0 auto'
            }}
          />
          <button
            onClick={handleDescargar}
            style={{
              marginTop: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            >
            📥 Descargar QR
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
