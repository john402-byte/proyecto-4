// ================= ESTADO GLOBAL =================
let vehiclesData = [];
let cart = [];
let selectedVehicleForCart = null;

// ================= CONSTANTES DOM =================
const productsContainer = document.getElementById('productsContainer');
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    setupEventListeners();
    runTests(); // Ejecutar bloque de testing automatizado
});

// ================= FETCH Y RENDERIZADO =================
async function loadVehicles() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
        if (!response.ok) throw new Error('Error al cargar la base de datos de vehículos.');
        
        vehiclesData = await response.json();
        loadingSpinner.classList.add('d-none'); // Ocultar spinner
        displayVehicles(vehiclesData);
    } catch (error) {
        loadingSpinner.classList.add('d-none');
        productsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><i class="fas fa-exclamation-triangle"></i> ${error.message}</div>`;
    }
}

function displayVehicles(vehicles) {
    productsContainer.innerHTML = ''; // Limpiar contenedor
    
    if (vehicles.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No se encontraron vehículos que coincidan con la búsqueda.</p></div>';
        return;
    }

    vehicles.forEach(vehicle => {
        // Limpiar emojis del tipo (Regex básico para eliminar caracteres no alfanuméricos comunes si son emojis)
        const cleanType = vehicle.tipo ? vehicle.tipo.replace(/[\u1000-\uFFFF]+/g, '').trim() : 'N/A';
        const formattedPrice = parseFloat(vehicle.precio_venta).toLocaleString('en-US');

        const cardHTML = `
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="card h-100">
                    <img src="${vehicle.imagen}" class="card-img-top viewDetailsBtn" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy" data-codigo="${vehicle.codigo}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-secondary">${vehicle.categoria}</span>
                            <img src="${vehicle.logo}" alt="Logo ${vehicle.marca}" style="height: 20px;">
                        </div>
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="card-text small">Tipo: ${cleanType}</p>
                        <p class="card-price mb-3">$${formattedPrice}</p>
                        
                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-outline-primary w-50 viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalle</button>
                            <button class="btn btn-primary w-50 addToCartTriggerBtn" data-codigo="${vehicle.codigo}">Añadir <i class="fas fa-cart-plus"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ================= EVENT DELEGATION Y LÓGICA =================
function setupEventListeners() {
    // Filtrado en tiempo real
    searchInput.addEventListener('input', () => filterVehicles(searchInput.value));

    // Delegación de eventos en el contenedor principal (OBLIGATORIO SEGÚN INSTRUCCIONES)
    productsContainer.addEventListener('click', (e) => {
        const target = e.target;

        // 1. Si hace clic en "Ver Detalles" o en la Imagen
        if (target.closest('.viewDetailsBtn')) {
            const btn = target.closest('.viewDetailsBtn');
            const codigo = parseInt(btn.getAttribute('data-codigo'));
            openDetailsModal(codigo);
        }

        // 2. Si hace clic en "Añadir al Carrito" (Desde la tarjeta)
        if (target.closest('.addToCartTriggerBtn')) {
            const btn = target.closest('.addToCartTriggerBtn');
            const codigo = parseInt(btn.getAttribute('data-codigo'));
            showQuantityModal(codigo);
        }
    });

    // Botón Confirmar Añadir en Modal de Cantidad
    document.getElementById('confirmAddToCartBtn').addEventListener('click', () => {
        const qtyInput = document.getElementById('quantityInput');
        const quantity = parseInt(qtyInput.value);
        
        if (quantity > 0 && selectedVehicleForCart) {
            addItemToCart(selectedVehicleForCart, quantity);
            bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
        } else {
            alert('Por favor, ingresa una cantidad válida.');
        }
    });

    // Procesar Pago
    document.getElementById('processPaymentBtn').addEventListener('click', handlePayment);
}

function filterVehicles(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const filtered = vehiclesData.filter(v => 
        v.marca.toLowerCase().includes(term) || 
        v.modelo.toLowerCase().includes(term) || 
        v.categoria.toLowerCase().includes(term)
    );
    displayVehicles(filtered);
    return filtered; // Retorno para el testing
}

// ================= MODALES Y CARRITO =================
function openDetailsModal(codigo) {
    const vehicle = vehiclesData.find(v => v.codigo === codigo);
    if (!vehicle) return;

    // Rellenar datos
    document.getElementById('detailImage').src = vehicle.imagen;
    document.getElementById('detailTitle').textContent = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailCategory').textContent = vehicle.categoria;
    document.getElementById('detailType').textContent = vehicle.tipo.replace(/[\u1000-\uFFFF]+/g, '').trim();
    document.getElementById('detailPrice').textContent = parseFloat(vehicle.precio_venta).toLocaleString('en-US');
    
    // Configurar botón de añadir en este modal
    const detailAddBtn = document.getElementById('detailAddToCartBtn');
    detailAddBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
        showQuantityModal(codigo);
    };

    // Abrir Modal
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

function showQuantityModal(codigo) {
    selectedVehicleForCart = vehiclesData.find(v => v.codigo === codigo);
    document.getElementById('quantityInput').value = 1; // Reset
    const modal = new bootstrap.Modal(document.getElementById('quantityModal'));
    modal.show();
}

function addItemToCart(vehicle, quantity) {
    const existingItem = cart.find(item => item.codigo === vehicle.codigo);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: parseFloat(vehicle.precio_venta),
            imagen: vehicle.imagen,
            logo: vehicle.logo,
            quantity: quantity
        });
    }
    updateCartUI();
    return cart; // Retorno para el testing
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted">El carrito está vacío.</p>';
        document.getElementById('checkoutBtn').disabled = true;
    } else {
        document.getElementById('checkoutBtn').disabled = false;
        cart.forEach((item, index) => {
            const subtotal = item.precio * item.quantity;
            total += subtotal;
            itemCount += item.quantity;

            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.imagen}" class="cart-item-img" alt="${item.modelo}">
                        <div>
                            <h6 class="mb-0">${item.marca} ${item.modelo}</h6>
                            <small class="text-muted">${item.quantity} x $${item.precio.toLocaleString('en-US')}</small>
                        </div>
                    </div>
                    <div class="fw-bold">$${subtotal.toLocaleString('en-US')}</div>
                </div>
            `;
        });
    }

    cartTotalSpan.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2 });
    
    // Actualizar badge con animación
    cartCount.textContent = itemCount;
    cartCount.classList.remove('pulse-animation');
    void cartCount.offsetWidth; // Trigger reflow
    cartCount.classList.add('pulse-animation');
}

// ================= PAGO Y GENERACIÓN DE FACTURA =================
function handlePayment(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value.trim();
    if(!name || cart.length === 0) return alert("Complete los datos y asegúrese de tener items en el carrito.");

    alert(`¡Pago exitoso, ${name}! Procesando su factura...`);
    generateInvoice(name);
    
    // Limpiar estado
    cart = [];
    updateCartUI();
    document.getElementById('paymentForm').reset();
    
    // Cerrar modales
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    if(cartModal) cartModal.hide();
}

function generateInvoice(clientName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabecera
    doc.setFontSize(22);
    doc.text("Factura Comercial - GarageOnline", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${clientName}`, 20, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 42);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    // Detalles del carrito
    let yPos = 60;
    let totalGeneral = 0;

    doc.setFont(undefined, 'bold');
    doc.text("Vehículo", 20, yPos);
    doc.text("Cant.", 120, yPos);
    doc.text("Subtotal", 160, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        totalGeneral += subtotal;
        
        doc.text(`${item.marca} ${item.modelo}`, 20, yPos);
        doc.text(`${item.quantity}`, 125, yPos);
        doc.text(`$${subtotal.toLocaleString('en-US')}`, 160, yPos);
        yPos += 10;
    });

    // Total final
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text("TOTAL PAGADO:", 120, yPos);
    doc.text(`$${totalGeneral.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 160, yPos);

    // Guardar PDF
    doc.save(`Factura_GarageOnline_${clientName.replace(/\s+/g, '_')}.pdf`);
}

// ================= TESTING AUTOMATIZADO =================
function runTests() {
    console.log("%c--- INICIANDO PRUEBAS UNITARIAS ---", "color: blue; font-weight: bold;");

    // Mock data para pruebas
    const mockVehicle = { codigo: 999, marca: "TestBrand", modelo: "TestModel", precio_venta: 1000, categoria: "SUV" };
    vehiclesData = [mockVehicle]; // Inyectar mock temporalmente

    // Test 1: filterVehicles
    try {
        const result = filterVehicles("TestBrand");
        if (result.length === 1 && result[0].marca === "TestBrand") {
            console.log("filterVehicles(): PASSED ✅");
        } else {
            console.error("filterVehicles(): FAILED ❌ - No filtró correctamente.");
        }
    } catch (e) {
        console.error("filterVehicles(): FAILED ❌", e);
    }

    // Test 2: addItemToCart (Nuevo ítem)
    try {
        cart = []; // Limpiar carrito
        addItemToCart(mockVehicle, 2);
        if (cart.length === 1 && cart[0].quantity === 2) {
            console.log("addItemToCart() [Nuevo Item]: PASSED ✅");
        } else {
            console.error("addItemToCart() [Nuevo Item]: FAILED ❌");
        }
    } catch (e) {
        console.error("addItemToCart() [Nuevo Item]: FAILED ❌", e);
    }

    // Test 3: addItemToCart (Ítem existente)
    try {
        addItemToCart(mockVehicle, 3);
        if (cart.length === 1 && cart[0].quantity === 5) {
            console.log("addItemToCart() [Sumar Cantidad]: PASSED ✅");
        } else {
            console.error("addItemToCart() [Sumar Cantidad]: FAILED ❌");
        }
    } catch (e) {
        console.error("addItemToCart() [Sumar Cantidad]: FAILED ❌", e);
    }

    // Test 4: updateCartUI
    try {
        updateCartUI();
        if (document.getElementById('cartTotal').textContent === "5,000.00") {
            console.log("updateCartUI(): PASSED ✅");
        } else {
            console.error("updateCartUI(): FAILED ❌ - Total incorrecto en el DOM.");
        }
    } catch (e) {
        console.error("updateCartUI(): FAILED ❌", e);
    }

    console.log("%c--- FIN DE PRUEBAS ---", "color: blue; font-weight: bold;");
    
    // Limpiar estado mockeado
    cart = [];
    vehiclesData = [];
    updateCartUI();
}