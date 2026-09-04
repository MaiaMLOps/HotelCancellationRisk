import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MLOps from './pages/MLOps';
import Riesgo from './pages/Riesgo';
import Validacion from './pages/Validacion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="mlops" element={<MLOps />} />
          <Route path="riesgo" element={<Riesgo />} />
          <Route path="validacion" element={<Validacion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
