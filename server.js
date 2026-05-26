require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.get("/api/status", (req, res) => {
    res.json({ mensaje: "Servidor funcionando correctamente" });
});

app.get("/api/gimnasios", async (req, res) => {
    try {
        const { localizacion, horario, deporte, zona } = req.query;

        if (!localizacion || !horario || !deporte) {
            return res.status(400).json({ error: "Faltan filtros de búsqueda" });
        }

        const values = [`%${localizacion}%`, deporte, horario];

        let query = `
            SELECT DISTINCT 
                g.id_gimnasio,
                g.nombre,
                g.direccion,
                g.ciudad,
                g.zona,
                g.telefono,
                g.email,
                g.red_social,
                g.latitud,
                g.longitud,
                d.nombre AS deporte
            FROM gimnasios g
            JOIN gimnasio_deporte gd ON g.id_gimnasio = gd.id_gimnasio
            JOIN deportes d ON gd.id_deporte = d.id_deporte
            JOIN horarios h ON g.id_gimnasio = h.id_gimnasio
            WHERE 
                LOWER(g.ciudad) LIKE LOWER($1)
                AND LOWER(d.nombre) = LOWER($2)
                AND (
                    ($3 = 'mañana' AND h.hora_inicio >= '06:00' AND h.hora_inicio < '14:00')
                    OR
                    ($3 = 'tarde' AND h.hora_inicio >= '14:00' AND h.hora_inicio < '20:00')
                    OR
                    ($3 = 'noche' AND h.hora_inicio >= '20:00')
                )
        `;

        if (zona && zona.trim() !== "") {
            values.push(`%${zona.trim()}%`);
            query += ` AND LOWER(COALESCE(g.zona, '')) LIKE LOWER($${values.length})`;
        }

        query += ` ORDER BY g.nombre`;

        const result = await db.query(query, values);

        res.json(result.rows);
    } catch (error) {
        console.error("Error buscando gimnasios:", error);
        res.status(500).json({ error: "Error al buscar gimnasios" });
    }
});

app.get("/api/gimnasios/:id_gimnasio/horarios", async (req, res) => {
    try {
        const { id_gimnasio } = req.params;

        const result = await db.query(`
            SELECT
                id_horario,
                id_gimnasio,
                dia_semana,
                hora_inicio::text AS hora_inicio,
                hora_fin::text AS hora_fin
            FROM horarios
            WHERE id_gimnasio = $1
            ORDER BY
                CASE LOWER(dia_semana)
                    WHEN 'lunes' THEN 1
                    WHEN 'martes' THEN 2
                    WHEN 'miércoles' THEN 3
                    WHEN 'miercoles' THEN 3
                    WHEN 'jueves' THEN 4
                    WHEN 'viernes' THEN 5
                    WHEN 'sábado' THEN 6
                    WHEN 'sabado' THEN 6
                    WHEN 'domingo' THEN 7
                    ELSE 8
                END,
                hora_inicio
        `, [id_gimnasio]);

        res.json({
            id_gimnasio: Number(id_gimnasio),
            horarios: result.rows
        });
    } catch (error) {
        console.error("Error obteniendo horarios del gimnasio:", error);
        res.status(500).json({ error: "Error al obtener horarios del gimnasio" });
    }
});

app.get("/api/productos", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.marca,
                p.talla,
                p.color,
                p.imagen_url,
                c.nombre AS categoria,
                COALESCE(
                    JSON_AGG(d.nombre ORDER BY d.nombre) FILTER (WHERE d.nombre IS NOT NULL),
                    '[]'
                ) AS deportes
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN producto_deporte pd ON p.id_producto = pd.id_producto
            LEFT JOIN deportes d ON pd.id_deporte = d.id_deporte
            GROUP BY p.id_producto, p.nombre, p.descripcion, p.precio, p.stock,
                     p.marca, p.talla, p.color, p.imagen_url, c.nombre
            ORDER BY p.id_producto
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.post("/api/registro", async (req, res) => {
    try {
        const { nombre, email, password, direccion, telefono } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }

        const existe = await db.query(
            "SELECT id_usuario FROM usuarios WHERE email = $1",
            [email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ error: "Ya existe una cuenta con ese email" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO usuarios (nombre, email, password, direccion, telefono)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id_usuario, nombre, email, direccion, telefono`,
            [nombre, email, passwordHash, direccion || null, telefono || null]
        );

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error("Error registrando usuario:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});
app.get("/api/gimnasios/:id_gimnasio/valoraciones", async (req, res) => {
    try {
        const { id_gimnasio } = req.params;

        const resumen = await db.query(`
            SELECT 
                COALESCE(ROUND(AVG(puntuacion)::numeric, 1), 0) AS media,
                COUNT(*) AS total_valoraciones
            FROM valoraciones_gimnasios
            WHERE id_gimnasio = $1
        `, [id_gimnasio]);

        const comentarios = await db.query(`
            SELECT 
                vg.id_valoracion,
                vg.puntuacion,
                vg.comentario,
                vg.fecha_valoracion,
                u.nombre AS usuario
            FROM valoraciones_gimnasios vg
            JOIN usuarios u ON vg.id_usuario = u.id_usuario
            WHERE vg.id_gimnasio = $1
            ORDER BY vg.fecha_valoracion DESC
            LIMIT 5
        `, [id_gimnasio]);

        res.json({
            media: resumen.rows[0].media,
            total_valoraciones: resumen.rows[0].total_valoraciones,
            comentarios: comentarios.rows
        });

    } catch (error) {
        console.error("Error obteniendo valoraciones:", error);
        res.status(500).json({ error: "Error obteniendo valoraciones" });
    }
});

app.post("/api/gimnasios/:id_gimnasio/valoraciones", async (req, res) => {
    try {
        const { id_gimnasio } = req.params;
        const { id_usuario, puntuacion, comentario } = req.body;

        if (!id_usuario) {
            return res.status(401).json({ error: "Debes iniciar sesión para valorar" });
        }

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({ error: "La puntuación debe estar entre 1 y 5" });
        }

        const usuarioExiste = await db.query(
            "SELECT id_usuario FROM usuarios WHERE id_usuario = $1",
            [id_usuario]
        );

        if (usuarioExiste.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const gimnasioExiste = await db.query(
            "SELECT id_gimnasio FROM gimnasios WHERE id_gimnasio = $1",
            [id_gimnasio]
        );

        if (gimnasioExiste.rows.length === 0) {
            return res.status(404).json({ error: "Gimnasio no encontrado" });
        }

        const resultado = await db.query(`
            INSERT INTO valoraciones_gimnasios 
                (id_gimnasio, id_usuario, puntuacion, comentario)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id_gimnasio, id_usuario)
            DO UPDATE SET
                puntuacion = EXCLUDED.puntuacion,
                comentario = EXCLUDED.comentario,
                fecha_valoracion = CURRENT_TIMESTAMP
            RETURNING *
        `, [
            id_gimnasio,
            id_usuario,
            puntuacion,
            comentario || null
        ]);

        res.status(201).json({
            mensaje: "Valoración guardada correctamente",
            valoracion: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error guardando valoración:", error);
        res.status(500).json({ error: "Error guardando valoración" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios" });
        }

        const result = await db.query(
            `SELECT id_usuario, nombre, email, password, direccion, telefono
             FROM usuarios
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        const usuario = result.rows[0];
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        res.json({
            mensaje: "Login correcto",
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                direccion: usuario.direccion,
                telefono: usuario.telefono
            }
        });

    } catch (error) {
        console.error("Error iniciando sesión:", error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

app.post("/api/pedidos", async (req, res) => {
    const client = await db.connect();

    try {
        const { id_usuario, productos } = req.body;

        if (!id_usuario || !productos || productos.length === 0) {
            return res.status(400).json({ error: "Datos del pedido incompletos" });
        }

        await client.query("BEGIN");

        let total = 0;

        for (const item of productos) {
            const cantidad = Number(item.cantidad);

            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                throw new Error("Cantidad de producto no válida");
            }

            const productoDB = await client.query(
                "SELECT id_producto, nombre, precio, stock FROM productos WHERE id_producto = $1 FOR UPDATE",
                [item.id_producto]
            );

            if (productoDB.rows.length === 0) {
                throw new Error("Uno de los productos no existe");
            }

            const producto = productoDB.rows[0];

            if (Number(producto.stock) < cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}`);
            }

            total += Number(producto.precio) * cantidad;
        }

        const pedido = await client.query(
            `INSERT INTO pedidos (id_usuario, total, estado)
             VALUES ($1, $2, $3)
             RETURNING id_pedido, total`,
            [id_usuario, total, "completado"]
        );

        const idPedido = pedido.rows[0].id_pedido;

        for (const item of productos) {
            const cantidad = Number(item.cantidad);

            const productoDB = await client.query(
                "SELECT precio FROM productos WHERE id_producto = $1",
                [item.id_producto]
            );

            const precioUnitario = productoDB.rows[0].precio;

            await client.query(
                `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [idPedido, item.id_producto, cantidad, precioUnitario]
            );

            await client.query(
                `UPDATE productos
                 SET stock = stock - $1
                 WHERE id_producto = $2`,
                [cantidad, item.id_producto]
            );
        }

        await client.query("COMMIT");

        res.json({
            mensaje: "Pedido completado correctamente",
            id_pedido: idPedido,
            total
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creando pedido:", error);
        res.status(400).json({ error: error.message || "Error al crear el pedido" });
    } finally {
        client.release();
    }
});

// Caché de noticias: se refresca cada 6 horas
const CACHE_NOTICIAS_MS = 6 * 60 * 60 * 1000;
let cacheNoticias = { datos: null, ultimaActualizacion: 0 };

const deportesPorKeyword = (titulo = "") => {
    const t = titulo.toLowerCase();
    if (t.includes("ufc") || t.includes("mma")) return "MMA";
    if (t.includes("box")) return "Boxeo";
    if (t.includes("muay")) return "Muay Thai";
    if (t.includes("jiu") || t.includes("bjj")) return "Jiu-Jitsu";
    if (t.includes("kick")) return "Kickboxing";
    return "Combate";
};

async function fetchNoticias() {
    const url = `https://newsapi.org/v2/everything?q=MMA+UFC+boxing+muay+thai+kickboxing+jiu-jitsu&sortBy=publishedAt&pageSize=4&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    if (!respuesta.ok || data.status === "error") {
        throw new Error(data.message || "Error NewsAPI");
    }

    return (data.articles || [])
        .filter(a => a.title && a.description && a.title !== "[Removed]")
        .slice(0, 4)
        .map(a => ({
            deporte: deportesPorKeyword(a.title),
            titulo: a.title,
            descripcion: a.description,
            url: a.url
        }));
}

app.get("/api/noticias", async (req, res) => {
    try {
        const ahora = Date.now();
        const cacheExpirada = ahora - cacheNoticias.ultimaActualizacion > CACHE_NOTICIAS_MS;

        if (!cacheNoticias.datos || cacheExpirada) {
            console.log("Actualizando caché de noticias...");
            cacheNoticias.datos = await fetchNoticias();
            cacheNoticias.ultimaActualizacion = ahora;
        } else {
            const minutosRestantes = Math.round((CACHE_NOTICIAS_MS - (ahora - cacheNoticias.ultimaActualizacion)) / 60000);
            console.log(`Noticias desde caché (se actualiza en ${minutosRestantes} min)`);
        }

        res.json(cacheNoticias.datos);

    } catch (error) {
        console.error("Error en /api/noticias:", error);

        // Si hay caché aunque sea antigua, devolverla antes que un error
        if (cacheNoticias.datos) {
            return res.json(cacheNoticias.datos);
        }

        res.status(500).json({ error: "Error al obtener noticias" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    try {
        cacheNoticias.datos = await fetchNoticias();
        cacheNoticias.ultimaActualizacion = Date.now();
        console.log("Noticias cargadas al inicio correctamente.");
    } catch (e) {
        console.warn("No se pudieron cargar las noticias al inicio:", e.message);
    }
});