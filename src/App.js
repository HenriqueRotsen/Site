import './styles/animations.css';
import Header from './components/Header.js';
import { HashRouter, Routes, Route } from "react-router-dom"; 
import { Home } from './pages/Home.js'
import { Curriculo } from './pages/Curriculo.js'
import { Contato } from './pages/Contato.js'
import { Trabalhos } from './pages/Trabalhos.js'
import Footer from './components/Footer.js'
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/curriculo" element={<Curriculo />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/trabalhos" element={<Trabalhos />} />
      </Routes>
      <Footer />
    </HashRouter>
  )
}

export default App;