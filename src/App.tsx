import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Ajuste } from "./pages/Ajuste";
import { CargarSaldo } from "./pages/CargarSaldo";
import { Clientes } from "./pages/Clientes";
import { Cobrar } from "./pages/Cobrar";
import { Ficha } from "./pages/Ficha";
import { Mostrador } from "./pages/Mostrador";
import { Placeholder } from "./pages/Placeholder";
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
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
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
            <Route path="*" element={<Placeholder title="No encontrada" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
