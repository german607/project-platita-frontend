// Todas las rutas de la app, en un solo lugar. La web tiene dos áreas con la
// misma API: el COMERCIO (/comercio) y el CLIENTE (/cliente). Ningún enlace ni
// navegación escribe una ruta a mano: se usa esto.
export const routes = {
  // Primera pantalla: elegir si se entra como cliente o como comercio.
  entrada: "/",

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
    ingreso: "/cliente/ingreso",
    lugares: "/cliente/lugares",
    lugar: (merchantId: string) => `/cliente/lugares/${merchantId}`,
    saldos: "/cliente/saldos",
    perfil: "/cliente/perfil",
    // Cierra la sesión y vuelve a la entrada (fuera de la zona con sesión).
    salir: "/cliente/salir",
  },
} as const;
