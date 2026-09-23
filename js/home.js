(function(){
  "use strict";

  function fmtPrice(n){ return "$" + Number(n).toLocaleString('es-MX'); }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[s]));
  }

  /* ============ FALLBACK DE IMAGEN ============ */
  // Si la imagen del producto no carga, se oculta el <img> y se muestra
  // el ícono de Font Awesome de su categoría.
  window.__thumbFallback = function(imgEl){
    imgEl.style.display = "none";
    const icon = imgEl.parentElement.querySelector(".thumb-fallback-icon");
    if(icon) icon.hidden = false;
  };

  /* ============ RENDER: PRODUCTOS DESTACADOS ============ */
  function renderFeatured(products, categoryLabel, categoryIcon){
    const grid = document.getElementById("featuredGrid");

    // Usamos los productos marcados como "destacado" en el JSON;
    // si no hay ninguno marcado, mostramos los primeros 8 como respaldo.
    let featured = products.filter(p => p.destacado);
    if(featured.length === 0) featured = products.slice(0, 8);
    featured = featured.slice(0, 8);

    if(featured.length === 0){
      grid.innerHTML = `<p class="section-status">Aún no hay productos disponibles.</p>`;
      return;
    }

    grid.innerHTML = featured.map(p => {
      const img = (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : "";
      const icon = categoryIcon[p.categoria] || "fa-solid fa-gift";
      return `
        <a class="product-card" href="producto.html?=${p.slug}">
          <div class="product-thumb">
            <img
              src="${img}"
              alt="${escapeHtml(p.nombre)}"
              loading="lazy"
              onerror="window.__thumbFallback(this)"
            >
            <i class="thumb-fallback-icon ${icon}" hidden></i>
          </div>
          <div class="product-info">
            <div>
              <p class="product-cat">${escapeHtml(categoryLabel[p.categoria] || p.categoria)}</p>
              <h3 class="product-name">${escapeHtml(p.nombre)}</h3>
            </div>
            <p class="product-price">${fmtPrice(p.precio)}</p>
          </div>
        </a>`;
    }).join("");
  }

  /* ============ RENDER: CATEGORÍAS ============ */
  function renderCategories(categories, products){
    const grid = document.getElementById("categoryGrid");

    if(categories.length === 0){
      grid.innerHTML = `<p class="section-status">Aún no hay categorías configuradas.</p>`;
      return;
    }

    grid.innerHTML = categories.map(c => {
      const count = products.filter(p => p.categoria === c.id).length;
      return `
        <a class="category-tile" href="catalogo-mood-shop.html?cat=${c.id}">
          <span class="category-tile-icon"><i class="${c.icon}"></i></span>
          <span class="category-tile-name">${escapeHtml(c.name)}</span>
          <span class="category-tile-count">${count} producto${count === 1 ? '' : 's'}</span>
        </a>`;
    }).join("");
  }

  /* ============ CARGA DE DATOS ============ */
  async function init(){
    try{
      const [catRes, prodRes] = await Promise.all([
        fetch("categories.json", { cache:"no-store" }),
        fetch("products.json", { cache:"no-store" })
      ]);
      if(!catRes.ok) throw new Error("categories.json HTTP " + catRes.status);
      if(!prodRes.ok) throw new Error("products.json HTTP " + prodRes.status);

      const categories = await catRes.json();
      const products = await prodRes.json();

      const categoryLabel = {};
      const categoryIcon = {};
      categories.forEach(c => { categoryLabel[c.id] = c.name; categoryIcon[c.id] = c.icon; });

      renderFeatured(products, categoryLabel, categoryIcon);
      renderCategories(categories, products);
    } catch(err){
      console.error("No se pudieron cargar los datos de inicio:", err);
      const msg = `
        <p class="section-status">
          No se pudieron cargar los datos. Verifica que <code>categories.json</code> y
          <code>products.json</code> estén junto a este archivo y que la página se abra
          desde un servidor local (no directamente con doble clic).
        </p>`;
      document.getElementById("featuredGrid").innerHTML = msg;
      document.getElementById("categoryGrid").innerHTML = "";
    }
  }

  /* ============ HAMBURGER MENU ============ */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavClose = document.getElementById("mobileNavClose");
  function openMobileNav(){ mobileNav.classList.add("is-open"); hamburgerBtn.classList.add("is-open"); hamburgerBtn.setAttribute("aria-expanded","true"); document.body.style.overflow="hidden"; }
  function closeMobileNav(){ mobileNav.classList.remove("is-open"); hamburgerBtn.classList.remove("is-open"); hamburgerBtn.setAttribute("aria-expanded","false"); document.body.style.overflow=""; }
  hamburgerBtn.addEventListener("click", () => mobileNav.classList.contains("is-open") ? closeMobileNav() : openMobileNav());
  mobileNavClose.addEventListener("click", closeMobileNav);
  mobileNav.addEventListener("click", (e) => { if(e.target === mobileNav) closeMobileNav(); });
  document.querySelectorAll(".mobile-nav-links a").forEach(a => a.addEventListener("click", closeMobileNav));
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeMobileNav(); });

  init();
})();