/* ==========================================================================
   APP.JS - LÓGICA CON VALIDACIÓN DE LUHN, EXPIRACIÓN REAL Y TOOLTIPS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Tooltips sutiles de Bootstrap para el botón de usuario
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

  initRegisterForm();
  initLoginForm();
  initCheckoutForm();
  initCartCalculator();
  initAdminDashboard();
});

/* --------------------------------------------------------------------------
   1. CALCULADORA DINÁMICA DE CARRITO
   -------------------------------------------------------------------------- */
const UNIT_PRICE = 6990;
const SHIPPING_COST = 3500;

function initCartCalculator() {
  const qtyInput = document.getElementById('cart-item-qty');
  if (!qtyInput) return;

  qtyInput.addEventListener('input', updateCartTotals);
  qtyInput.addEventListener('change', updateCartTotals);
  updateCartTotals();
}

function updateCartTotals() {
  const qtyInput = document.getElementById('cart-item-qty');
  if (!qtyInput) return;

  let qty = parseInt(qtyInput.value);
  if (isNaN(qty) || qty < 1) qty = 1;

  const subtotal = qty * UNIT_PRICE;
  const total = subtotal + SHIPPING_COST;

  const itemSubtotalEl = document.getElementById('cart-item-subtotal');
  const summarySubtotalEl = document.getElementById('summary-subtotal');
  const summaryTotalEl = document.getElementById('summary-total');
  const modalTotalEl = document.getElementById('modal-total-display');

  if (itemSubtotalEl) itemSubtotalEl.textContent = `$${subtotal.toLocaleString()}`;
  if (summarySubtotalEl) summarySubtotalEl.textContent = `$${subtotal.toLocaleString()}`;
  if (summaryTotalEl) summaryTotalEl.textContent = `$${total.toLocaleString()}`;
  if (modalTotalEl) modalTotalEl.textContent = `$${total.toLocaleString()}`;
}

/* --------------------------------------------------------------------------
   2. VALIDACIONES DE TARJETA Y FECHA DE EXPIRACIÓN (ALGORITMO DE LUHN)
   -------------------------------------------------------------------------- */

// Algoritmo de Luhn para número de tarjeta válido
function isValidLuhn(cardNumber) {
  let cleanNum = cardNumber.replace(/\D/g, '');
  if (cleanNum.length < 13 || cleanNum.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (sum % 10) === 0;
}

// Validar que la fecha de expiración NO esté vencida
function isFutureCardDate(expString) {
  if (!/^\d{2}\/\d{2}$/.test(expString.trim())) return false;

  const parts = expString.split('/');
  const month = parseInt(parts[0], 10);
  const year = parseInt("20" + parts[1], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

function setFieldStatus(inputElement, isValid, errorMessage = '') {
  if (!inputElement) return;
  const errorContainer = document.getElementById(`${inputElement.id}-error`);
  if (isValid) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.classList.add('d-none');
    }
  } else {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
    if (errorContainer) {
      errorContainer.textContent = errorMessage;
      errorContainer.classList.remove('d-none');
    }
  }
}

/* --------------------------------------------------------------------------
   3. CHECKOUT Y PASARELA DE PAGO
   -------------------------------------------------------------------------- */
function initCheckoutForm() {
  const checkoutForm = document.getElementById('checkout-form');
  const paymentForm = document.getElementById('payment-form');

  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const calle = document.getElementById('ship-street');
    const num = document.getElementById('ship-number');
    const tipo = document.getElementById('ship-housing');
    const comuna = document.getElementById('ship-comuna');
    const ciudad = document.getElementById('ship-city');
    const phone = document.getElementById('ship-phone');

    if (!calle || calle.value.trim() === '') { setFieldStatus(calle, false, 'Ingrese la calle.'); valid = false; } else { setFieldStatus(calle, true); }
    if (!num || num.value.trim() === '') { setFieldStatus(num, false, 'Ingrese el número.'); valid = false; } else { setFieldStatus(num, true); }
    if (!tipo || tipo.value === '') { setFieldStatus(tipo, false, 'Seleccione tipo de vivienda.'); valid = false; } else { setFieldStatus(tipo, true); }
    if (!comuna || comuna.value === '') { setFieldStatus(comuna, false, 'Seleccione una comuna.'); valid = false; } else { setFieldStatus(comuna, true); }
    if (!ciudad || ciudad.value.trim() === '') { setFieldStatus(ciudad, false, 'Ingrese la ciudad.'); valid = false; } else { setFieldStatus(ciudad, true); }

    if (phone) {
      const isPhoneValid = /^\+?[0-9]{8,12}$/.test(phone.value.trim());
      setFieldStatus(phone, isPhoneValid, 'Teléfono inválido.');
      if (!isPhoneValid) valid = false;
    }

    if (valid) {
      const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
      paymentModal.show();
    }
  });

  if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let cardValid = true;

      const cardNum = document.getElementById('card-number');
      const cardHolder = document.getElementById('card-holder');
      const cardExp = document.getElementById('card-exp');
      const cardCvc = document.getElementById('card-cvc');

      // Validar Número de Tarjeta con Luhn
      if (!cardNum || !isValidLuhn(cardNum.value)) {
        setFieldStatus(cardNum, false, 'Número de tarjeta inválido (falla de verificación).');
        cardValid = false;
      } else { setFieldStatus(cardNum, true); }

      // Validar Titular
      if (!cardHolder || cardHolder.value.trim().length < 3) {
        setFieldStatus(cardHolder, false, 'Ingrese el nombre del titular.');
        cardValid = false;
      } else { setFieldStatus(cardHolder, true); }

      // Validar Expiración No Vencida
      if (!cardExp || !isFutureCardDate(cardExp.value)) {
        setFieldStatus(cardExp, false, 'Tarjeta vencida o fecha inválida (MM/AA).');
        cardValid = false;
      } else { setFieldStatus(cardExp, true); }

      // Validar CVC (3 a 4 dígitos)
      if (!cardCvc || !/^\d{3,4}$/.test(cardCvc.value.trim())) {
        setFieldStatus(cardCvc, false, 'CVC inválido (debe tener 3 o 4 números).');
        cardValid = false;
      } else { setFieldStatus(cardCvc, true); }

      if (cardValid) {
        recordPurchaseToAdmin();
        alert("¡Pago autorizado con éxito! La venta se ha enviado al Dashboard.");
        window.location.href = "pedidos.html";
      }
    });
  }
}

function recordPurchaseToAdmin() {
  const qtyInput = document.getElementById('cart-item-qty');
  let qtyBought = parseInt(qtyInput ? qtyInput.value : 2);
  if (isNaN(qtyBought) || qtyBought < 1) qtyBought = 1;

  const totalSpent = (qtyBought * UNIT_PRICE) + SHIPPING_COST;

  let salesData = JSON.parse(localStorage.getItem('sensori_sales')) || {
    totalRevenue: 145000,
    todayRevenue: 0,
    itemsSold: 12,
    products: {
      "Mordedor Sensorial Silicona": { qty: 8, total: 55920 },
      "Lámpara de Burbujas Calmante": { qty: 4, total: 99960 }
    }
  };

  salesData.totalRevenue += totalSpent;
  salesData.todayRevenue += totalSpent;
  salesData.itemsSold += qtyBought;

  if (!salesData.products["Mordedor Sensorial Silicona"]) {
    salesData.products["Mordedor Sensorial Silicona"] = { qty: 0, total: 0 };
  }

  salesData.products["Mordedor Sensorial Silicona"].qty += qtyBought;
  salesData.products["Mordedor Sensorial Silicona"].total += (qtyBought * UNIT_PRICE);

  localStorage.setItem('sensori_sales', JSON.stringify(salesData));
}

/* --------------------------------------------------------------------------
   4. INICIO DE SESIÓN Y REGISTRO
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

function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  const termsCheckbox = document.getElementById('terms-checkbox');
  const submitBtn = document.getElementById('register-submit-btn');

  if (!registerForm) return;

  if (termsCheckbox && submitBtn) {
    termsCheckbox.addEventListener('change', () => {
      submitBtn.disabled = !termsCheckbox.checked;
    });
  }

  const rutInput = document.getElementById('reg-rut');
  if (rutInput) {
    rutInput.addEventListener('blur', () => formatRut(rutInput));
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('reg-firstname');
    if (name) {
      const isNameValid = name.value.trim().length >= 2;
      setFieldStatus(name, isNameValid, 'Ingrese un nombre válido.');
      if (!isNameValid) valid = false;
    }

    const lastname1 = document.getElementById('reg-lastname1');
    if (lastname1) {
      const isLastnameValid = lastname1.value.trim().length >= 2;
      setFieldStatus(lastname1, isLastnameValid, 'Ingrese el primer apellido.');
      if (!isLastnameValid) valid = false;
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

    if (valid) {
      alert("¡Cuenta creada exitosamente!");
      window.location.href = "index.html";
    }
  });
}

function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email');
    const pass = document.getElementById('login-pass');
    let valid = true;

    if (email) {
      const isEmailValid = isValidEmail(email.value);
      setFieldStatus(email, isEmailValid, 'Ingrese un correo válido.');
      if (!isEmailValid) valid = false;
    }

    if (pass) {
      const isPassValid = pass.value.trim() !== '';
      setFieldStatus(pass, isPassValid, 'Ingrese su contraseña.');
      if (!isPassValid) valid = false;
    }

    if (valid) window.location.href = "index.html";
  });
}

/* --------------------------------------------------------------------------
   5. DASHBOARD ADMINISTRATIVO Y GRÁFICOS
   -------------------------------------------------------------------------- */
function initAdminDashboard() {
  const statIncome = document.getElementById('stat-income');
  if (!statIncome) return;

  let salesData = JSON.parse(localStorage.getItem('sensori_sales'));
  if (!salesData) {
    salesData = {
      totalRevenue: 162480,
      todayRevenue: 17480,
      itemsSold: 14,
      products: {
        "Mordedor Sensorial Silicona": { qty: 10, total: 69900 },
        "Lámpara de Burbujas Calmante": { qty: 4, total: 99960 }
      }
    };
    localStorage.setItem('sensori_sales', JSON.stringify(salesData));
  }

  statIncome.textContent = `$${salesData.totalRevenue.toLocaleString()}`;
  document.getElementById('stat-today').textContent = `$${salesData.todayRevenue.toLocaleString()}`;
  document.getElementById('stat-items').textContent = `${salesData.itemsSold} unidades`;

  const avgTicket = Math.round(salesData.totalRevenue / (salesData.itemsSold / 2 || 1));
  document.getElementById('stat-ticket').textContent = `$${avgTicket.toLocaleString()}`;

  const tableBody = document.getElementById('admin-dashboard-products-body');
  if (tableBody) {
    tableBody.innerHTML = '';
    for (const [prodName, prodData] of Object.entries(salesData.products)) {
      tableBody.innerHTML += `
        <tr>
          <td><i class="bi bi-box-seam me-2 text-primary"></i>${prodName}</td>
          <td><span class="badge bg-info text-dark fs-6">${prodData.qty} unidades</span></td>
          <td class="fw-bold">$${prodData.total.toLocaleString()}</td>
          <td><span class="badge bg-success">En Stock</span></td>
        </tr>
      `;
    }
  }

  renderAdminCharts(salesData);
}

function renderAdminCharts(salesData) {
  if (typeof Chart === 'undefined') return;

  ['chartSalesTimeline', 'chartCategories', 'chartTopProducts', 'chartPaymentMethods'].forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) chartInstance.destroy();
    }
  });

  const ctx1 = document.getElementById('chartSalesTimeline');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (Hoy)'],
        datasets: [{
          label: 'Ingresos ($)',
          data: [35000, 48000, 62000, salesData.totalRevenue],
          borderColor: '#7bc9ff',
          backgroundColor: 'rgba(123, 201, 255, 0.25)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx2 = document.getElementById('chartCategories');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Estimulación Táctil', 'Lámparas/Visual', 'Motricidad Fina'],
        datasets: [{
          data: [55, 35, 10],
          backgroundColor: ['#a8e6cf', '#9bd3dd', '#ffd3b6']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx3 = document.getElementById('chartTopProducts');
  if (ctx3) {
    const prodNames = Object.keys(salesData.products);
    const prodQtys = prodNames.map(k => salesData.products[k].qty);

    new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: prodNames,
        datasets: [{
          label: 'Unidades Vendidas',
          data: prodQtys,
          backgroundColor: ['#7bc9ff', '#9bd3dd']
        }]
      },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx4 = document.getElementById('chartPaymentMethods');
  if (ctx4) {
    new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: ['Tarjeta Débito/Crédito', 'Transferencia Bancaria'],
        datasets: [{
          label: 'Transacciones',
          data: [10, 4],
          backgroundColor: ['#ffaaa5', '#d4a5d9']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}