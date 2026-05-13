const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// Base de datos gym
const gymDB = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "koWv6791",
    database: "gym"
});

// Base de datos tienda
const tiendaDB = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "koWv6791",
    database: "tienda"
});

app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente");
});

app.get("/api/gimnasios", async (req, res) => {
    try {
        const { localizacion, horario, deporte } = req.query;

        const query = `
            SELECT DISTINCT 
                g.id_gimnasio,
                g.nombre,
                g.direccion,
                g.ciudad,
                g.zona,
                g.telefono,
                g.email,
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

        const values = [
            `%${localizacion}%`,
            deporte,
            horario
        ];

        const result = await gymDB.query(query, values);

        res.json(result.rows);
    } catch (error) {
        console.error("Error buscando gimnasios:", error);
        res.status(500).json({ error: "Error al buscar gimnasios" });
    }
});

app.get("/api/productos", async (req, res) => {
    try {
        const result = await tiendaDB.query(`
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
                c.nombre AS categoria
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.listen(3000, () => {
    console.log("Servidor iniciado en http://localhost:3000");
});