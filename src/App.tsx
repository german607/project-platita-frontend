import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Mostrador } from "./pages/Mostrador";
import { Placeholder } from "./pages/Placeholder";

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
            <Route path="cobrar/:customerId" element={<Placeholder title="Cobrar" />} />
            <Route path="cargar/:customerId" element={<Placeholder title="Cargar saldo" />} />
            <Route path="clientes" element={<Placeholder title="Clientes" />} />
            <Route path="promos" element={<Placeholder title="Promos" />} />
            <Route path="reactivar" element={<Placeholder title="Reactivar clientes" />} />
            <Route path="*" element={<Placeholder title="No encontrada" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
