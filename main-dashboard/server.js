import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const menuItems = [
  { id: 1, title: "Ingresos", icon: "📄" , href: "/"},
  { id: 2, title: "Servicios", icon: "🛠️" , href: "/" },
  { id: 3, title: "Clientes", icon: "👥" , href: "/" },
  { id: 4, title: "Tipos De Servicio", icon: "⚙️" , href: "/" },
  { id: 5, title: "Inventarios", icon: "📦" , href: "/"},
  { id: 6, title: "Reportes", icon:"📊" , href: "/"}
];

app.get("/api/menu", (req, res) => res.json(menuItems));

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
