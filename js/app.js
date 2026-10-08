/* ==========================================================================
   APP.JS - MOTOR COMPLETO: BD LOCAL, CARRITO, DASHBOARD Y GESTIÓN
   ========================================================================== */

let prodModalInstance = null;
let userModalInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  initLocalDB();
  updateNavbarAuth();
  syncStoreStock();

  if (document.getElementById('register-form')) initRegisterForm();
  if (document.getElementById('login-form')) initLoginForm();
  if (document.getElementById('checkout-form')) initCheckoutForm();
  if (document.getElementById('cart-item-qty')) initCartCalculator();
  if (document.getElementById('card-number')) initCardNumberValidation();
  if (document.getElementById('user-orders-list')) renderUserOrders();
  if (document.getElementById('user-claims-list')) renderUserClaims();
  if (document.getElementById('admin-dashboard')) {
    initAdminDashboard();
    initAdminManager();
  }
});

/* --------------------------------------------------------------------------
   1. BASE DE DATOS LOCAL
   -------------------------------------------------------------------------- */
function initLocalDB() {
  if (!localStorage.getItem('db_products')) {
    localStorage.setItem('db_products', JSON.stringify([
      { id: 1, name: 'Mordedor Sensorial Silicona', price: 6990, stock: 10, category: 'Táctil', age: '0-3', img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&h=500&fit=crop', status: 'Activo' },
      { id: 2, name: 'Lámpara de Burbujas Calmante', price: 24990, stock: 3, category: 'Visual', age: '3-6', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&h=500&fit=crop', status: 'Activo' },
      { id: 3, name: 'Squishy Anti-Estrés Conejo Rosa', price: 4990, stock: 15, category: 'Táctil', age: '3-6', img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&h=500&fit=crop', status: 'Activo' },
      { id: 4, name: 'Squishy Sensorial Pato Amarillo', price: 4990, stock: 8, category: 'Táctil', age: '0-3', img: 'https://images.unsplash.com/photo-1559715745-e1b34a25e88f?w=500&h=500&fit=crop', status: 'Activo' },
      { id: 5, name: 'Squishy Texturizado Rana Verde', price: 5490, stock: 5, category: 'Motricidad Fina', age: '6+', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&h=500&fit=crop', status: 'Activo' }
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

  if (!localStorage.getItem('db_claims')) {
    localStorage.setItem('db_claims', JSON.stringify([]));
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
  const termsCheckbox = document.getElementById('terms-checkbox');
  const rutInput = document.getElementById('reg-rut');

  if (!registerForm) return;

  if (rutInput) {
    rutInput.addEventListener('blur', () => formatRut(rutInput));
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const firstName = document.getElementById('reg-firstname');
    if (firstName) {
      const isNameValid = firstName.value.trim().length >= 2;
      setFieldStatus(firstName, isNameValid, 'Ingrese su nombre.');
      if (!isNameValid) valid = false;
    }

    const lastName = document.getElementById('reg-lastname1');
    if (lastName) {
      const isLastNameValid = lastName.value.trim().length >= 2;
      setFieldStatus(lastName, isLastNameValid, 'Ingrese su apellido.');
      if (!isLastNameValid) valid = false;
    }

    if (rutInput) {
      const isRutValid = validateRut(rutInput.value);
      setFieldStatus(rutInput, isRutValid, 'RUT inválido. Ejemplo: 12.345.678-9');
      if (!isRutValid) valid = false;
    }

    const email = document.getElementById('reg-email');
    if (email) {
      const isEmailValid = isValidEmail(email.value);
      setFieldStatus(email, isEmailValid, 'Ingrese un correo electrónico válido.');
      if (!isEmailValid) valid = false;
    }

    const pass = document.getElementById('reg-pass');
    const passConfirm = document.getElementById('reg-pass-confirm');
    if (pass) {
      const isPassValid = pass.value.length >= 6;
      setFieldStatus(pass, isPassValid, 'Mínimo 6 caracteres.');
      if (!isPassValid) valid = false;
    }

    if (passConfirm) {
      const isMatch = passConfirm.value === pass.value && passConfirm.value !== '';
      setFieldStatus(passConfirm, isMatch, 'Las contraseñas no coinciden.');
      if (!isMatch) valid = false;
    }

    if (termsCheckbox) {
      const isTermsChecked = termsCheckbox.checked;
      let termsError = document.getElementById('terms-checkbox-error');
      if (!termsError) {
        termsError = document.createElement('div');
        termsError.id = 'terms-checkbox-error';
        termsError.className = 'error-msg';
        termsCheckbox.parentNode.appendChild(termsError);
      }

      if (!isTermsChecked) {
        termsCheckbox.classList.add('is-invalid');
        termsError.textContent = 'Debes aceptar los términos y condiciones para continuar.';
        termsError.classList.remove('d-none');
        valid = false;
      } else {
        termsCheckbox.classList.remove('is-invalid');
        termsError.textContent = '';
        termsError.classList.add('d-none');
      }
    }

    if (!valid) return;

    const fullName = firstName.value.trim() + " " + lastName.value.trim();
    const userEmail = email.value.trim();
    let users = getDB('db_users');

    if (users.find(u => u.email === userEmail)) {
      setFieldStatus(email, false, 'Este correo ya está registrado.');
      return;
    }

    const newUser = { id: Date.now(), name: fullName, rut: rutInput ? rutInput.value : '', email: userEmail, pass: pass.value, role: 'cliente' };
    users.push(newUser);
    setDB('db_users', users);
    setDB('current_user', newUser);

    alert("¡Cuenta creada exitosamente!");
    window.location.href = "perfil.html";
  });
}

function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

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
   4. CARRITO, CHECKOUT Y VALIDACIÓN DE TARJETA (16 DÍGITOS REALES)
   -------------------------------------------------------------------------- */
const SHIPPING_COST = 3500;

function initCardNumberValidation() {
  const cardInput = document.getElementById('card-number');
  if (!cardInput) return;

  cardInput.addEventListener('input', (e) => {
    // Permitir solo números y agregar espacios cada 4 dígitos
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16); // Límite estricto a 16 dígitos
    
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formatted;
  });
}

function initCartCalculator() {
  const qtyInput = document.getElementById('cart-item-qty');
  if (!qtyInput) return;

  qtyInput.addEventListener('input', () => {
    let qty = parseInt(qtyInput.value);
    const products = getDB('db_products');
    const targetProduct = products.find(p => p.id === 1);
    
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

      // Validar 16 dígitos de la tarjeta
      const cardInput = document.getElementById('card-number');
      if (cardInput) {
        const rawDigits = cardInput.value.replace(/\s+/g, '');
        if (rawDigits.length !== 16) {
          alert("El número de tarjeta debe tener exactamente 16 dígitos.");
          cardInput.focus();
          return;
        }
      }

      const qty = parseInt(document.getElementById('cart-item-qty').value);
      let products = getDB('db_products');
      let prodIndex = products.findIndex(p => p.id === 1);

      if (qty > products[prodIndex].stock) {
        alert("Stock insuficiente."); return;
      }

      products[prodIndex].stock -= qty;
      setDB('db_products', products);

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
      window.location.href = "pedidos.html";
    });
  }
}

/* --------------------------------------------------------------------------
   5. DASHBOARD ADMIN (SIN MEDIOS DE PAGO)
   -------------------------------------------------------------------------- */
function initAdminDashboard() {
  const users = getDB('db_users');
  const products = getDB('db_products');
  const orders = getDB('db_orders');

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

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) => sum + order.qty, 0);
  
  if(document.getElementById('stat-income')) document.getElementById('stat-income').textContent = `$${totalRevenue.toLocaleString('es-CL')}`;
  if(document.getElementById('stat-items')) document.getElementById('stat-items').textContent = `${totalItems} unidades`;

  renderAdminCharts(totalRevenue, orders);
}

function renderAdminCharts(realRevenue, orders) {
  if (typeof Chart === 'undefined') return;

  let itemsSold = {'Mordedor Sensorial Silicona': 0, 'Lámpara de Burbujas Calmante': 0};
  orders.forEach(o => { if (itemsSold[o.product] !== undefined) itemsSold[o.product] += o.qty; });

  // 1. Evolución de Ingresos
  const ctx1 = document.getElementById('chartSalesTimeline');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (Hoy)'],
        datasets: [{
          label: 'Ingresos ($)',
          data: [0, 0, 0, realRevenue],
          borderColor: '#16498C', backgroundColor: 'rgba(95, 148, 217, 0.25)', fill: true, tension: 0.35
        }]
      }, options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Ventas por Categoría
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

  // 3. Top Productos Más Vendidos
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
   6. GESTIÓN ADMINISTRATIVA
   -------------------------------------------------------------------------- */
function initAdminManager() {
  const prodModalEl = document.getElementById('productModal');
  if (prodModalEl) prodModalInstance = new bootstrap.Modal(prodModalEl);

  const btnAddProduct = document.getElementById('btn-open-add-product');
  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => {
      document.getElementById('modalProductTitle').innerText = 'Agregar Nuevo Producto';
      document.getElementById('editProdRowId').value = '';
      document.getElementById('productForm').reset();
      prodModalInstance.show();
    });
  }

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
      initAdminDashboard();
    });
  }

  document.addEventListener('click', (e) => {
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

    const btnToggleProd = e.target.closest('.btn-toggle-prod');
    if (btnToggleProd) {
      const id = btnToggleProd.getAttribute('data-id');
      let products = getDB('db_products');
      let p = products.find(prod => prod.id == id);
      if(p) { p.status = p.status === 'Activo' ? 'Inactivo' : 'Activo'; setDB('db_products', products); initAdminDashboard(); }
    }

    const btnDelProd = e.target.closest('.btn-delete-prod');
    if (btnDelProd && confirm("¿Eliminar este producto?")) {
      const id = btnDelProd.getAttribute('data-id');
      setDB('db_products', getDB('db_products').filter(p => p.id != id));
      initAdminDashboard();
    }

    const btnDelUser = e.target.closest('.btn-delete-user');
    if (btnDelUser && confirm("¿Eliminar usuario?")) {
      const id = btnDelUser.getAttribute('data-id');
      setDB('db_users', getDB('db_users').filter(u => u.id != id));
      initAdminDashboard();
    }
  });
}

/* --------------------------------------------------------------------------
   7. SINCRONIZACIÓN DE LA TIENDA Y VISTAS DE USUARIO
   -------------------------------------------------------------------------- */
function syncStoreStock() {
  const products = getDB('db_products');
  
  products.forEach(p => {
    const card = document.getElementById(`store-prod-${p.id}`);
    if (card) {
      const badgeContainer = card.querySelector('.stock-badge-container');
      const addBtn = card.querySelector('.btn-agregar');
      
      if (badgeContainer) {
        if (p.stock <= 0) {
          badgeContainer.innerHTML = `<span class="badge bg-danger rounded-pill">Agotado (0)</span>`;
        } else if (p.stock <= 5) {
          badgeContainer.innerHTML = `<span class="badge bg-warning text-dark rounded-pill">Bajo Stock (${p.stock})</span>`;
        } else {
          badgeContainer.innerHTML = `<span class="badge bg-success rounded-pill">Disponible (${p.stock})</span>`;
        }
      }
      
      if (addBtn) {
        if (p.stock <= 0) {
          addBtn.disabled = true;
          addBtn.classList.replace('btn-orange', 'btn-secondary');
          addBtn.textContent = 'Sin Stock';
        } else {
          addBtn.disabled = false;
          addBtn.classList.replace('btn-secondary', 'btn-orange');
          addBtn.textContent = 'Agregar';
        }
      }
    }
  });
}

function renderUserOrders() {
  const container = document.getElementById('user-orders-list');
  if (!container) return;

  const currentUser = getDB('current_user');
  const allOrders = getDB('db_orders');

  if (!currentUser) {
    container.innerHTML = `
      <div class="alert alert-warning text-center rounded-4 p-4">
        <i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
        Debes iniciar sesión para consultar tus pedidos.
      </div>`;
    return;
  }

  const userOrders = allOrders.filter(o => o.email === currentUser.email);

  if (userOrders.length === 0) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
        <i class="bi bi-bag-x text-muted fs-1 mb-3"></i>
        <h5 class="fw-bold text-muted">Aún no has realizado ninguna compra</h5>
        <p class="small text-muted mb-3">Tus compras aparecerán reflejadas aquí una vez que las completes.</p>
        <div>
          <a href="index.html" class="btn btn-orange btn-sm px-4 fw-bold text-white">Explorar Catálogo</a>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = userOrders.map(o => `
    <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <h5 class="fw-bold mb-0" style="color: var(--color-blue-dark);">Pedido ${o.id} <span class="badge bg-info text-dark ms-2 fw-normal fs-6">En Preparación</span></h5>
        <h4 class="fw-bold mb-0 text-primary">$${o.total.toLocaleString('es-CL')}</h4>
      </div>
      <p class="small text-muted mb-1"><i class="bi bi-calendar3 me-1"></i>Fecha: ${o.date}</p>
      <p class="small text-muted mb-3"><i class="bi bi-box me-1"></i>Ítems: ${o.qty}x ${o.product}</p>
      <div class="d-flex gap-2 justify-content-end">
        <a href="reclamos.html" class="btn btn-sm btn-outline-primary"><i class="bi bi-exclamation-circle me-1"></i>Reportar / Reclamo</a>
      </div>
    </div>
  `).join('');
}

function renderUserClaims() {
  const container = document.getElementById('user-claims-list');
  if (!container) return;

  const claimForm = document.getElementById('claim-form');
  const currentUser = getDB('current_user');
  let claims = getDB('db_claims');

  if (claimForm) {
    claimForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) {
        alert("Debes iniciar sesión para registrar un reclamo."); return;
      }
      const newClaim = {
        id: `#T${Math.floor(100 + Math.random() * 900)}`,
        orderId: document.getElementById('claim-order-id').value,
        type: document.getElementById('claim-type').value,
        detail: document.getElementById('claim-detail').value,
        userEmail: currentUser.email,
        status: 'En Revisión'
      };
      claims.push(newClaim);
      setDB('db_claims', claims);
      alert("Reclamo enviado exitosamente.");
      claimForm.reset();
      renderUserClaims();
    });
  }

  if (!currentUser) {
    container.innerHTML = `<p class="text-muted small text-center my-4">Inicia sesión para ver tu historial de reclamos.</p>`;
    return;
  }

  const userClaims = claims.filter(c => c.userEmail === currentUser.email);

  if (userClaims.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-shield-check fs-1 d-block mb-2"></i>
        <p class="small mb-0">No tienes reclamos ni solicitudes de reembolso registradas.</p>
      </div>`;
    return;
  }

  container.innerHTML = userClaims.map(c => `
    <div class="border-start border-4 border-warning bg-light p-3 rounded-3 mb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h6 class="fw-bold mb-0">Ticket ${c.id} (Pedido ${c.orderId})</h6>
        <span class="badge bg-warning text-dark">${c.status}</span>
      </div>
      <p class="small text-muted mb-1"><strong>Tipo:</strong> ${c.type}</p>
      <p class="small mb-0 text-secondary">"${c.detail}"</p>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   8. FUNCIONES AUXILIARES DE VALIDACIÓN
   -------------------------------------------------------------------------- */
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).toLowerCase());
}

function validateRut(rutCompleto) {
  if (!rutCompleto || rutCompleto.trim() === '') return false;
  let valor = rutCompleto.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (valor.length < 8) return false;

  let cuerpo = valor.slice(0, -1);
  let dv = valor.slice(-1);
  if (!/^[0-9]+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
    let index = multiplo * valor.charAt(cuerpo.length - i);
    suma += index;
    if (multiplo < 7) { multiplo += 1; } else { multiplo = 2; }
  }

  let dvEsperado = 11 - (suma % 11);
  let dvCalc = (dvEsperado === 11) ? '0' : (dvEsperado === 10) ? 'K' : dvEsperado.toString();

  return dv === dvCalc;
}

function formatRut(rutInput) {
  let valor = rutInput.value.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (valor.length < 2) return;
  let cuerpo = valor.slice(0, -1);
  let dv = valor.slice(-1);
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  rutInput.value = `${cuerpo}-${dv}`;
}

function setFieldStatus(inputElement, isValid, errorMessage = '') {
  if (!inputElement) return;

  let errorContainer = document.getElementById(`${inputElement.id}-error`);

  if (!errorContainer) {
    errorContainer = inputElement.parentNode.querySelector('.error-msg');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-msg';
      inputElement.parentNode.appendChild(errorContainer);
    }
  }

  if (isValid) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
    errorContainer.textContent = '';
    errorContainer.classList.add('d-none');
  } else {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
    errorContainer.textContent = errorMessage;
    errorContainer.classList.remove('d-none');
  }
}