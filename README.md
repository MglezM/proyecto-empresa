# FightFinder 

## 1. Descripción general

**FightFinder** es una aplicación web orientada a deportes de combate. Permite buscar gimnasios según localización, zona, horario y deporte; consultar la información completa de cada gimnasio; comprar productos deportivos en una tienda integrada; y consultar una guía de deportes de combate.

El proyecto está formado por:

- **Frontend** en HTML, CSS y JavaScript.
- **Backend** en Node.js con Express.
- **Base de datos** PostgreSQL.
- **Mapa interactivo** con Leaflet.
- **Noticias externas** mediante NewsAPI.

---

## 2. Tecnologías utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- Leaflet
- LocalStorage

### Backend

- Node.js
- Express
- PostgreSQL
- pg
- bcrypt
- cors
- dotenv

### Base de datos

- PostgreSQL
- pgAdmin para administración visual

---

## 3. Estructura recomendada del proyecto

```text
proyecto-empresa/
├── public/
│   ├── index.html
│   └── img/
│       ├── banner4.png
│       ├── deportes/
│       ├── gimnasios/
│       └── productos/
├── server.js
├── package.json
├── package-lock.json
└── .env
```

El servidor expone la carpeta `public` con:

```js
app.use(express.static(path.join(__dirname, "public")));
```

Por eso el archivo principal de la web debe llamarse:

```text
public/index.html
```

---

## 4. Instalación

### 4.1. Instalar dependencias

```bash
npm install
```

### 4.2. Crear archivo `.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=fightfinder
PORT=3000
NEWS_API_KEY=tu_api_key
```

### 4.3. Ejecutar servidor

```bash
node server.js
```

El servidor debería mostrar:

```text
Servidor iniciado en puerto 3000
```

### 4.4. Abrir la web

```text
http://localhost:3000
```

O desde otra máquina de la red:

```text
http://IP_DEL_SERVIDOR:3000
```

---

## 5. Funcionalidades del frontend

## 5.1. Pantalla inicial

La pantalla inicial contiene accesos a:

- Buscador de gimnasios.
- Tienda.
- Guía de deportes.
- Noticias recientes.

También incluye selector de idioma.

---

## 5.2. Buscador de gimnasios

Permite buscar gimnasios usando:

- Localización.
- Zona.
- Horario.
- Deporte.

La zona es opcional. Si el usuario no la escribe, la búsqueda se realiza igualmente.

Los resultados muestran:

- Tarjetas de gimnasios.
- Mapa con marcadores.
- Nombre del gimnasio.
- Deporte.
- Ciudad.
- Zona.
- Dirección.
- Teléfono.

Al hacer clic en una tarjeta se abre la vista de detalle del gimnasio.

---

## 5.3. Detalle del gimnasio

La vista de detalle muestra:

- Nombre.
- Galería de fotos.
- Localización.
- Dirección.
- Teléfono.
- Deporte.
- Horario.
- Email.
- Red social, si existe.

Las fotos se obtienen desde:

```text
GET /api/gimnasios/:id_gimnasio/fotos
```

Los horarios se obtienen desde:

```text
GET /api/gimnasios/:id_gimnasio/horarios
```

---

## 5.4. Galería de fotos de gimnasios

La tabla recomendada es:

```sql
CREATE TABLE gimnasio_fotos (
    id_foto SERIAL PRIMARY KEY,
    id_gimnasio INTEGER REFERENCES gimnasios(id_gimnasio),
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 1
);
```

Ejemplo:

```sql
INSERT INTO gimnasio_fotos (id_gimnasio, url, orden)
VALUES
(1, '/img/gimnasios/dojo-dragon-rojo-1.jpg', 1),
(1, '/img/gimnasios/dojo-dragon-rojo-2.jpg', 2),
(1, '/img/gimnasios/dojo-dragon-rojo-3.jpg', 3);
```

Las imágenes deben guardarse físicamente en:

```text
public/img/gimnasios/
```

---

## 5.5. Tienda

La tienda muestra productos cargados desde la base de datos.

Permite:

- Ver productos.
- Buscar por nombre.
- Filtrar por categoría.
- Filtrar por marca.
- Filtrar por deporte.
- Ordenar por precio.
- Ver detalles de producto.
- Añadir productos al carrito.

Cada producto puede tener:

- Nombre.
- Descripción.
- Precio.
- Stock.
- Marca.
- Talla.
- Color.
- Imagen.
- Categoría.
- Deportes asociados.

---

## 5.6. Carrito y pago

El carrito permite:

- Añadir productos.
- Cambiar cantidades.
- Eliminar productos.
- Vaciar carrito.
- Ver total.
- Finalizar compra.

El carrito se guarda en `localStorage`.

Para finalizar la compra, el usuario debe iniciar sesión.

---

## 5.7. Productos relacionados

En la página de pago aparece la sección:

```text
Comprados juntos habitualmente
```

Estos productos se calculan usando:

- misma categoría
- misma marca
- deportes relacionados
- stock disponible

Los productos que ya están en el carrito no se recomiendan de nuevo.

---

## 5.8. Login y registro

El proyecto permite:

- Crear cuenta.
- Iniciar sesión.
- Cerrar sesión.
- Guardar datos del usuario en `localStorage`.

La contraseña se cifra en backend con `bcrypt`.

---

## 5.9. Guía de deportes

La guía incluye tarjetas desplegables de deportes de combate:

- Boxeo.
- MMA.
- Brazilian Jiu-Jitsu.
- Muay Thai.
- Judo.
- Karate.
- Taekwondo.

Cada tarjeta puede mostrar:

- Imagen.
- Descripción.
- Ventajas.
- Desventajas.
- Valores.
- Recomendado para.
- Vídeo de YouTube.

Las imágenes recomendadas van en:

```text
public/img/deportes/
```

Ejemplo:

```text
public/img/deportes/boxeo.jpg
public/img/deportes/mma.jpg
public/img/deportes/bjj.jpg
public/img/deportes/muay-thai.jpg
public/img/deportes/judo.jpg
public/img/deportes/karate.jpg
public/img/deportes/taekwondo.jpg
```

---

## 5.10. Noticias recientes

La página inicial incluye un bloque de noticias de deportes de combate. El backend llama a NewsAPI y cachea los resultados durante 6 horas para evitar demasiadas peticiones.

---

## 6. Endpoints del backend

| Método | Ruta |
|---|---|
| GET | `/api/status` |
| GET | `/api/gimnasios` |
| GET | `/api/gimnasios/:id_gimnasio/fotos` |
| GET | `/api/gimnasios/:id_gimnasio/horarios` |
| GET | `/api/productos` |
| POST | `/api/registro` |
| GET | `/api/gimnasios/:id_gimnasio/valoraciones` |
| POST | `/api/gimnasios/:id_gimnasio/valoraciones` |
| POST | `/api/login` |
| POST | `/api/pedidos` |
| GET | `/api/noticias` |

---

## 7. Explicación de endpoints

## 7.1. Estado del servidor

```text
GET /api/status
```

Devuelve un mensaje para comprobar que el backend está funcionando.

---

## 7.2. Buscar gimnasios

```text
GET /api/gimnasios
```

Parámetros:

```text
localizacion
horario
deporte
zona
```

Ejemplo:

```text
/api/gimnasios?localizacion=Madrid&horario=tarde&deporte=karate&zona=Centro
```

La zona es opcional.

---

## 7.3. Fotos de un gimnasio

```text
GET /api/gimnasios/:id_gimnasio/fotos
```

Devuelve las fotos de la tabla `gimnasio_fotos`.

---

## 7.4. Horarios de un gimnasio

```text
GET /api/gimnasios/:id_gimnasio/horarios
```

Devuelve los horarios ordenados por día de la semana y hora de inicio.

---

## 7.5. Productos

```text
GET /api/productos
```

Devuelve productos con su categoría y deportes asociados.

---

## 7.6. Registro

```text
POST /api/registro
```

Body:

```json
{
  "nombre": "Mario",
  "email": "mario@email.com",
  "password": "123456",
  "direccion": "Calle Ejemplo 1",
  "telefono": "600000000"
}
```

---

## 7.7. Login

```text
POST /api/login
```

Body:

```json
{
  "email": "mario@email.com",
  "password": "123456"
}
```

---

## 7.8. Pedidos

```text
POST /api/pedidos
```

Body:

```json
{
  "id_usuario": 1,
  "productos": [
    {
      "id_producto": 1,
      "cantidad": 2
    }
  ]
}
```

El backend comprueba stock, crea el pedido, añade los detalles y descuenta stock.

---

## 7.9. Noticias

```text
GET /api/noticias
```

Devuelve noticias recientes sobre deportes de combate.

---

## 8. Base de datos

## 8.1. Tabla `usuarios`

```text
id_usuario
nombre
email
password
direccion
telefono
```

## 8.2. Tabla `gimnasios`

```text
id_gimnasio
nombre
direccion
ciudad
zona
telefono
email
red_social
latitud
longitud
```

## 8.3. Tabla `deportes`

```text
id_deporte
nombre
```

## 8.4. Tabla `gimnasio_deporte`

```text
id_gimnasio
id_deporte
```

## 8.5. Tabla `horarios`

```text
id_horario
id_gimnasio
dia_semana
hora_inicio
hora_fin
```

## 8.6. Tabla `gimnasio_fotos`

```text
id_foto
id_gimnasio
url
orden
```

## 8.7. Tabla `productos`

```text
id_producto
nombre
descripcion
precio
stock
marca
talla
color
imagen_url
id_categoria
```

## 8.8. Tabla `categorias`

```text
id_categoria
nombre
```

## 8.9. Tabla `producto_deporte`

```text
id_producto
id_deporte
```

## 8.10. Tabla `pedidos`

```text
id_pedido
id_usuario
fecha_pedido
total
estado
```

## 8.11. Tabla `detalle_pedido`

```text
id_detalle
id_pedido
id_producto
cantidad
precio_unitario
```

## 8.12. Tabla `valoraciones_gimnasios`

El backend todavía conserva endpoints de valoraciones, aunque en el frontend se eliminó el sistema visual de estrellas y comentarios.

```text
id_valoracion
id_gimnasio
id_usuario
puntuacion
comentario
fecha_valoracion
```

---

## 9. SQL útil

### Crear tabla de fotos de gimnasios

```sql
CREATE TABLE gimnasio_fotos (
    id_foto SERIAL PRIMARY KEY,
    id_gimnasio INTEGER REFERENCES gimnasios(id_gimnasio),
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 1
);
```

### Añadir una foto a un gimnasio

```sql
INSERT INTO gimnasio_fotos (id_gimnasio, url, orden)
VALUES (1, '/img/gimnasios/dojo-dragon-rojo-1.jpg', 1);
```

### Ver horarios de un gimnasio

```sql
SELECT *
FROM horarios
WHERE id_gimnasio = 1
ORDER BY hora_inicio;
```

### Añadir red social a gimnasios

```sql
ALTER TABLE gimnasios
ADD COLUMN red_social TEXT;
```

### Añadir zona a gimnasios

```sql
ALTER TABLE gimnasios
ADD COLUMN zona VARCHAR(100);
```

---

## 10. Rutas de imágenes

## 10.1. Banner

El frontend usa:

```css
url("/img/banner4.png")
```

Por tanto, el archivo debe estar en:

```text
public/img/banner4.png
```

## 10.2. Imágenes de gimnasios

Ejemplo en base de datos:

```text
/img/gimnasios/dojo-dragon-rojo-1.jpg
```

Archivo real:

```text
public/img/gimnasios/dojo-dragon-rojo-1.jpg
```

## 10.3. Imágenes de deportes

Ejemplo:

```text
/img/deportes/boxeo.jpg
```

Archivo real:

```text
public/img/deportes/boxeo.jpg
```

## 10.4. Imágenes de productos

La columna `imagen_url` de `productos` debe apuntar a la imagen.

Ejemplo:

```text
/img/productos/guantes-boxeo.jpg
```

Archivo real:

```text
public/img/productos/guantes-boxeo.jpg
```

---

## 11. Despliegue

## 11.1. GitHub Pages

GitHub Pages solo sirve frontend estático. No ejecuta `server.js`.

Si se usa GitHub Pages:

```js
const API_BACKEND = "https://tu-backend-publico.com";
```

## 11.2. Backend

El backend puede desplegarse en:

- Render.
- Railway.
- VPS.
- Servidor propio.

En producción hay que configurar las variables de entorno.

---

## 12. Problemas frecuentes

## El horario aparece como “No indicado”

Comprobar:

```text
GET /api/gimnasios/:id_gimnasio/horarios
```

Y que la tabla `horarios` tenga datos.

## No aparecen fotos del gimnasio

Comprobar:

```text
GET /api/gimnasios/:id_gimnasio/fotos
```

También revisar que la URL exista en la tabla `gimnasio_fotos`.

## El mapa no marca gimnasios

Comprobar que los gimnasios tienen:

```text
latitud
longitud
```

## La tienda no carga

Comprobar:

```text
GET /api/productos
```

Y que hay productos en la base de datos.

## Error de conexión a PostgreSQL

Revisar `.env`.

---

## 13. Mejoras futuras

- Panel de administración.
- Subida de imágenes desde formulario.
- Recuperación de contraseña.
- Pasarela de pago real.
- Historial de pedidos.
- Favoritos.
- Reseñas de gimnasios si se quiere reactivar.
- Paginación en tienda.
- Roles de administrador y cliente.
- Mejoras responsive para móvil.

---

## 14. Conclusión

FightFinder es una plataforma web completa para buscar gimnasios de deportes de combate y comprar productos relacionados. Integra mapa, buscador, tienda, carrito, login, pedidos, guía deportiva, noticias y detalle visual de gimnasios.

El proyecto está preparado para ejecutarse en local con Node.js y PostgreSQL, y puede desplegarse en producción separando frontend y backend.
