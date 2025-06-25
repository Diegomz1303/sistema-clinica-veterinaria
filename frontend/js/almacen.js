document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. VERIFICACIÓN DE SESIÓN Y ELEMENTOS DEL DOM ---
    const usernamePlaceholder = document.getElementById('username-placeholder');
    const btnLogout = document.getElementById('btn-logout');
    
 // CÓDIGO CORREGIDO
try {
    const sessionResponse = await fetch('../backend/api_check_session.php');
    const sessionData = await sessionResponse.json();
    if (!sessionData.loggedIn) { // <--- LÍNEA CORREGIDA
        window.location.href = 'login.html';
        return;
    }
    usernamePlaceholder.textContent = sessionData.username || 'Usuario';
} catch (error) {
    window.location.href = 'login.html';
    return;
}

    btnLogout.addEventListener('click', async () => {
        const response = await fetch('../backend/api_logout.php');
        const data = await response.json();
        if(data.success){
            window.location.href = 'login.html';
        }
    });

    // Elementos de la página de almacén
    const productosTbody = document.getElementById('productos-tbody');
    const inputBusqueda = document.getElementById('inputBusqueda');
    const paginationControls = document.getElementById('pagination-controls');
    const modal = document.getElementById('producto-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('producto-form');
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    const closeModalSpan = modal.querySelector('.close');

    let currentPage = 1;

    // --- 2. FUNCIÓN PRINCIPAL PARA CARGAR PRODUCTOS ---
    async function cargarProductos(page = 1, searchTerm = '') {
        currentPage = page;
        const url = `../backend/api_get_productos.php?page=${page}&search=${encodeURIComponent(searchTerm)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar los productos');
            
            const result = await response.json();
            productosTbody.innerHTML = ''; 
            
            if(result.data.length === 0){
                productosTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No se encontraron productos.</td></tr>';
            } else {
                result.data.forEach(producto => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', producto.id);

                    // Lógica para estilos condicionales
                    const stockClass = producto.stock_actual <= 5 ? 'stock-bajo' : '';
                    const caducidad = new Date(producto.fecha_caducidad);
                    const hoy = new Date();
                    hoy.setHours(0,0,0,0); // Ignorar la hora para la comparación
                    const vencidoClass = producto.fecha_caducidad && caducidad < hoy ? 'vencido' : '';

                    row.innerHTML = `
                        <td>${producto.nombre}</td>
                        <td>${producto.tipo}</td>
                        <td class="${stockClass}">${producto.stock_actual}</td>
                        <td>S/ ${parseFloat(producto.precio_venta || 0).toFixed(2)}</td>
                        <td>${producto.lote || 'N/A'}</td>
                        <td class="${vencidoClass}">${producto.fecha_caducidad ? new Date(producto.fecha_caducidad).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-editar">Editar</button>
                            <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
                        </td>
                    `;
                    productosTbody.appendChild(row);
                });
            }
            renderPagination(result.pagination);
        } catch (error) {
            console.error('Error:', error);
            productosTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No se pudieron cargar los productos.</td></tr>';
        }
    }

    // --- 3. LÓGICA DE PAGINACIÓN Y BÚSQUEDA ---
    function renderPagination(pagination) {
        paginationControls.innerHTML = '';
        if (pagination.totalPages <= 1) return;

        // Botón Anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.className = 'btn btn-secondary';
        prevButton.disabled = pagination.currentPage === 1;
        prevButton.addEventListener('click', () => cargarProductos(pagination.currentPage - 1, inputBusqueda.value));
        paginationControls.appendChild(prevButton);

        // Indicador de página
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Página ${pagination.currentPage} de ${pagination.totalPages}`;
        pageInfo.style.margin = '0 15px';
        paginationControls.appendChild(pageInfo);

        // Botón Siguiente
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.className = 'btn btn-secondary';
        nextButton.disabled = pagination.currentPage === pagination.totalPages;
        nextButton.addEventListener('click', () => cargarProductos(pagination.currentPage + 1, inputBusqueda.value));
        paginationControls.appendChild(nextButton);
    }

    inputBusqueda.addEventListener('input', () => {
        cargarProductos(1, inputBusqueda.value);
    });

    // --- 4. LÓGICA DE MODALES Y FORMULARIOS ---
    btnNuevoProducto.onclick = () => {
        form.reset();
        document.getElementById('producto_id').value = '';
        modalTitle.textContent = 'Añadir Nuevo Producto';
        modal.style.display = 'block';
    };

    closeModalSpan.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const productoId = formData.get('producto_id');
        
        const url = productoId ? '../backend/api_update_producto.php' : '../backend/api_add_producto.php';

        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                modal.style.display = 'none';
                cargarProductos(currentPage, inputBusqueda.value);
            } else {
                alert('Error: ' + (result.message || 'Ocurrió un error.'));
            }
        } catch (error) {
            alert('Error de conexión al guardar el producto.');
        }
    });

    // --- 5. LÓGICA PARA EDITAR Y ELIMINAR ---
    productosTbody.addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.dataset.id;

        // Botón Editar
        if (target.classList.contains('btn-editar')) {
            // Para editar, es mejor obtener los datos frescos de la BD
            const response = await fetch(`../backend/api_get_productos.php?id=${id}`); // Necesitaremos modificar api_get_productos para esto
            const result = await response.json(); // Asumiendo que la API puede devolver un solo producto

            // Simulación si la API no devuelve un solo producto. Lo ideal es hacerlo.
            // Por ahora, llenamos con los datos de la fila (no es ideal para campos largos como descripción)
            const cells = row.cells;
            form.reset();
            document.getElementById('producto_id').value = id;
            document.getElementById('nombre').value = cells[0].textContent;
            document.getElementById('tipo').value = cells[1].textContent;
            document.getElementById('stock_actual').value = parseInt(cells[2].textContent);
            document.getElementById('precio_venta').value = parseFloat(cells[3].textContent.replace('S/ ', ''));
            document.getElementById('lote').value = cells[4].textContent === 'N/A' ? '' : cells[4].textContent;
            // La fecha necesita formato YYYY-MM-DD
            if (cells[5].textContent !== 'N/A') {
                const dateParts = cells[5].textContent.split('/');
                document.getElementById('fecha_caducidad').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            }

            modalTitle.textContent = 'Editar Producto';
            modal.style.display = 'block';
        }

        // Botón Eliminar
        if (target.classList.contains('btn-eliminar')) {
            if (confirm(`¿Estás seguro de que quieres eliminar este producto?`)) {
                try {
                    const formData = new FormData();
                    formData.append('id', id);
                    const response = await fetch('../backend/api_delete_producto.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        cargarProductos(currentPage, inputBusqueda.value);
                    } else {
                        alert('Error al eliminar: ' + result.message);
                    }
                } catch (error) {
                    alert('Error de conexión al eliminar el producto.');
                }
            }
        }
    });

    // Carga inicial de datos
    cargarProductos();
});