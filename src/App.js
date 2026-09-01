import './styles/animations.css';
import Header from './components/Header.js';
import { HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from 'react';
import { Home } from './pages/Home.js'
import { Curriculo } from './pages/Curriculo.js'
import { Contato } from './pages/Contato.js'
import { Trabalhos } from './pages/Trabalhos.js'
import Footer from './components/Footer.js'
import ScrollToTop from './components/ScrollToTop';

const AreaRestrita = lazy(() => import('./pages/area-restrita/AreaRestrita.js').then((m) => ({ default: m.AreaRestrita })));
const AdminPortal = lazy(() => import('./pages/area-restrita/AdminPortal.js').then((m) => ({ default: m.AdminPortal })));
const ClientPortal = lazy(() => import('./pages/area-restrita/ClientPortal.js').then((m) => ({ default: m.ClientPortal })));

function AreaLoading() {
  return <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
}

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<AreaLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curriculo" element={<Curriculo />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/trabalhos" element={<Trabalhos />} />
          <Route path="/area-restrita" element={<AreaRestrita />} />
          <Route path="/area-restrita/admin" element={<AdminPortal />} />
          <Route path="/area-restrita/cliente" element={<ClientPortal />} />
        </Routes>
      </Suspense>
      <Footer />
    </HashRouter>
  )
}

export default App;