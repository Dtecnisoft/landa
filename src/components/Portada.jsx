import { useState, useEffect } from 'react';
import imgP from '../assets/images/p.jpeg';
import imgP2 from '../assets/images/p2.jpeg';
import imgLandaP from '../assets/images/LandaP.jpeg';

function Portada() {
  const images = [
    { src: imgP, alt: 'Landa App - Servicios comunitarios' },
    { src: imgP2, alt: 'Landa App - Conexión directa' },
    { src: imgLandaP, alt: 'Landa App - Movilidad y comida' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">SÚPER-APP COMUNITARIA</span>
          <h1>La comunidad se conecta directo.</h1>
          <p>
            Landa es la súper-app comunitaria de última generación diseñada para conectar personas, comercios y servicios locales.
            Nuestra misión es empoderar a la comunidad facilitando la interacción directa, segura y transparente, reduciendo las comisiones excesivas de intermediarios y recompensando a los usuarios por su participación activa.
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
              <small className="metric-label">Seguridad Comunitaria</small>
            </div>
            <div>
              <span>+Recompensas</span>
              <small className="metric-label">Por usar la App</small>
            </div>
          </div>
        </div>
        <div className="hero-image-panel">
          <div 
            className="hero-carousel"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="hero-carousel-slides"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img.src} 
                  alt={img.alt} 
                  className="hero-carousel-slide" 
                />
              ))}
            </div>

            <button 
              className="carousel-btn prev" 
              onClick={handlePrev}
              aria-label="Imagen anterior"
            >
              &#10094;
            </button>

            <button 
              className="carousel-btn next" 
              onClick={handleNext}
              aria-label="Siguiente imagen"
            >
              &#10095;
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default Portada;
