import './index.css';
import CustomCursor from './components/CustomCursor';
import Navbar       from './components/Navbar';
import Hero         from './components/Hero';
import Features     from './components/Features';
import HowItWorks   from './components/HowItWorks';
import About        from './components/About';
import Download     from './components/Download';
import Footer       from './components/Footer';

export default function App() {
  return (
    <>
      {/* Custom cursor — rendered first, z-index 99999 */}
      <CustomCursor />

      <Navbar />
      <main>
        <Hero />
        <div className="divider" />
        <Features />
        <div className="divider" />
        <HowItWorks />
        <div className="divider" />
        <About />
        <div className="divider" />
        <Download />
      </main>
      <Footer />
    </>
  );
}
