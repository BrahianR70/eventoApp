import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import axios from "axios";
import { API_URL } from "../api";
import logo from "../assets/logo.png"; // ✅ asegúrate de tener este archivo

export default function Confirmacion() {
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [credenciales, setCredenciales] = useState({ usuario: "", contrasena: "" });
  const manualRef = useRef();
  const ultimoEscaneo = useRef("");
  const bloqueado = useRef(false);

  const playFeedback = (success = true) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = success ? "sine" : "square";
    oscillator.frequency.setValueAtTime(success ? 880 : 220, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
    if (navigator.vibrate) navigator.vibrate(success ? [80, 30, 80] : [250]);
  };

  const login = async () => {
    if (!credenciales.usuario || !credenciales.contrasena) {
      setMensaje("⚠️ Debes ingresar usuario y contraseña");
      setTipoMensaje("error");
      return;
    }

    try {
      const cred = btoa(`${credenciales.usuario}:${credenciales.contrasena}`);
      await axios.post(`${API_URL}/login`, {}, { headers: { Authorization: `Basic ${cred}` } });
      setAutenticado(true);
      setMensaje("");
    } catch (error) {
      setTipoMensaje("error");
      if (error.response?.status === 401) {
        setMensaje("❌ Usuario o contraseña incorrectos");
      } else {
        setMensaje("⚠️ Error de conexión con el servidor");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  async function confirmar(cedula) {
    if (!cedula || bloqueado.current) return;

    bloqueado.current = true;
    setMensaje("");

    try {
      const cred = btoa(`${credenciales.usuario}:${credenciales.contrasena}`);
      console.log(API_URL);
      const { data } = await axios.post(
        `${API_URL}/confirmar`,
        { cedula },
        { headers: { Authorization: `Basic ${cred}` } }
      );

      playFeedback(true);
      setTipoMensaje("exito");
      setMensaje(data.mensaje || "✅ Asistencia confirmada");

      setTimeout(() => setMensaje(""), 800);
    } catch (err) {
      playFeedback(false);
      setTipoMensaje("error");
      if (err.response?.status === 404) setMensaje("❌ No se encontró la inscripción");
      else setMensaje("⚠️ Error confirmando asistencia");
    } finally {
      setTimeout(() => {
        bloqueado.current = false;
        ultimoEscaneo.current = "";
      }, 1000);
    }
  }

  const handleScan = (data) => {
    if (data?.text) {
      const texto = data.text.trim();
      if (texto === ultimoEscaneo.current) return;
      ultimoEscaneo.current = texto;

      const cedula = texto.replace("cedula:", "").trim();
      confirmar(cedula);
    }
  };

  const handleError = (err) => console.error("Error QR:", err);

  // 🟢 Login UI
  if (!autenticado) {
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
          <img src={logo} alt="Logo Aries" style={{ width: 170, marginBottom: 1 }} />
          <h2 style={{ color: "#3BD8CF", marginBottom: 20 }}>Ingreso de Usuario</h2>

          <input
            placeholder="Usuario"
            value={credenciales.usuario}
            onChange={(e) => setCredenciales({ ...credenciales, usuario: e.target.value })}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 12,
              borderRadius: 5,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={credenciales.contrasena}
            onChange={(e) => setCredenciales({ ...credenciales, contrasena: e.target.value })}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 20,
              borderRadius: 5,
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={login}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "linear-gradient(90deg, #3BD8CF, #00C3FF)",
              color: "white",
              border: "none",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Ingresar
          </button>
          {mensaje && (
            <p style={{ color: "#C00000", marginTop: 10, fontWeight: "bold" }}>{mensaje}</p>
          )}
        </div>
      </div>
    );
  }

  // 🟢 Vista principal
  return (
    <div style={{ padding: 15, textAlign: "center", backgroundColor: "#f5f5f5", minHeight: "72vh" }}>
      <img src={logo} alt="Logo Aries" style={{ width: 150, marginBottom: 1 }} />
      <h2 style={{ color: "#3BD8CF" }}>Confirmar Asistencia</h2>
      <p>Escanea el QR o ingresa la cédula manualmente.</p>

      <div style={{ maxWidth: 400, margin: "10px auto" }}>
        <QrReader
          constraints={{ facingMode: "environment" }}
          onResult={(result, error) => {
            if (!!result) handleScan(result);
            if (!!error) handleError(error);
          }}
          style={{ width: "100%", borderRadius: 8 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Cédula (manual)"
          ref={manualRef}
          style={{
            padding: 10,
            borderRadius: 5,
            border: "1px solid #ccc",
            marginRight: 10,
          }}
        />
        <button
          onClick={() => confirmar(manualRef.current.value)}
          style={{
            padding: "8px 14px",
            background: "linear-gradient(90deg, #3BD8CF, #00C3FF)",
            color: "white",
            border: "none",
            borderRadius: 15,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Confirmar
        </button>
      </div>

      {/* 🟢 Modal de resultado */}
      {mensaje && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: "40px 60px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 80 }}>{tipoMensaje === "exito" ? "✅" : "❌"}</div>
            <h3
              style={{
                marginTop: 10,
                color: tipoMensaje === "exito" ? "#28a745" : "#C00000",
              }}
            >
              {mensaje}
            </h3>
            <button
              onClick={() => {
                setMensaje("");
                setTipoMensaje("");
              }}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 10,
                background: "linear-gradient(90deg, #3BD8CF, #00C3FF)",
                color: "white",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
