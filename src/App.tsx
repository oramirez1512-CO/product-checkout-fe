import { Route, Routes } from 'react-router-dom';
import { ProductPage } from './features/product/ProductPage';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/status" element={<HomePage />} />
    </Routes>
  );
}
