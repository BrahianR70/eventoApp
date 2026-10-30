import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import logo1 from "../assets/logo.png"; // Logo principal
import logo2 from "../assets/logo_evento.PNG"; // Segundo logo (reemplázalo por el tuyo)
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setQr(null);
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/inscripcion`, form);
      setQr(data.qrCode);
      setMensaje(data.mensaje || 'Inscripción registrada exitosamente');
    } catch (error) {
      if (error.response?.status === 409) {
        setMensaje(error.response.data.error);
      } else {
        console.error(error);
        setMensaje('❌ Error al registrar la inscripción. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
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

  const handleLogoClick = () => {
    navigate('/confirmar');
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        background: "linear-gradient(135deg, #3BD8CF, #00C3FF)",
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
        {/* 🔹 Contenedor de logos */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          {/* Logo izquierdo (oculto enlace a confirmar) */}
          <img
            src={logo1}
            alt="Logo Aries"
            style={{
              width: 110,
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onClick={handleLogoClick}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          />

          {/* Logo derecho (estático o de patrocinador) */}
          {/*<img
            src={logo2}
            alt="Logo del Evento"
            style={{
              width: 100,
              transition: "transform 0.2s ease",
            }}
          />*/}
        </div>

        <h2 style={{ color: "#3BD8CF", marginBottom: 10 }}>Registro</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2px', marginBottom: '15px' }}>
          <input name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} required />
          <input name="cedula" placeholder="N° de Identificación" type="number" inputMode="numeric" value={form.cedula} onChange={handleChange} required />
          {/* <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
          <input name="cargo" placeholder="Cargo / Rol" value={form.cargo} onChange={handleChange} /> */}
          <input name="entidad" placeholder="Entidad / Empresa" value={form.entidad} onChange={handleChange} />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: loading
                ? "gray"
                : "linear-gradient(90deg, #3BD8CF, #00C3FF)",
              color: "white",
              border: "none",
              borderRadius: 25,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "0.3s",
            }}
          >
            {loading ? "Enviando..." : "Registrar"}
          </button>
        </form>

        {mensaje && (
          <p style={{
            fontWeight: 'bold',
            color: mensaje.includes('registrada') ? 'orange' : 'green'
          }}>
            {mensaje}
          </p>
        )}

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
                backgroundColor: '#3BD8CF',
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
