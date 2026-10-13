import type { Config } from "tailwindcss";

// Tokens tomados de docs/DISENO.md (dirección B, "Cálida y de barrio").
// Si cambia un valor, se cambia en DISENO.md primero.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "#F6ECD9",
        tarjeta: "#FFFAF0",
        tinta: "#33201A",
        suave: "#6E5240",
        borde: "#DCC7A0",
        accion: { DEFAULT: "#B8412B", oscuro: "#7D2616" },
        mostaza: { DEFAULT: "#E0A93B", oscuro: "#A77A1C" },
        saldo: "#2F6B4A",
        crema: "#E8D9BB", // texto sobre el menú oscuro
        rosa: "#F0A794", // logo sobre el menú oscuro
        linea: "#EADCBC", // divisores dentro de tarjetas
        arena: "#E3D3B2", // botón deshabilitado
      },
      fontFamily: {
        titulo: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        texto: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        tarjeta: "18px",
        panel: "28px",
        campo: "22px",
        boton: "24px",
      },
      boxShadow: {
        tarjeta: "0 5px 0 #DCC7A0",
        accion: "0 5px 0 #7D2616",
        mostaza: "0 5px 0 #A77A1C",
      },
    },
  },
} satisfies Config;
