import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AvisoServidor } from "./components/AvisoServidor";
import { Layout } from "./components/Layout";
import { LayoutCliente } from "./components/LayoutCliente";
import { ApiError } from "./lib/api/client";
import { SesionProvider } from "./lib/sesion";
import { Ajuste } from "./pages/Ajuste";
import { CargarSaldo } from "./pages/CargarSaldo";
import { Clientes } from "./pages/Clientes";
import { Cobrar } from "./pages/Cobrar";
import { Elegir } from "./pages/Elegir";
import { Entrada } from "./pages/Entrada";
import { Ficha } from "./pages/Ficha";
import { MiComercio } from "./pages/MiComercio";
import { Mostrador } from "./pages/Mostrador";
import { Placeholder } from "./pages/Placeholder";
import { Lugar } from "./pages/cliente/Lugar";
import { Lugares } from "./pages/cliente/Lugares";
import { Perfil } from "./pages/cliente/Perfil";
import { Saldos } from "./pages/cliente/Saldos";
import { PromoForm } from "./pages/PromoForm";
import { Promos } from "./pages/Promos";
import { Reactivar } from "./pages/Reactivar";
import { Salir } from "./pages/Salir";

const queryClient = new QueryClient({
  defaultOptions: {
    // Un reintento alcanza. Sin respuesta o con 503 ya reintentó `api` (servidor despertando).
    queries: { retry: (n, e) => n < 1 && !(e instanceof ApiError && (e.status === 0 || e.status === 503)) },
    // Una carga o un cobro nunca se reintenta solo (podría duplicar un movimiento).
    mutations: { retry: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>
        <AvisoServidor />
        <BrowserRouter>
          <Routes>
            {/* Pantalla de inicio: los lugares y la entrada. */}
            <Route index element={<Entrada />} />

            <Route path="elegir" element={<Elegir />} />
            <Route path="salir" element={<Salir />} />

            {/* Área del comercio. */}
            <Route path="comercio" element={<Layout />}>
              <Route index element={<Mostrador />} />
              <Route path="cobrar/:customerId" element={<Cobrar />} />
              <Route path="cargar/:customerId" element={<CargarSaldo />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/:customerId" element={<Ficha />} />
              <Route path="ajustar/:customerId" element={<Ajuste />} />
              <Route path="promos" element={<Promos />} />
              <Route path="promos/nueva" element={<PromoForm />} />
              <Route path="promos/:ruleId/editar" element={<PromoForm />} />
              <Route path="reactivar" element={<Reactivar />} />
              <Route path="mi-comercio" element={<MiComercio />} />
            </Route>

            {/* Área del cliente: pide sesión (se entra desde la pantalla de inicio). */}
            <Route path="cliente" element={<LayoutCliente />}>
              <Route index element={<Navigate to="lugares" replace />} />
              <Route path="lugares" element={<Lugares />} />
              <Route path="lugares/:merchantId" element={<Lugar />} />
              <Route path="saldos" element={<Saldos />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            <Route path="*" element={<Placeholder title="No encontrada" />} />
          </Routes>
        </BrowserRouter>
      </SesionProvider>
    </QueryClientProvider>
  );
}
