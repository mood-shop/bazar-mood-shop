(function(){
  "use strict";

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
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeMobileNav(); });
})();
