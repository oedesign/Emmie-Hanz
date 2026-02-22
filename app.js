const CART_KEY = "bg_cart";
const WISHLIST_KEY = "bg_wishlist";

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const setCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const getWishlist = () => JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
const setWishlist = (ids) => localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
const formatPrice = (value) => `$${value.toLocaleString()}`;
const byId = (id) => PRODUCTS.find((p) => p.id === id);

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = count));
}

function addToCart(id) {
  const cart = getCart();
  const hit = cart.find((x) => x.id === id);
  if (hit) hit.qty += 1;
  else cart.push({ id, qty: 1 });
  setCart(cart);
  updateCartCount();
}

function toggleWishlist(id) {
  const list = getWishlist();
  const updated = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  setWishlist(updated);
  renderShop();
}

function productCard(product) {
  const wished = getWishlist().includes(product.id);
  return `<article class="product-card">
    <img src="${product.image}" alt="${product.name}" loading="lazy" />
    <div class="product-content">
      <div class="meta"><span class="badge">${product.tag}</span><span class="rating">${"★".repeat(product.rating)}</span></div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p><strong>${formatPrice(product.price)}</strong> · <span class="stock ${product.stock ? "" : "out"}">${product.stock ? "In stock" : "Out of stock"}</span></p>
      <div class="card-actions">
        <button class="btn" onclick="addToCart('${product.id}')">Add to Cart</button>
        <button class="btn ghost" onclick="toggleWishlist('${product.id}')">${wished ? "♥" : "♡"}</button>
        <a class="btn ghost" href="product.html?id=${product.id}">Details</a>
      </div>
    </div>
  </article>`;
}

function renderFeatured() {
  const box = document.getElementById("featured-products");
  if (!box) return;
  box.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
}

function renderShop() {
  const box = document.getElementById("shop-products");
  if (!box) return;
  const s = document.getElementById("search")?.value.toLowerCase() || "";
  const c = document.getElementById("category-filter")?.value || "all";
  const sort = document.getElementById("sort-filter")?.value || "featured";
  const params = new URLSearchParams(location.search);
  const urlCategory = params.get("category");

  if (urlCategory && c === "all") document.getElementById("category-filter").value = urlCategory;
  const activeCategory = document.getElementById("category-filter")?.value || c;

  let items = PRODUCTS.filter((p) => (activeCategory === "all" ? true : p.category === activeCategory));
  items = items.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(s));

  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (sort === "popular") items.sort((a, b) => b.popular - a.popular);

  box.innerHTML = items.map(productCard).join("") || "<p>No products found.</p>";
}

function renderProductDetail() {
  const box = document.getElementById("product-detail");
  if (!box) return;
  const id = new URLSearchParams(location.search).get("id");
  const p = byId(id);
  if (!p) {
    box.innerHTML = "<p>Product not found.</p>";
    return;
  }
  const orderText = encodeURIComponent(`Hello, I'd like to order: ${p.name} (${formatPrice(p.price)}).`);
  box.innerHTML = `<div class="detail-layout"><img src="${p.image}" alt="${p.name}" /><div><span class="badge">${p.tag}</span><h1>${p.name}</h1><p class="rating">${"★".repeat(p.rating)}</p><p>${p.description}</p><h3>${formatPrice(p.price)}</h3><h4>Specifications</h4><ul>${p.specs.map((s) => `<li>${s}</li>`).join("")}</ul><div class="card-actions"><button class="btn" onclick="addToCart('${p.id}')">Add to Cart</button><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP_NUMBER}?text=${orderText}">Order Now</a></div></div></div>`;
}

function renderCart() {
  const box = document.getElementById("cart-container");
  if (!box) return;
  const cart = getCart();
  if (!cart.length) {
    box.innerHTML = '<p>Your cart is empty. <a href="shop.html">Go shopping</a>.</p>';
    return;
  }
  const rows = cart.map((item) => {
    const p = byId(item.id);
    if (!p) return "";
    return `<div class="cart-row"><strong>${p.name}</strong><span>${formatPrice(p.price)}</span><input class="qty-input" type="number" min="1" value="${item.qty}" onchange="updateQty('${item.id}', this.value)" /><strong>${formatPrice(p.price * item.qty)}</strong><button class="btn ghost" onclick="removeItem('${item.id}')">Remove</button></div>`;
  }).join("");
  const total = cart.reduce((sum, item) => {
    const p = byId(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  const messageLines = cart.map((item) => {
    const p = byId(item.id);
    return p ? `- ${p.name} x${item.qty} = ${formatPrice(p.price * item.qty)}` : "";
  }).filter(Boolean);
  const message = encodeURIComponent(`Hello, I want to place an order:\n${messageLines.join("\n")}\nTotal: ${formatPrice(total)}`);

  box.innerHTML = `${rows}<div class="cart-summary"><p><strong>Total: ${formatPrice(total)}</strong></p><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}">Checkout on WhatsApp</a></div>`;
}

function updateQty(id, qty) {
  const cart = getCart().map((item) => item.id === id ? { ...item, qty: Math.max(1, Number(qty) || 1) } : item);
  setCart(cart);
  updateCartCount();
  renderCart();
}

function removeItem(id) {
  setCart(getCart().filter((item) => item.id !== id));
  updateCartCount();
  renderCart();
}

function setupNavigation() {
  document.querySelector(".menu-toggle")?.addEventListener("click", () => {
    document.querySelector(".site-nav")?.classList.toggle("open");
  });
}

function setupFilters() {
  ["search", "category-filter", "sort-filter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderShop);
    document.getElementById(id)?.addEventListener("change", renderShop);
  });
}

function setupWhatsAppLinks() {
  document.querySelectorAll("[data-whatsapp-chat]").forEach((el) => {
    el.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  });
}

function setupFloatingButton() {
  const btn = document.querySelector(".floating-whatsapp");
  if (!btn) return;
  addEventListener("scroll", () => btn.classList.toggle("hidden", scrollY < 250));
}

function setupContactForm() {
  document.querySelector(".contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks! We will respond shortly.");
    e.target.reset();
  });
}

function boot() {
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
  setupNavigation();
  setupFilters();
  setupWhatsAppLinks();
  setupFloatingButton();
  setupContactForm();
  renderFeatured();
  renderShop();
  renderProductDetail();
  renderCart();
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", boot);
