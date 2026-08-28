(function(){
  "use strict";

  /* ============ DATA ============ */
  // Las categorías reales (id, nombre, ícono) se cargan desde categories.json.
  // "Todos los productos" se agrega automáticamente al inicio de la lista.
  let CATEGORIES = [
    { id: "todos", name: "Todos los productos", icon: "layers" }
  ];

  // Icono de respaldo por categoría (se usa si una imagen del producto no carga)
  let CATEGORY_ICON = {};

  let PRODUCTS = [];         // datos crudos tal como vienen del JSON (ficha completa)
  let CATALOG_ITEMS = [];    // versión reducida para el catálogo: imagen, nombre, precio, categoría

  let CATALOG_LABEL = { todos: "Todos los productos" };

  let catCounts = { todos: 0 };
  function recomputeCounts(){
    catCounts = { todos: CATALOG_ITEMS.length };
    CATEGORIES.slice(1).forEach(c => {
      catCounts[c.id] = CATALOG_ITEMS.filter(p => p.cat === c.id).length;
    });
  }

  /* ============ STATE ============ */
  let state = {
    category: "todos",
    view: "grid",     // grid | list
    sort: "recent",
    visible: 12,
  };

  /* ============ ELEMENTS ============ */
  const categoryListEl = document.getElementById("categoryList");
  const categoryTrigger = document.getElementById("categoryTrigger");
  const categoryTriggerValue = document.getElementById("categoryTriggerValue");
  const categorySheetOverlay = document.getElementById("categorySheetOverlay");
  const categorySheetClose = document.getElementById("categorySheetClose");
  const categorySheetList = document.getElementById("categorySheetList");
  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const gridViewBtn = document.getElementById("gridViewBtn");
  const listViewBtn = document.getElementById("listViewBtn");
  const sortSelect = document.getElementById("sortSelect");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  /* ============ RENDER: SIDEBAR CATEGORIES ============ */
  function renderCategoryList(){
    categoryListEl.innerHTML = CATEGORIES.map(c => `
      <button type="button" class="cat-item ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}" role="listitem">
        <span class="cat-left">
          <svg class="cat-ico"><use href="#ico-${c.icon}"/></svg>
          ${c.name}
        </span>
        <span class="cat-count">(${catCounts[c.id]})</span>
      </button>
    `).join("");

    categoryListEl.querySelectorAll(".cat-item").forEach(btn => {
      btn.addEventListener("click", () => setCategory(btn.dataset.cat));
    });
  }

  /* ============ RENDER: MOBILE CATEGORY SHEET ============ */
  function renderCategorySheet(){
    const current = CATEGORIES.find(c => c.id === state.category) || CATEGORIES[0];
    categoryTriggerValue.textContent = `${current.name} (${catCounts[current.id]})`;

    categorySheetList.innerHTML = CATEGORIES.map(c => `
      <button type="button" class="sheet-option ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}" role="option" aria-selected="${state.category === c.id}">
        <span class="sheet-option-icon"><svg><use href="#ico-${c.icon}"/></svg></span>
        <span class="sheet-option-body">
          <span class="sheet-option-name">${c.name}</span>
          <span class="sheet-option-count">${catCounts[c.id]} producto${catCounts[c.id] === 1 ? '' : 's'}</span>
        </span>
        <span class="sheet-option-check"><svg><use href="#ico-check"/></svg></span>
      </button>
    `).join("");

    categorySheetList.querySelectorAll(".sheet-option").forEach(btn => {
      btn.addEventListener("click", () => {
        setCategory(btn.dataset.cat);
        closeCategorySheet();
      });
    });
  }

  function openCategorySheet(){
    categorySheetOverlay.classList.add("is-open");
    categoryTrigger.classList.add("is-open");
    categoryTrigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeCategorySheet(){
    categorySheetOverlay.classList.remove("is-open");
    categoryTrigger.classList.remove("is-open");
    categoryTrigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  categoryTrigger.addEventListener("click", () => {
    categorySheetOverlay.classList.contains("is-open") ? closeCategorySheet() : openCategorySheet();
  });
  categorySheetClose.addEventListener("click", closeCategorySheet);
  categorySheetOverlay.addEventListener("click", (e) => { if(e.target === categorySheetOverlay) closeCategorySheet(); });

  function setCategory(catId){
    state.category = catId;
    state.visible = 12;
    renderCategoryList();
    renderCategorySheet();
    renderProducts();
  }

  /* ============ SORT / FILTER ============ */
  function getFilteredSorted(){
    let list = state.category === "todos"
      ? CATALOG_ITEMS.slice()
      : CATALOG_ITEMS.filter(p => p.cat === state.category);

    switch(state.sort){
      case "price-asc":  list.sort((a,b) => a.price - b.price); break;
      case "price-desc": list.sort((a,b) => b.price - a.price); break;
      case "name-asc":   list.sort((a,b) => a.name.localeCompare(b.name, 'es')); break;
      default: break; // recent = original order
    }
    return list;
  }

  /* ============ RENDER: PRODUCTS ============ */
  function renderProducts(){
    const all = getFilteredSorted();
    const shown = all.slice(0, state.visible);

    if(shown.length === 0){
      productGrid.innerHTML = `
        <div class="empty-state">
          <strong>No encontramos productos</strong>
          Prueba con otra categoría del panel de filtros.
        </div>`;
    } else {
      productGrid.innerHTML = shown.map(p => `
        <a class="product-card" data-id="${p.id}" href="producto.html?=${p.slug}">
          <div class="product-thumb">
            <img
              src="${p.image}"
              alt="${p.name}"
              loading="lazy"
              onerror="window.__thumbFallback(this,'${CATEGORY_ICON[p.cat] || 'gift'}')"
            >
            <svg class="thumb-fallback-icon" hidden><use href="#ico-${CATEGORY_ICON[p.cat] || 'gift'}"/></svg>
          </div>
          <div class="product-info">
            <div>
              <p class="product-cat">${CATALOG_LABEL[p.cat] || p.cat}</p>
              <h3 class="product-name">${p.name}</h3>
            </div>
            <p class="product-price">$${p.price.toLocaleString('es-MX')}</p>
          </div>
        </a>
      `).join("");
    }

    const total = all.length;
    const upper = Math.min(state.visible, total);
    resultCount.innerHTML = total === 0
      ? "No hay resultados"
      : `Mostrando <strong>1–${upper}</strong> de <strong>${total}</strong> productos`;

    loadMoreBtn.style.display = state.visible >= total ? "none" : "inline-flex";
  }

  loadMoreBtn.addEventListener("click", () => {
    state.visible += 12;
    renderProducts();
  });

  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderProducts();
  });

  /* ============ VIEW TOGGLE (grid / list) ============ */
  function setView(view){
    state.view = view;
    productGrid.classList.toggle("is-list", view === "list");
    gridViewBtn.classList.toggle("active", view === "grid");
    listViewBtn.classList.toggle("active", view === "list");
    gridViewBtn.setAttribute("aria-pressed", view === "grid");
    listViewBtn.setAttribute("aria-pressed", view === "list");
  }
  gridViewBtn.addEventListener("click", () => setView("grid"));
  listViewBtn.addEventListener("click", () => setView("list"));

  /* ============ HAMBURGER MENU ============ */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavClose = document.getElementById("mobileNavClose");

  function openMobileNav(){
    mobileNav.classList.add("is-open");
    hamburgerBtn.classList.add("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMobileNav(){
    mobileNav.classList.remove("is-open");
    hamburgerBtn.classList.remove("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  hamburgerBtn.addEventListener("click", () => {
    mobileNav.classList.contains("is-open") ? closeMobileNav() : openMobileNav();
  });
  mobileNavClose.addEventListener("click", closeMobileNav);
  mobileNav.addEventListener("click", (e) => { if(e.target === mobileNav) closeMobileNav(); });
  document.querySelectorAll(".mobile-nav-links a").forEach(a => a.addEventListener("click", closeMobileNav));
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){ closeMobileNav(); closeCategorySheet(); }
  });

  /* ============ FALLBACK DE IMAGEN ============ */
  // Si la imagen del producto no carga (ruta rota o archivo faltante),
  // se oculta el <img> y se muestra el ícono de la categoría en su lugar.
  window.__thumbFallback = function(imgEl, iconName){
    imgEl.style.display = "none";
    const icon = imgEl.parentElement.querySelector(".thumb-fallback-icon");
    if(icon) icon.hidden = false;
  };

  /* ============ CARGA DE DATOS DESDE categories.json + products.json ============ */
  async function loadProducts(){
    productGrid.innerHTML = `<p class="catalog-status">Cargando productos…</p>`;
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("categories.json", { cache: "no-store" }),
        fetch("products.json", { cache: "no-store" })
      ]);
      if(!catRes.ok) throw new Error("categories.json HTTP " + catRes.status);
      if(!prodRes.ok) throw new Error("products.json HTTP " + prodRes.status);

      const categoriesData = await catRes.json();
      const data = await prodRes.json();

      // "Todos los productos" siempre va primero, seguido de las categorías del JSON.
      CATEGORIES = [{ id: "todos", name: "Todos los productos", icon: "layers" }, ...categoriesData];

      CATEGORY_ICON = {};
      CATEGORIES.forEach(c => { CATEGORY_ICON[c.id] = c.icon; });

      CATALOG_LABEL = { todos: "Todos los productos" };
      CATEGORIES.forEach(c => { CATALOG_LABEL[c.id] = c.name; });

      // Guardamos la ficha completa (descripción, stock, precios por pieza,
      // beneficios, instrucciones, detalles, etc.) para usarla más adelante
      // en una página de detalle de producto.
      PRODUCTS = data;

      // Para el catálogo solo se necesita: imagen, nombre, precio, categoría y slug (para el link al detalle).
      CATALOG_ITEMS = data.map(p => ({
        id: p.id,
        name: p.nombre,
        cat: p.categoria,
        price: p.precio,
        image: (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : "",
        slug: p.slug
      }));

      recomputeCounts();

      // Si la URL trae ?cat=slug (por ejemplo, desde un enlace de categoría
      // en la página de inicio), preseleccionamos esa categoría.
      // La comparación ignora mayúsculas/minúsculas y espacios extra,
      // para que ?cat=Chocolates o ?cat=chocolates-estimulantes funcionen igual.
      const urlCat = new URLSearchParams(window.location.search).get("cat");
      if(urlCat){
        const normalize = s => String(s).trim().toLowerCase();
        const match = CATEGORIES.find(c => normalize(c.id) === normalize(urlCat));
        if(match) state.category = match.id;
      }

      renderCategoryList();
      renderCategorySheet();
      renderProducts();
      setView("grid");
    } catch(err){
      console.error("No se pudieron cargar los datos:", err);
      productGrid.innerHTML = `
        <p class="catalog-status is-error">
          No se pudieron cargar los productos. Verifica que <code>categories.json</code> y
          <code>products.json</code> estén junto a este archivo y que la página se abra desde
          un servidor local (no directamente con doble clic), ya que los navegadores bloquean la
          lectura de archivos JSON locales por seguridad.
        </p>`;
      resultCount.textContent = "";
      loadMoreBtn.style.display = "none";
    }
  }

  /* ============ INIT ============ */
  loadProducts();
})();