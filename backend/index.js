/**
 * backend/index.js
 * Express + MySQL + QR + BasicAuth + Envío de correo con QR (opcional)
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const QRCode = require('qrcode');
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
const { createCanvas, loadImage } = require('canvas');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());

// --- CONFIGURA la conexión aquí --- //
const dbConfig = {
  host: "bz5ltbnqxnqrdetkgbok-mysql.services.clever-cloud.com",
  user: "uixjlofujdntqszl",
  password: "tsYgbMkDKat8IGNl93jU",
  database: "bz5ltbnqxnqrdetkgbok",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ---------- Crear tabla si no existe ----------
async function ensureTable() {
  const createSql = `
  CREATE TABLE IF NOT EXISTS inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    cedula VARCHAR(50),
    email VARCHAR(150),
    cargo VARCHAR(100),
    entidad VARCHAR(100),
    qr TEXT,
    asistencia TINYINT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.query(createSql);
}
ensureTable().catch(err => console.error("❌ No se pudo crear la tabla automáticamente:", err));

// ---------- Configuración del correo (ajústala a tu SMTP) ----------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // o tu servidor SMTP
  port: 587,
  secure: true, // true para 465, false para otros
  auth: {
    user: "notificacionesariesnet@gmail.com", // <-- cámbialo
    pass: "sistemasaries", // <-- cámbialo
  },
});

// ---------- Módulo 1: Inscripción ----------
app.post('/api/inscripcion', async (req, res) => {
  try {
    const { nombre, cedula, email, cargo, entidad } = req.body;

    if (!nombre || !cedula || !email) {
      return res.status(400).json({ error: "Faltan campos obligatorios (nombre, cedula, email)" });
    }

    // 🔍 Validar si la cédula ya existe
    const [existe] = await pool.execute(
      'SELECT qr FROM inscripciones WHERE cedula = ? LIMIT 1',
      [cedula]
    );

    if (existe.length > 0) {
      return res.status(200).json({
        mensaje: "Esta cédula ya está registrada en el evento. Descarga tu QR nuevamente.",
        qrCode: existe[0].qr
      });
    }

    // 🧩 Generar el QR
    const qrPayload = `cedula:${cedula}`;
    const qrBase64 = await QRCode.toDataURL(qrPayload, {
      width: 1000,
      margin: 1,
      scale: 20,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    // 🖼️ Agregar texto al QR
    const qrImage = await loadImage(qrBase64);
    const canvas = createCanvas(qrImage.width, qrImage.height + 100);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrImage, 0, 0);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Nombre: ${nombre}`, 20, qrImage.height + 35);
    ctx.fillText(`Cédula: ${cedula}`, 20, qrImage.height + 70);
    const qrCode = canvas.toDataURL('image/png');

    // 💾 Guardar en base de datos
    const sql = `
      INSERT INTO inscripciones (nombre, cedula, email, cargo, entidad, qr)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(sql, [nombre, cedula, email, cargo || null, entidad || null, qrCode]);

    // 📧 Intentar enviar el correo (sin bloquear si falla)
    try {
      await transporter.sendMail({
        from: 'Evento Aries 2025', // remitente
        to: email,
        subject: "Confirmación de inscripción - Evento Aries",
        html: `
          <h2>Hola ${nombre},</h2>
          <p>Tu inscripción al evento fue registrada exitosamente.</p>
          <p>Adjunto tu código QR para ingresar al evento:</p>
          <br/>
          <img src="${qrCode}" alt="QR de confirmación" width="300"/>
          <p style="font-size:12px;color:gray;">Por favor guarda esta imagen, será necesaria para tu ingreso.</p>
        `,
      });
      console.log(`📨 Email enviado a ${email}`);
    } catch (mailErr) {
      console.warn(`⚠️ No se pudo enviar correo a ${email}:`, mailErr.message);
      // No interrumpimos la respuesta
    }

    // ✅ Responder al frontend
    return res.json({ mensaje: "Inscripción exitosa", qrCode });

  } catch (err) {
    console.error("❌ Error al crear inscripción:", err);
    return res.status(500).json({
      error: "Error en el servidor al crear la inscripción",
      detalle: err.message
    });
  }
});

// ---------- Módulo 2: Listar inscripciones ----------
app.get('/api/inscripciones', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, cedula, email, cargo, entidad, asistencia, creado_en
      FROM inscripciones ORDER BY creado_en DESC LIMIT 200
    `);
    return res.json(rows);
  } catch (err) {
    console.error("❌ Error al listar inscripciones:", err);
    return res.status(500).json({ error: "Error obteniendo inscripciones" });
  }
});

// ---------- Módulo 3: Login ----------
app.post('/api/login', basicAuth({
  users: { 'adminaries': 'aries123' },
  challenge: true,
}), (req, res) => {
  return res.json({ mensaje: "Login exitoso" });
});

// ---------- Módulo 4: Confirmar asistencia ----------
app.post('/api/confirmar', basicAuth({
  users: { 'adminaries': 'aries123' },
  challenge: true,
}), async (req, res) => {
  try {
    const { cedula } = req.body;
    if (!cedula) return res.status(400).json({ error: "Cédula requerida" });

    const [result] = await pool.execute('UPDATE inscripciones SET asistencia = 1 WHERE cedula = ?', [cedula]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No se encontró la inscripción con esa cédula" });
    }

    return res.json({ mensaje: "Asistencia confirmada" });
  } catch (err) {
    console.error("❌ Error al confirmar asistencia:", err);
    return res.status(500).json({ error: "Error al confirmar asistencia" });
  }
});

// ---------- Iniciar servidor ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
