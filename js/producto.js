(function(){
  "use strict";

  // Metadatos de categorías (nombre + ícono), cargados desde categories.json.
  let CATEGORY_META = {};

  function fmtPrice(n){ return "$" + Number(n).toLocaleString('es-MX'); }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[s]));
  }

  // Lee el slug del producto desde la URL: producto.html?=nombre-del-producto
  function getSlugFromURL(){
    const params = new URLSearchParams(window.location.search);
    return (params.get("") || "").trim();
  }

  function stockInfo(stock){
    if(stock <= 0)  return { label:"Sold Out",     cls:"out" };
    if(stock <= 10) return { label:"Pocas piezas", cls:"low" };
    return { label:"En stock", cls:"in" };
  }

  let currentImages = [];
  let currentIndex = 0;

  function setMainImage(index, iconName){
    currentIndex = index;
    const url = currentImages[index] || "";
    const mainImg = document.getElementById("galleryMainImg");
    const mainFallback = document.getElementById("galleryMainFallback");
    if(mainImg){
      mainImg.hidden = false;
      mainImg.src = url;
      mainImg.onerror = () => { mainImg.hidden = true; if(mainFallback) mainFallback.hidden = false; };
      if(mainFallback) mainFallback.hidden = true;
    }
    document.querySelectorAll(".gallery-thumb").forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });
    const active = document.querySelector(`.gallery-thumb[data-index="${index}"]`);
    if(active) active.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
  }

  function renderProduct(p, allProducts){
    const root = document.getElementById("productRoot");
    const catMeta = CATEGORY_META[p.categoria] || { name:p.categoria, icon:"gift" };
    const images = (p.imagenes && p.imagenes.length) ? p.imagenes : [""];
    currentImages = images;

    const st = stockInfo(p.stock);
    const hasDiscount = p.precioTachado && p.precioTachado > p.precio;
    const discountPct = hasDiscount ? Math.round((1 - p.precio / p.precioTachado) * 100) : 0;

    // Precios por varias piezas (sin porcentaje de descuento)
    const tierRows = [
      `<div class="tier-row"><span class="tier-qty">1 pieza</span><span class="tier-price">${fmtPrice(p.precio)} c/u</span></div>`
    ].concat(
      (p.preciosPorPieza || []).map(t =>
        `<div class="tier-row"><span class="tier-qty">${t.piezas} piezas</span><span class="tier-price">${fmtPrice(t.precioUnitario)} c/u</span></div>`
      )
    ).join("");

    const waMessage = encodeURIComponent(`Hola, me interesa "${p.nombre}" ($${p.precio} MXN). ¿Me pueden dar más información?`);

    const mayoreoHTML = p.ventaMayoreo
      ? `<div class="mayoreo-row">
           <p class="mayoreo-label">Venta por mayoreo: <strong>Sí</strong></p>
           <a class="btn-mayoreo" href="${p.catalogoMayoreoURL || '#'}" target="_blank" rel="noopener">
             <svg><use href="#ico-pdf"/></svg> Ver catálogo mayoreo (PDF)
           </a>
         </div>`
      : `<div class="mayoreo-row">
           <p class="mayoreo-label">Venta por mayoreo: <strong>No</strong></p>
         </div>`;

    const beneficiosHTML = (p.beneficios || []).map(b =>
      `<li><svg><use href="#ico-check"/></svg>${escapeHtml(b)}</li>`
    ).join("");

    const detallesEntries = Object.entries(p.detalles || {});
    const detallesHTML = detallesEntries.map(([k,v]) =>
      `<div class="d-row"><span class="d-label">${escapeHtml(k)}:</span><span class="d-value">${escapeHtml(v)}</span></div>`
    ).join("");

    root.innerHTML = `
      <section class="product-section">
        <div class="product-layout">

          <!-- Galería -->
          <div class="gallery">
            <div class="gallery-main">
              <img id="galleryMainImg" alt="${escapeHtml(p.nombre)}" hidden>
              <svg id="galleryMainFallback" class="thumb-fallback-icon" hidden><use href="#ico-${catMeta.icon}"/></svg>
              <button class="zoom-btn" id="zoomBtn" aria-label="Ampliar imagen"><svg><use href="#ico-zoom"/></svg></button>
            </div>
            <div class="gallery-thumbs">
              <button class="gallery-arrow" id="thumbPrev" aria-label="Anterior"><svg><use href="#ico-chevron-left"/></svg></button>
              <div class="gallery-thumbs-track" id="thumbsTrack">
                ${images.map((src, i) => `
                  <div class="gallery-thumb ${i===0?'active':''}" data-index="${i}">
                    <img src="${src}" alt="${escapeHtml(p.nombre)} ${i+1}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
                    <svg class="thumb-fallback-icon" hidden><use href="#ico-${catMeta.icon}"/></svg>
                  </div>
                `).join("")}
              </div>
              <button class="gallery-arrow" id="thumbNext" aria-label="Siguiente"><svg><use href="#ico-chevron-right"/></svg></button>
            </div>
          </div>

          <!-- Info -->
          <div class="product-info-col">
            <p class="product-cat-label">${escapeHtml(catMeta.name)}</p>
            <h1 class="product-title">${escapeHtml(p.nombre)}</h1>
            <p class="product-desc">${escapeHtml(p.descripcion || "")}</p>

            <div class="price-row">
              <span class="price-now">${fmtPrice(p.precio)}</span>
              ${hasDiscount ? `<span class="price-old">${fmtPrice(p.precioTachado)}</span>` : ""}
            </div>

            <div class="stock-row">
              <span class="stock-dot ${st.cls}"></span><span>${st.label}</span>
              <span class="stock-sep"></span><span>Listo para envío</span>
            </div>

            ${(p.preciosPorPieza && p.preciosPorPieza.length) ? `
              <p class="tiers-title">Precios por varias piezas</p>
              <div class="tiers-table">${tierRows}</div>
            ` : ""}

            <a class="btn-order" href="https://wa.me/522281118405?text=${waMessage}" target="_blank" rel="noopener">
              <svg><use href="#ico-whatsapp"/></svg> Pedir por WhatsApp
            </a>
            <p class="order-note"><svg><use href="#ico-lock"/></svg> Te responderemos para finalizar tu pedido</p>

            ${mayoreoHTML}
          </div>
        </div>

        <!-- Info cards -->
        <div class="info-cards">
          ${beneficiosHTML ? `
          <div class="info-card">
            <div class="info-card-icon"><svg><use href="#ico-drop"/></svg></div>
            <div class="info-card-body">
              <h3>Beneficios / Efectos</h3>
              <ul class="benefit-list">${beneficiosHTML}</ul>
            </div>
          </div>` : ""}

          ${p.instrucciones ? `
          <div class="info-card">
            <div class="info-card-icon"><svg><use href="#ico-info"/></svg></div>
            <div class="info-card-body">
              <h3>Instrucciones de uso</h3>
              <p>${escapeHtml(p.instrucciones)}</p>
            </div>
          </div>` : ""}

          ${detallesEntries.length ? `
          <div class="info-card">
            <div class="info-card-icon"><svg><use href="#ico-tag"/></svg></div>
            <div class="info-card-body" style="width:100%">
              <h3>Detalles del producto</h3>
              <div class="details-grid">${detallesHTML}</div>
            </div>
          </div>` : ""}
        </div>
      </section>
    `;

    // Galería: click en miniatura
    document.querySelectorAll(".gallery-thumb").forEach(el => {
      el.addEventListener("click", () => setMainImage(Number(el.dataset.index)));
    });
    document.getElementById("thumbPrev").addEventListener("click", () => {
      setMainImage((currentIndex - 1 + images.length) % images.length);
    });
    document.getElementById("thumbNext").addEventListener("click", () => {
      setMainImage((currentIndex + 1) % images.length);
    });
    setMainImage(0);

    // Lightbox / zoom
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    document.getElementById("zoomBtn").addEventListener("click", () => {
      lightboxImg.src = currentImages[currentIndex] || "";
      lightbox.classList.add("is-open");
    });

    // Relacionados: misma categoría
    const related = allProducts.filter(x => x.categoria === p.categoria && x.id !== p.id).slice(0, 5);
    const relatedSection = document.getElementById("relatedSection");
    if(related.length){
      relatedSection.innerHTML = `
        <p class="related-title">También te puede interesar</p>
        <div class="related-grid">
          ${related.map(r => {
            const img = (r.imagenes && r.imagenes[0]) ? r.imagenes[0] : "";
            const rCat = CATEGORY_META[r.categoria] || { icon:"gift" };
            return `
              <a class="related-card" href="producto.html?=${r.slug}">
                <div class="related-thumb">
                  <img src="${img}" alt="${escapeHtml(r.nombre)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
                  <svg hidden><use href="#ico-${rCat.icon}"/></svg>
                </div>
                <div class="related-info">
                  <p class="related-name">${escapeHtml(r.nombre)}</p>
                  <p class="related-price">${fmtPrice(r.precio)}</p>
                </div>
              </a>`;
          }).join("")}
        </div>
      `;
    }

    document.title = `${p.nombre} — Mood Shop`;
  }

  async function init(){
    const root = document.getElementById("productRoot");
    const slug = getSlugFromURL();

    if(!slug){
      root.innerHTML = `<p class="catalog-status">No se especificó ningún producto en la URL.<br>Regresa al <a href="index.html" style="color:var(--rose)">catálogo</a>.</p>`;
      return;
    }

    try{
      const [catRes, prodRes] = await Promise.all([
        fetch("categories.json", { cache:"no-store" }),
        fetch("products.json", { cache:"no-store" })
      ]);
      if(!catRes.ok) throw new Error("categories.json HTTP " + catRes.status);
      if(!prodRes.ok) throw new Error("products.json HTTP " + prodRes.status);

      const categoriesData = await catRes.json();
      const data = await prodRes.json();

      CATEGORY_META = {};
      categoriesData.forEach(c => { CATEGORY_META[c.id] = { name: c.name, icon: c.icon }; });

      const product = data.find(p => p.slug === slug);

      if(!product){
        root.innerHTML = `<p class="catalog-status">No encontramos ese producto.<br>Regresa al <a href="index.html" style="color:var(--rose)">catálogo</a>.</p>`;
        return;
      }
      renderProduct(product, data);
    } catch(err){
      console.error("No se pudieron cargar los datos:", err);
      root.innerHTML = `
        <p class="catalog-status is-error">
          No se pudieron cargar los datos del producto. Verifica que <code>categories.json</code>
          y <code>products.json</code> estén junto a este archivo y que la página se abra desde
          un servidor local (no directamente con doble clic).
        </p>`;
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

  /* ============ LIGHTBOX CLOSE ============ */
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightboxClose").addEventListener("click", () => lightbox.classList.remove("is-open"));
  lightbox.addEventListener("click", (e) => { if(e.target === lightbox) lightbox.classList.remove("is-open"); });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){ lightbox.classList.remove("is-open"); closeMobileNav(); }
  });

  init();
})();