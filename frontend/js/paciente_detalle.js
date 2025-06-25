document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. INICIALIZACIÓN Y CARGA DE DATOS ---
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('id');

    if (!pacienteId) {
        alert('No se especificó un paciente.');
        window.location.href = 'index.html';
        return;
    }

    // Cargar toda la información de la página
    await cargarDetallesPaciente(pacienteId);

    // --- 2. LÓGICA DE CARGA DE DATOS Y RENDERIZADO ---
    async function cargarDetallesPaciente(id) {
        try {
            const response = await fetch(`../backend/api_get_paciente_detalle.php?id=${id}`);
            if (!response.ok) {
                 if (response.status === 401) window.location.href = 'login.html';
                 throw new Error('Error en la respuesta de la API');
            }
            const data = await response.json();
            if (data.success) {
                renderDatosPaciente(data.paciente);
                renderHistorial(data.historial);
                document.getElementById('id_paciente_visita').value = id; // Poner ID en el form
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error al cargar los detalles:', error);
        }
    }

    function renderDatosPaciente(paciente) {
        document.getElementById('detalle-nombre-paciente').textContent = paciente.nombre;
        document.getElementById('detalle-especie').textContent = paciente.especie;
        document.getElementById('detalle-raza').textContent = paciente.raza;
        document.getElementById('detalle-sexo').textContent = paciente.sexo;
        document.getElementById('detalle-color').textContent = paciente.color;
        document.getElementById('detalle-fecha-nacimiento').textContent = new Date(paciente.fecha_nacimiento).toLocaleDateString('es-PE', { timeZone: 'UTC' });
        
        document.getElementById('detalle-nombre-propietario').textContent = `${paciente.nombre_propietario} ${paciente.apellido}`;
        document.getElementById('detalle-telefono').textContent = paciente.telefono;
        document.getElementById('detalle-email').textContent = paciente.email;
        document.getElementById('detalle-direccion').textContent = paciente.direccion;
    }

// ENCUENTRA Y REEMPLAZA ESTA FUNCIÓN:
function renderHistorial(historial) {
    const container = document.getElementById('historial-lista-container');
    container.innerHTML = '';
    if (historial.length === 0) {
        container.innerHTML = '<p>No hay visitas registradas.</p>';
        return;
    }

    historial.forEach(visita => {
        const visitaCard = document.createElement('div');
        visitaCard.className = 'visita-card';
        visitaCard.style.cursor = 'pointer'; // Añadimos cursor para indicar que es clickeable
        
        // Guardamos los datos completos de la visita en el elemento para usarlos después
        visitaCard.dataset.visitaData = JSON.stringify(visita); 
        
        visitaCard.innerHTML = `
            <div class="visita-header">
                <strong>${new Date(visita.fecha_visita).toLocaleDateString('es-PE')} - ${visita.tipo_visita}</strong>
                <span>${visita.motivo_consulta}</span>
            </div>
        `;
        container.appendChild(visitaCard);
    });
}


// AÑADE ESTE NUEVO BLOQUE DE CÓDIGO AL FINAL DE TU ARCHIVO paciente_detalle.js
// --- 4. LÓGICA PARA MOSTRAR DETALLES DE VISITAS ANTERIORES ---
const historialContainer = document.getElementById('historial-lista-container');
const visitaModal = document.getElementById('modal-visita-detalle');
const cerrarModalBtn = visitaModal.querySelector('.cerrar-modal');

historialContainer.addEventListener('click', (e) => {
    const visitaCard = e.target.closest('.visita-card');
    if (!visitaCard) return;

    // Recuperamos los datos de la visita que guardamos antes
    const visitaData = JSON.parse(visitaCard.dataset.visitaData);
    
    // Llenamos el modal con los datos
    document.getElementById('visita-fecha').textContent = new Date(visitaData.fecha_visita).toLocaleString('es-PE');
    document.getElementById('visita-tipo').textContent = visitaData.tipo_visita;
    document.getElementById('visita-motivo').textContent = visitaData.motivo_consulta;
    document.getElementById('visita-examenes').textContent = visitaData.examenes_complementarios || 'No se registraron.';
    document.getElementById('visita-diagnostico').textContent = visitaData.diagnostico;
    document.getElementById('visita-tratamiento').textContent = visitaData.tratamiento || 'No se registraron notas.';
    document.getElementById('visita-peso').textContent = visitaData.peso_kg ? `${visitaData.peso_kg} Kg` : 'N/A';
    document.getElementById('visita-temperatura').textContent = visitaData.temperatura ? `${visitaData.temperatura} °C` : 'N/A';
    document.getElementById('visita-frec-cardiaca').textContent = visitaData.frecuencia_cardiaca || 'N/A';
    document.getElementById('visita-frec-resp').textContent = visitaData.frecuencia_respiratoria || 'N/A';
    document.getElementById('visita-proxima-cita').textContent = visitaData.proxima_cita ? new Date(visitaData.proxima_cita).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : 'No definida';
    document.getElementById('visita-doctor').textContent = visitaData.doctor_encargado;

    // Llenar la lista de productos utilizados
    const productosLista = document.getElementById('visita-archivos-lista'); // Usamos el div de archivos, o puedes crear uno nuevo.
    productosLista.innerHTML = '';
    if (visitaData.productos_utilizados) {
        const productos = visitaData.productos_utilizados.split(';');
        productos.forEach(p => {
            const [id, nombre, cantidad] = p.split(':');
            const pElem = document.createElement('p');
            pElem.textContent = `- ${nombre} (Cantidad: ${cantidad})`;
            productosLista.appendChild(pElem);
        });
    } else {
        productosLista.innerHTML = '<p>No se usaron productos del inventario.</p>';
    }

    // Mostramos el modal
    visitaModal.style.display = 'block';
});

cerrarModalBtn.onclick = () => {
    visitaModal.style.display = 'none';
};

window.addEventListener('click', (event) => {
    if (event.target == visitaModal) {
        visitaModal.style.display = 'none';
    }
});

    // --- 3. LÓGICA PARA AGREGAR VISITA Y PRODUCTOS ---
    const searchInput = document.getElementById('search-producto-input');
    const searchResults = document.getElementById('search-producto-results');
    const selectedList = document.getElementById('productos-seleccionados-list');
    const hiddenInput = document.getElementById('productos_usados_hidden_input');
    let productosSeleccionados = [];

    searchInput.addEventListener('input', async () => {
        const searchTerm = searchInput.value;
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        const response = await fetch(`../backend/api_get_productos.php?search=${searchTerm}`);
        const result = await response.json();
        
        searchResults.innerHTML = '';
        if (result.data.length > 0) {
            searchResults.style.display = 'block';
            result.data.forEach(producto => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = `${producto.nombre} (Stock: ${producto.stock_actual})`;
                item.onclick = () => seleccionarProducto(producto);
                searchResults.appendChild(item);
            });
        } else {
            searchResults.style.display = 'none';
        }
    });

    function seleccionarProducto(producto) {
        searchInput.value = '';
        searchResults.style.display = 'none';
        if (productosSeleccionados.find(p => p.id === producto.id)) return;

        productosSeleccionados.push({
            id: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            precio: producto.precio_venta,
            stock_max: producto.stock_actual
        });
        renderProductosSeleccionados();
    }

    function renderProductosSeleccionados() {
        selectedList.innerHTML = '';
        productosSeleccionados.forEach((producto, index) => {
            const item = document.createElement('div');
            item.className = 'producto-seleccionado-item';
            item.innerHTML = `
                <span>${producto.nombre}</span>
                <div>
                    <label>Cant:</label>
                    <input type="number" value="${producto.cantidad}" min="1" max="${producto.stock_max}" class="cantidad-producto-input" data-index="${index}">
                    <button type="button" class="btn-remover-producto" data-index="${index}">&times;</button>
                </div>
            `;
            selectedList.appendChild(item);
        });
        actualizarHiddenInput();
    }

    selectedList.addEventListener('input', e => {
        if (e.target.classList.contains('cantidad-producto-input')) {
            const index = e.target.dataset.index;
            productosSeleccionados[index].cantidad = parseInt(e.target.value);
            actualizarHiddenInput();
        }
    });

    selectedList.addEventListener('click', e => {
        if (e.target.classList.contains('btn-remover-producto')) {
            productosSeleccionados.splice(e.target.dataset.index, 1);
            renderProductosSeleccionados();
        }
    });

    function actualizarHiddenInput() {
        hiddenInput.value = JSON.stringify(productosSeleccionados.map(p => ({
            id: p.id,
            cantidad: p.cantidad,
            precio: p.precio
        })));
    }

    // Envío del formulario de nueva visita
    const formNuevaVisita = document.getElementById('form-nueva-visita');
    formNuevaVisita.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formNuevaVisita);
        
        try {
            const response = await fetch('../backend/api_agregar_visita.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            const mensajeDiv = document.getElementById('mensaje-visita');
            
            if (result.success) {
                mensajeDiv.textContent = 'Visita guardada con éxito.';
                mensajeDiv.className = 'mensaje exito';
                formNuevaVisita.reset();
                productosSeleccionados = [];
                renderProductosSeleccionados();
                cargarDetallesPaciente(pacienteId); // Recargar el historial
            } else {
                mensajeDiv.textContent = 'Error: ' + result.message;
                mensajeDiv.className = 'mensaje error';
            }
            mensajeDiv.style.display = 'block';
            setTimeout(() => mensajeDiv.style.display = 'none', 5000);

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
        }
    });

    // --- OTROS EVENTOS ---
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('../backend/api_logout.php');
        window.location.href = 'login.html';
    });
});