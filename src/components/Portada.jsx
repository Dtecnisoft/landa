import { useState, useEffect } from 'react';
import imgP from '../assets/images/p.jpeg';
import imgP2 from '../assets/images/p2.jpeg';
import imgLandaP from '../assets/images/p3.png';
import imgV from '../assets/images/v2.png';

function Portada() {
  const images = [
    { src: imgP, alt: 'Landa App - Servicios locales' },
    { src: imgP2, alt: 'Landa App - Conexión directa' },
    { src: imgLandaP, alt: 'Landa App - Movilidad y comida' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <section
      className="hero hero-with-bg-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background carousel slides (Desktop) */}
      <div className="hero-bg-carousel">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`hero-bg-slide ${currentIndex === idx ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img.src})` }}
            aria-label={img.alt}
          />
        ))}
      </div>

      {/* Static mobile background image (v.jpeg) */}
      <div
        className="hero-bg-mobile"
        style={{ backgroundImage: `url(${imgV})` }}
        aria-label="Landa App - Portada móvil"
      />

      {/* Dark gradient overlay for optimal text contrast */}
      <div className="hero-bg-overlay" />

      <div className="container hero-content-relative">
        <div className="hero-copy hero-copy-full">
          <span className="eyebrow">SÚPER-APP DE CONEXIÓN TOTAL</span>
          <h1>Encuentra. Conecta. Resuelve.</h1>
          <p>
            Revolucionamos la forma en que pides, compras y te mueves en tu ciudad. Todo lo que necesitas en la palma de tu mano.
          </p>
          <div className="hero-actions">
            <a href="#" className="btn btn-primary">Descargar la app</a>
            <a href="#" className="btn btn-secondary">Cómo funciona</a>
          </div>
          <div className="hero-metrics">
            <div>
              <span>0%</span>
              <small className="metric-label">Comisiones en Domicilios</small>
            </div>
            <div>
              <span>100%</span>
              <small className="metric-label">Seguridad & Confianza</small>
            </div>
            <div>
              <span>+Recompensas</span>
              <small className="metric-label">Por usar la App</small>
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Carousel controls overlay (Desktop) */}
      <div className="hero-bg-controls">
        <button
          className="carousel-btn prev"
          onClick={handlePrev}
          aria-label="Imagen anterior"
        >
          &#10094;
        </button>

        <div className="carousel-dots">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${currentIndex === idx ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir a la imagen ${idx + 1}`}
            />
          ))}
        </div>

        <button
          className="carousel-btn next"
          onClick={handleNext}
          aria-label="Siguiente imagen"
        >
          &#10095;
        </button>
      </div>
    </section>
  );
}

export default Portada;
