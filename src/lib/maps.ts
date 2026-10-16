// "Cómo llegar": no hay mapa embebido, solo un enlace que abre la app de mapas
// con la dirección escrita (el backend todavía no guarda coordenadas).
export const directionsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Uruguay`)}`;
