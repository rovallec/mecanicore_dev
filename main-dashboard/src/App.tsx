import React, { useEffect, useState } from "react";
import "./App.css";

type MenuItem = {
  id: number;
  title: string;
  icon: string;
  href?: string; // agregamos href opcional
};

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data: MenuItem[]) => setMenuItems(data))
      .catch((err) => console.error("Error fetching menu:", err));
  }, []);

  return (
    <div className="app">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href={item.href || "#"} // si no hay href, usamos #
            className="menu-card"
          >
            <div className="menu-icon">{item.icon}</div>
            <div className="menu-label">{item.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
