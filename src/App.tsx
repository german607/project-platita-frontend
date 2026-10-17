import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LayoutCliente } from "./components/LayoutCliente";
import { SesionClienteProvider } from "./lib/sesionCliente";
import { Ajuste } from "./pages/Ajuste";
import { CargarSaldo } from "./pages/CargarSaldo";
import { Clientes } from "./pages/Clientes";
import { Cobrar } from "./pages/Cobrar";
import { Entrada } from "./pages/Entrada";
import { Ficha } from "./pages/Ficha";
import { MiComercio } from "./pages/MiComercio";
import { Mostrador } from "./pages/Mostrador";
import { Placeholder } from "./pages/Placeholder";
import { Ingreso } from "./pages/cliente/Ingreso";
import { Lugar } from "./pages/cliente/Lugar";
import { Lugares } from "./pages/cliente/Lugares";
import { Perfil } from "./pages/cliente/Perfil";
import { Saldos } from "./pages/cliente/Saldos";
import { PromoForm } from "./pages/PromoForm";
import { Promos } from "./pages/Promos";
import { Reactivar } from "./pages/Reactivar";

const queryClient = new QueryClient({
  defaultOptions: {
    // Un reintento alcanza: si falla dos veces, se le muestra el error a la persona.
    queries: { retry: 1 },
    // Una carga o un cobro nunca se reintenta solo (podría duplicar un movimiento).
    mutations: { retry: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SesionClienteProvider>
        <BrowserRouter>
          <Routes>
            {/* Primera pantalla: elegir cliente o comercio. */}
            <Route index element={<Entrada />} />

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

            {/* Área del cliente: el ingreso es público; el resto pide sesión. */}
            <Route path="cliente/ingreso" element={<Ingreso />} />
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
      </SesionClienteProvider>
    </QueryClientProvider>
  );
}
