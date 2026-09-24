/* ==========================================================================
   APP.JS - MOTOR COMPLETO: BD LOCAL, CARRITO, DASHBOARD Y GESTIÓN
   ========================================================================== */

let prodModalInstance = null;
let userModalInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  initLocalDB();
  updateNavbarAuth();
  syncStoreStock(); // <--- AGREGA ESTA LÍNEA AQUÍ

  if (document.getElementById('register-form')) initRegisterForm();
  if (document.getElementById('login-form')) initLoginForm();
  if (document.getElementById('checkout-form')) initCheckoutForm();
  if (document.getElementById('cart-item-qty')) initCartCalculator();
  if (document.getElementById('admin-dashboard')) {
    initAdminDashboard();
    initAdminManager();
  }
});

/* --------------------------------------------------------------------------
   1. BASE DE DATOS LOCAL (SIMULACIÓN DE BACKEND)
   -------------------------------------------------------------------------- */
function initLocalDB() {
  if (!localStorage.getItem('db_products')) {
    localStorage.setItem('db_products', JSON.stringify([
      { id: 1, name: 'Mordedor Sensorial Silicona', price: 6990, stock: 10, status: 'Activo' },
      { id: 2, name: 'Lámpara de Burbujas Calmante', price: 24990, stock: 3, status: 'Activo' }
    ]));
  }
  if (!localStorage.getItem('db_users')) {
    localStorage.setItem('db_users', JSON.stringify([
      { id: 1, name: 'Administrador Principal', rut: '11.111.111-1', email: 'admin@sensoritoys.cl', pass: 'admin123', role: 'admin' }
    ]));
  }
  if (!localStorage.getItem('db_orders')) {
    localStorage.setItem('db_orders', JSON.stringify([]));
  }
}

function getDB(table) { return JSON.parse(localStorage.getItem(table)) || []; }
function setDB(table, data) { localStorage.setItem(table, JSON.stringify(data)); }

/* --------------------------------------------------------------------------
   2. NAVBAR Y SESIÓN
   -------------------------------------------------------------------------- */
function updateNavbarAuth() {
  const currentUser = getDB('current_user');
  const userBtnContainer = document.querySelector('.btn-user-icon')?.parentElement;
  
  if (currentUser && Object.keys(currentUser).length > 0 && userBtnContainer) {
    userBtnContainer.innerHTML = `
      <div class="dropdown">
        <a href="#" class="btn-user-icon text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" style="background-color: var(--color-blue-light);">
          <i class="bi bi-person-check-fill fs-5"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
          <li><h6 class="dropdown-header">Hola, ${currentUser.name.split(' ')[0]}</h6></li>
          <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-person-vcard me-2"></i>Mi Perfil</a></li>
          ${currentUser.role === 'admin' ? `<li><a class="dropdown-item text-danger" href="admin.html"><i class="bi bi-shield-lock me-2"></i>Panel Admin</a></li>` : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="btn-logout"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a></li>
        </ul>
      </div>
    `;

    document.getElementById('btn-logout').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('current_user');
      window.location.href = 'index.html';
    });
  }
}

/* --------------------------------------------------------------------------
   3. REGISTRO Y LOGIN
   -------------------------------------------------------------------------- */
function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!document.getElementById('terms-checkbox').checked) {
      alert("Debes aceptar los términos y condiciones."); return;
    }

    const name = document.getElementById('reg-firstname').value.trim() + " " + document.getElementById('reg-lastname1').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    
    let users = getDB('db_users');
    if (users.find(u => u.email === email)) {
      alert("Este correo ya está registrado."); return;
    }

    const newUser = { id: Date.now(), name: name, rut: document.getElementById('reg-rut').value, email: email, pass: document.getElementById('reg-pass').value, role: 'cliente' };
    users.push(newUser);
    setDB('db_users', users);
    setDB('current_user', newUser); // Auto-login
    alert("¡Cuenta creada exitosamente!");
    window.location.href = "perfil.html";
  });
}

function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    
    const users = getDB('db_users');
    const user = users.find(u => u.email === email && u.pass === pass);

    if (user) {
      setDB('current_user', user);
      window.location.href = user.role === 'admin' ? "admin.html" : "perfil.html";
    } else {
      alert("Credenciales incorrectas.");
    }
  });
}

/* --------------------------------------------------------------------------
   4. CARRITO Y CHECKOUT (CONTROL DE STOCK REAL)
   -------------------------------------------------------------------------- */
const SHIPPING_COST = 3500;

function initCartCalculator() {
  const qtyInput = document.getElementById('cart-item-qty');
  qtyInput.addEventListener('input', () => {
    let qty = parseInt(qtyInput.value);
    const products = getDB('db_products');
    const targetProduct = products.find(p => p.id === 1); // Producto demo ID 1
    
    if (qty > targetProduct.stock) {
      alert(`Solo quedan ${targetProduct.stock} unidades en stock.`);
      qtyInput.value = targetProduct.stock;
      qty = targetProduct.stock;
    }
    if (isNaN(qty) || qty < 1) qty = 1;
    
    const subtotal = qty * targetProduct.price;
    const total = subtotal + SHIPPING_COST;

    if(document.getElementById('cart-item-subtotal')) document.getElementById('cart-item-subtotal').textContent = `$${subtotal.toLocaleString('es-CL')}`;
    if(document.getElementById('summary-subtotal')) document.getElementById('summary-subtotal').textContent = `$${subtotal.toLocaleString('es-CL')}`;
    if(document.getElementById('summary-total')) document.getElementById('summary-total').textContent = `$${total.toLocaleString('es-CL')}`;
    if(document.getElementById('modal-total-display')) document.getElementById('modal-total-display').textContent = `$${total.toLocaleString('es-CL')}`;
  });
}

function initCheckoutForm() {
  const paymentForm = document.getElementById('payment-form');
  const checkoutForm = document.getElementById('checkout-form');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
      modal.show();
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = getDB('current_user');
      
      if (!currentUser || Object.keys(currentUser).length === 0) {
        alert("Debes iniciar sesión para comprar.");
        window.location.href = "login.html";
        return;
      }

      const qty = parseInt(document.getElementById('cart-item-qty').value);
      let products = getDB('db_products');
      let prodIndex = products.findIndex(p => p.id === 1);

      if (qty > products[prodIndex].stock) {
        alert("Stock insuficiente."); return;
      }

      // Descontar Stock
      products[prodIndex].stock -= qty;
      setDB('db_products', products);

      // Registrar Pedido
      let orders = getDB('db_orders');
      orders.push({
        id: `#${1000 + orders.length + 1}`,
        user: currentUser.name,
        email: currentUser.email,
        product: products[prodIndex].name,
        qty: qty,
        total: (qty * products[prodIndex].price) + SHIPPING_COST,
        date: new Date().toLocaleDateString()
      });
      setDB('db_orders', orders);

      alert("¡Pago exitoso! El stock ha sido descontado.");
      window.location.href = "index.html";
    });
  }
}

/* --------------------------------------------------------------------------
   5. DASHBOARD ADMIN (TABLAS Y GRÁFICOS RESTAURADOS)
   -------------------------------------------------------------------------- */
function initAdminDashboard() {
  const users = getDB('db_users');
  const products = getDB('db_products');
  const orders = getDB('db_orders');

  // Llenar Usuarios
  const usersTbody = document.querySelector('#usersTable tbody');
  if (usersTbody) {
    usersTbody.innerHTML = users.map(u => `
      <tr id="user-${u.id}">
        <td><div class="fw-bold">${u.name}</div></td>
        <td>${u.rut}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-info text-dark'}">${u.role.toUpperCase()}</span></td>
        <td class="text-center">
          ${u.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${u.id}" title="Eliminar"><i class="bi bi-trash-fill"></i></button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  // Llenar Productos
  const productsTbody = document.querySelector('#productsTable tbody');
  if (productsTbody) {
    productsTbody.innerHTML = products.map(p => `
      <tr id="prod-${p.id}" style="opacity: ${p.status === 'Inactivo' ? '0.5' : '1'}">
        <td>${p.id}</td>
        <td class="fw-bold prod-name">${p.name}</td>
        <td class="prod-price">$${p.price.toLocaleString('es-CL')}</td>
        <td class="fw-bold prod-stock ${p.stock <= 3 ? 'text-danger' : 'text-primary'}">${p.stock} un.</td>
        <td><span class="badge ${p.stock > 0 ? 'bg-success' : 'bg-danger'}">${p.stock > 0 ? 'Disponible' : 'Agotado'}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary me-1 btn-edit-prod" data-id="${p.id}"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn btn-sm btn-warning me-1 text-dark btn-toggle-prod" data-id="${p.id}"><i class="bi bi-power"></i></button>
          <button class="btn btn-sm btn-outline-danger btn-delete-prod" data-id="${p.id}"><i class="bi bi-trash-fill"></i></button>
        </td>
      </tr>
    `).join('');
  }

  // Llenar Pedidos
  const ordersTbody = document.querySelector('#admin-pedidos tbody');
  if (ordersTbody && orders.length > 0) {
    ordersTbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.user}</td>
        <td>${o.qty}x ${o.product}</td>
        <td class="fw-bold" style="color: var(--color-blue-dark);">$${o.total.toLocaleString('es-CL')}</td>
        <td><span class="badge bg-success">Aprobado</span></td>
      </tr>
    `).join('');
  }

  // KPIs
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) => sum + order.qty, 0);
  
  if(document.getElementById('stat-income')) document.getElementById('stat-income').textContent = `$${(1679320 + totalRevenue).toLocaleString('es-CL')}`;
  if(document.getElementById('stat-items')) document.getElementById('stat-items').textContent = `${230 + totalItems} unidades`;

  renderAdminCharts(totalRevenue, orders);
}

function renderAdminCharts(realRevenue, orders) {
  if (typeof Chart === 'undefined') return;

  let itemsSold = {'Mordedor Sensorial Silicona': 180, 'Lámpara de Burbujas Calmante': 50};
  orders.forEach(o => { if (itemsSold[o.product] !== undefined) itemsSold[o.product] += o.qty; });

  // 1. Evolución (Línea)
  const ctx1 = document.getElementById('chartSalesTimeline');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (Hoy)'],
        datasets: [{
          label: 'Ingresos ($)',
          data: [35000, 48000, 62000, 1679320 + realRevenue],
          borderColor: '#16498C', backgroundColor: 'rgba(95, 148, 217, 0.25)', fill: true, tension: 0.35
        }]
      }, options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Categorías (Doughnut)
  const ctx2 = document.getElementById('chartCategories');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Estimulación Táctil', 'Lámparas/Visual', 'Motricidad Fina'],
        datasets: [{ data: [55, 35, 10], backgroundColor: ['#5F94D9', '#F2EA79', '#F2845C'] }]
      }, options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 3. Top Productos (Bar)
  const ctx3 = document.getElementById('chartTopProducts');
  if (ctx3) {
    new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: ['Mordedor Sensorial', 'Lámpara Burbujas'],
        datasets: [{
          label: 'Unidades Vendidas',
          data: [itemsSold['Mordedor Sensorial Silicona'], itemsSold['Lámpara de Burbujas Calmante']],
          backgroundColor: ['#5F94D9', '#F2845C'], borderRadius: 8
        }]
      }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
    });
  }
}

/* --------------------------------------------------------------------------
   6. GESTIÓN ADMINISTRATIVA (CRUD DE PRODUCTOS Y USUARIOS)
   -------------------------------------------------------------------------- */
function initAdminManager() {
  const prodModalEl = document.getElementById('productModal');
  if (prodModalEl) prodModalInstance = new bootstrap.Modal(prodModalEl);

  // Agregar Producto
  const btnAddProduct = document.getElementById('btn-open-add-product');
  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => {
      document.getElementById('modalProductTitle').innerText = 'Agregar Nuevo Producto';
      document.getElementById('editProdRowId').value = '';
      document.getElementById('productForm').reset();
      prodModalInstance.show();
    });
  }

  // Guardar Producto
  const btnSaveProduct = document.getElementById('btn-save-product');
  if (btnSaveProduct) {
    btnSaveProduct.addEventListener('click', () => {
      const id = document.getElementById('editProdRowId').value;
      const name = document.getElementById('editProdName').value;
      const price = parseInt(document.getElementById('editProdPrice').value);
      const stock = parseInt(document.getElementById('editProdStock').value);
      
      let products = getDB('db_products');
      if (id) {
        let p = products.find(prod => prod.id == id);
        if(p) { p.name = name; p.price = price; p.stock = stock; }
      } else {
        products.push({ id: Date.now(), name, price, stock, status: 'Activo' });
      }
      setDB('db_products', products);
      prodModalInstance.hide();
      initAdminDashboard(); // Recargar tabla
    });
  }

  // Delegación de eventos (Editar/Eliminar)
  document.addEventListener('click', (e) => {
    // Editar Prod
    const btnEditProd = e.target.closest('.btn-edit-prod');
    if (btnEditProd) {
      const id = btnEditProd.getAttribute('data-id');
      const p = getDB('db_products').find(prod => prod.id == id);
      if(p) {
        document.getElementById('modalProductTitle').innerText = 'Editar Producto';
        document.getElementById('editProdRowId').value = p.id;
        document.getElementById('editProdName').value = p.name;
        document.getElementById('editProdPrice').value = p.price;
        document.getElementById('editProdStock').value = p.stock;
        prodModalInstance.show();
      }
    }

    // Toggle Prod
    const btnToggleProd = e.target.closest('.btn-toggle-prod');
    if (btnToggleProd) {
      const id = btnToggleProd.getAttribute('data-id');
      let products = getDB('db_products');
      let p = products.find(prod => prod.id == id);
      if(p) { p.status = p.status === 'Activo' ? 'Inactivo' : 'Activo'; setDB('db_products', products); initAdminDashboard(); }
    }

    // Eliminar Prod
    const btnDelProd = e.target.closest('.btn-delete-prod');
    if (btnDelProd && confirm("¿Eliminar este producto?")) {
      const id = btnDelProd.getAttribute('data-id');
      setDB('db_products', getDB('db_products').filter(p => p.id != id));
      initAdminDashboard();
    }

    // Eliminar Usuario (Solo clientes)
    const btnDelUser = e.target.closest('.btn-delete-user');
    if (btnDelUser && confirm("¿Eliminar usuario?")) {
      const id = btnDelUser.getAttribute('data-id');
      setDB('db_users', getDB('db_users').filter(u => u.id != id));
      initAdminDashboard();
    }
  });
}
/* --------------------------------------------------------------------------
   7. SINCRONIZACIÓN DEL CATÁLOGO DE LA TIENDA (INDEX.HTML)
   -------------------------------------------------------------------------- */
function syncStoreStock() {
  const products = getDB('db_products');
  
  products.forEach(p => {
    // Buscar la tarjeta del producto por su ID
    const card = document.getElementById(`store-prod-${p.id}`);
    
    if (card) {
      const badgeContainer = card.querySelector('.stock-badge-container');
      const addBtn = card.querySelector('.btn-agregar');
      
      // 1. Actualizar el texto y color de la etiqueta (Badge)
      if (badgeContainer) {
        if (p.stock <= 0) {
          badgeContainer.innerHTML = `<span class="badge bg-danger rounded-pill">Agotado (0)</span>`;
        } else if (p.stock <= 5) {
          badgeContainer.innerHTML = `<span class="badge bg-warning text-dark rounded-pill">Bajo Stock (${p.stock})</span>`;
        } else {
          badgeContainer.innerHTML = `<span class="badge bg-success rounded-pill">Disponible (${p.stock})</span>`;
        }
      }
      
      // 2. Bloquear el botón de "Agregar" si no hay stock
      if (addBtn) {
        if (p.stock <= 0) {
          addBtn.disabled = true;
          addBtn.classList.replace('btn-orange', 'btn-secondary'); // Cambia a gris
          addBtn.textContent = 'Sin Stock';
        } else {
          addBtn.disabled = false;
          addBtn.classList.replace('btn-secondary', 'btn-orange'); // Vuelve a naranjo
          addBtn.textContent = 'Agregar';
        }
      }
    }
  });
}