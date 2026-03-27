document.addEventListener("astro:page-load", () => {
  const menuBtn = document.querySelector("header .menu");
  const nav = document.querySelector("header nav-menu nav");

  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", `${!isExpanded}`);
  });

  document.addEventListener("click", (e) => {
    if (!menuBtn || !nav) return;
    const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
    if (isExpanded && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
});
