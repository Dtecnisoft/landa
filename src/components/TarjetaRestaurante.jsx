function TarjetaRestaurante({ name, category, offer }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-card-header">
        <span className="restaurant-name">{name}</span>
        <span className="restaurant-category">{category}</span>
      </div>
      <p>{offer}</p>
    </article>
  );
}

export default TarjetaRestaurante;
