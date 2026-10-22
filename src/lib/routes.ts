// Todas las rutas de la app, en un solo lugar. La web tiene dos áreas con la
// misma API: el COMERCIO (/comercio) y el CLIENTE (/cliente). Ningún enlace ni
// navegación escribe una ruta a mano: se usa esto.
export const routes = {
  // Primera pantalla: elegir si se entra como cliente o como comercio.
  entrada: "/",
  // A qué cuenta entrar (cliente o uno de sus comercios) y sumar un comercio.
  elegir: "/elegir",
  // Cierra la sesión y vuelve al inicio (sirve para el cliente y para el comercio).
  salir: "/salir",

  comercio: {
    mostrador: "/comercio",
    clientes: "/comercio/clientes",
    ficha: (customerId: string) => `/comercio/clientes/${customerId}`,
    cobrar: (customerId: string) => `/comercio/cobrar/${customerId}`,
    cargar: (customerId: string) => `/comercio/cargar/${customerId}`,
    ajustar: (customerId: string) => `/comercio/ajustar/${customerId}`,
    promos: "/comercio/promos",
    promoNueva: "/comercio/promos/nueva",
    promoEditar: (ruleId: string) => `/comercio/promos/${ruleId}/editar`,
    reactivar: "/comercio/reactivar",
    miComercio: "/comercio/mi-comercio",
  },

  cliente: {
    lugares: "/cliente/lugares",
    lugar: (merchantId: string) => `/cliente/lugares/${merchantId}`,
    saldos: "/cliente/saldos",
    perfil: "/cliente/perfil",
  },
} as const;
