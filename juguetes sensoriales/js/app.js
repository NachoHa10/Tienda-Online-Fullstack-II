/* ==========================================================================
   APP.JS - LÓGICA COMPLETA DE VALIDACIONES, ACCESIBILIDAD Y DASHBOARD
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initRegisterForm();
  initLoginForm();
  initCheckoutForm();
  initAdminDashboard();
});

/* --------------------------------------------------------------------------
   1. FUNCIONES AUXILIARES DE VALIDACIÓN
   -------------------------------------------------------------------------- */

// Validar Correo Electrónico
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

// Validar RUT Chileno con Algoritmo Módulo 11
function validateRut(rutCompleto) {
  if (!rutCompleto || rutCompleto.trim() === '') return false;
  
  // Limpiar puntos y guión
  let valor = rutCompleto.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (valor.length < 8) return false;

  let cuerpo = valor.slice(0, -1);
  let dv = valor.slice(-1);

  if (!/^[0-9]+$/.test(cuerpo)) return false;

  // Calcular Dígito Verificador
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

// Formatear RUT automáticamente (Ej: 12.345.678-9)
function formatRut(rutInput) {
  let valor = rutInput.value.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (valor.length < 2) return;
  let cuerpo = valor.slice(0, -1);
  let dv = valor.slice(-1);
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  rutInput.value = `${cuerpo}-${dv}`;
}

// Mostrar u ocultar mensajes de error cerca del campo
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
   2. REGISTRO Y CHECKBOX DE TÉRMINOS (login.html)
   -------------------------------------------------------------------------- */
function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  const termsCheckbox = document.getElementById('terms-checkbox');
  const submitBtn = document.getElementById('register-submit-btn');

  if (!registerForm) return;

  // Habilitar / Deshabilitar botón según checkbox de términos
  if (termsCheckbox && submitBtn) {
    termsCheckbox.addEventListener('change', () => {
      submitBtn.disabled = !termsCheckbox.checked;
    });
  }

  // Formatear RUT automáticamente al perder el foco del input
  const rutInput = document.getElementById('reg-rut');
  if (rutInput) {
    rutInput.addEventListener('blur', () => formatRut(rutInput));
  }

  // Evento enviar formulario de registro
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Validar Nombre
    const name = document.getElementById('reg-firstname');
    if (name) {
      const isNameValid = name.value.trim().length >= 2;
      setFieldStatus(name, isNameValid, 'Ingrese un nombre válido.');
      if (!isNameValid) valid = false;
    }

    // Validar Primer Apellido
    const lastname1 = document.getElementById('reg-lastname1');
    if (lastname1) {
      const isLastnameValid = lastname1.value.trim().length >= 2;
      setFieldStatus(lastname1, isLastnameValid, 'Ingrese su primer apellido.');
      if (!isLastnameValid) valid = false;
    }

    // Validar RUT
    if (rutInput) {
      const isRutValid = validateRut(rutInput.value);
      setFieldStatus(rutInput, isRutValid, 'RUT inválido. Formato esperado: 12.345.678-9');
      if (!isRutValid) valid = false;
    }

    // Validar Email
    const email = document.getElementById('reg-email');
    if (email) {
      const isEmailValid = isValidEmail(email.value);
      setFieldStatus(email, isEmailValid, 'Ingrese un correo electrónico válido.');
      if (!isEmailValid) valid = false;
    }

    // Validar Contraseña
    const pass = document.getElementById('reg-pass');
    const passConfirm = document.getElementById('reg-pass-confirm');
    if (pass) {
      const isPassValid = pass.value.length >= 6;
      setFieldStatus(pass, isPassValid, 'La contraseña debe tener al menos 6 caracteres.');
      if (!isPassValid) valid = false;
    }

    if (passConfirm) {
      const isMatch = passConfirm.value === pass.value && passConfirm.value !== '';
      setFieldStatus(passConfirm, isMatch, 'Las contraseñas no coinciden.');
      if (!isMatch) valid = false;
    }

    if (valid) {
      alert("¡Cuenta creada exitosamente! Redirigiendo a la tienda...");
      window.location.href = "index.html";
    }
  });
}

/* --------------------------------------------------------------------------
   3. INICIO DE SESIÓN (login.html)
   -------------------------------------------------------------------------- */
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
      setFieldStatus(pass, isPassValid, 'La contraseña no puede estar vacía.');
      if (!isPassValid) valid = false;
    }

    if (valid) {
      window.location.href = "index.html";
    }
  });
}

/* --------------------------------------------------------------------------
   4. CHECKOUT Y DIRECCIÓN DE ENVÍO (carrito.html)
   -------------------------------------------------------------------------- */
function initCheckoutForm() {
  const checkoutForm = document.getElementById('checkout-form');
  if (!checkoutForm) return;

  const phoneInput = document.getElementById('ship-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      phoneInput.value = phoneInput.value.replace(/[^0-9+]/g, '');
    });
  }

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
    if (!tipo || tipo.value === '') { setFieldStatus(tipo, false, 'Seleccione un tipo de vivienda.'); valid = false; } else { setFieldStatus(tipo, true); }
    if (!comuna || comuna.value === '') { setFieldStatus(comuna, false, 'Seleccione una comuna.'); valid = false; } else { setFieldStatus(comuna, true); }
    if (!ciudad || ciudad.value.trim() === '') { setFieldStatus(ciudad, false, 'Ingrese la ciudad.'); valid = false; } else { setFieldStatus(ciudad, true); }

    if (phone) {
      const isPhoneValid = /^\+?[0-9]{8,12}$/.test(phone.value.trim());
      setFieldStatus(phone, isPhoneValid, 'Teléfono inválido (ej: +56912345678).');
      if (!isPhoneValid) valid = false;
    }

    if (valid) {
      recordPurchaseToAdmin();
      alert("¡Pago y pedido procesado exitosamente!");
      window.location.href = "pedidos.html";
    }
  });
}

// Registrar compras automáticamente en LocalStorage
function recordPurchaseToAdmin() {
  let salesData = JSON.parse(localStorage.getItem('sensori_sales')) || {
    totalRevenue: 145000,
    itemsSold: 12,
    products: {
      "Mordedor Sensorial Silicona": { qty: 8, total: 55920 },
      "Lámpara de Burbujas Calmante": { qty: 4, total: 99960 }
    }
  };

  salesData.totalRevenue += 17480;
  salesData.itemsSold += 2;
  salesData.products["Mordedor Sensorial Silicona"].qty += 2;
  salesData.products["Mordedor Sensorial Silicona"].total += 13960;

  localStorage.setItem('sensori_sales', JSON.stringify(salesData));
}

/* --------------------------------------------------------------------------
   5. DASHBOARD ADMINISTRATIVO (admin.html)
   -------------------------------------------------------------------------- */
function initAdminDashboard() {
  const statIncome = document.getElementById('stat-income');
  const statItems = document.getElementById('stat-items');
  const tableProductsBody = document.getElementById('admin-dashboard-products-body');

  if (!statIncome || !statItems) return;

  let salesData = JSON.parse(localStorage.getItem('sensori_sales'));
  if (!salesData) {
    salesData = {
      totalRevenue: 145000,
      itemsSold: 12,
      products: {
        "Mordedor Sensorial Silicona": { qty: 8, total: 55920 },
        "Lámpara de Burbujas Calmante": { qty: 4, total: 99960 }
      }
    };
    localStorage.setItem('sensori_sales', JSON.stringify(salesData));
  }

  statIncome.textContent = `$${salesData.totalRevenue.toLocaleString()}`;
  statItems.textContent = `${salesData.itemsSold} unidades`;

  if (tableProductsBody) {
    tableProductsBody.innerHTML = '';
    for (const [prodName, prodData] of Object.entries(salesData.products)) {
      tableProductsBody.innerHTML += `
        <tr>
          <td><i class="bi bi-box-seam me-2 text-primary"></i>${prodName}</td>
          <td><span class="badge bg-info text-dark">${prodData.qty} unidades</span></td>
          <td class="fw-bold">$${prodData.total.toLocaleString()}</td>
        </tr>
      `;
    }
  }
}