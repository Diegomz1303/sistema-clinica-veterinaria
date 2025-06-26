// frontend/js/almacen.js - CÓDIGO ACTUALIZADO CON FILTROS

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. LÓGICA DEL MENÚ LATERAL (SIDEBAR) ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    if (sidebar) {
        const navLinks = sidebar.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); 
                const href = this.href;

                if (document.body.classList.contains('sidebar-open')) {
                    document.body.classList.remove('sidebar-open');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300); 
                } else {
                    window.location.href = href;
                }
            });
        });
    }

    // --- 2. LÓGICA DE SEGURIDAD Y SESIÓN ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await fetch('../backend/api_logout.php');
            window.location.href = 'login.html';
        });
    }
    
    try {
        const sessionResponse = await fetch('../backend/api_check_session.php');
        const sessionData = await sessionResponse.json();
        if (!sessionData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        window.location.href = 'login.html';
        return;
    }

    // --- 3. ELEMENTOS DE LA PÁGINA Y LECTURA DE FILTROS ---
    const productosTbody = document.getElementById('productos-tbody');
    const inputBusqueda = document.getElementById('inputBusqueda');
    const paginationControls = document.getElementById('pagination-controls');
    const modal = document.getElementById('producto-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('producto-form');
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    const closeModalSpan = modal.querySelector('.close');

    let currentPage = 1;

    // **NUEVO**: Leemos el parámetro 'filter' de la URL cuando la página carga
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilter = urlParams.get('filter') || '';

    // --- 4. FUNCIÓN PARA CARGAR PRODUCTOS (MODIFICADA) ---
    async function cargarProductos(page = 1, searchTerm = '', filter = '') {
        currentPage = page;
        // **MODIFICADO**: Añadimos el parámetro 'filter' a la llamada de la API
        const url = `../backend/api_get_productos.php?page=${page}&search=${encodeURIComponent(searchTerm)}&filter=${filter}`;
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
                    row.dataset.id = producto.id;
                    const stockClass = producto.stock_actual <= 5 ? 'stock-bajo' : '';
                    const caducidad = new Date(producto.fecha_caducidad);
                    const hoy = new Date();
                    hoy.setHours(0,0,0,0);
                    const vencidoClass = producto.fecha_caducidad && caducidad < hoy ? 'vencido' : '';
                    row.innerHTML = `
                        <td>${producto.nombre}</td>
                        <td>${producto.tipo}</td>
                        <td class="${stockClass}">${producto.stock_actual}</td>
                        <td>S/ ${parseFloat(producto.precio_venta || 0).toFixed(2)}</td>
                        <td>${producto.lote || 'N/A'}</td>
                        <td class="${vencidoClass}">${producto.fecha_caducidad ? new Date(producto.fecha_caducidad).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : 'N/A'}</td>
                        <td>
                            <button class="btn-editar">Editar</button>
                            <button class="btn-eliminar">Eliminar</button>
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

    // --- 5. PAGINACIÓN Y BÚSQUEDA (MODIFICADA) ---
    function renderPagination(pagination) {
        paginationControls.innerHTML = '';
        if (pagination.totalPages <= 1) return;
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.disabled = pagination.currentPage === 1;
        // **MODIFICADO**: Pasamos el filtro al cambiar de página
        prevButton.onclick = () => cargarProductos(pagination.currentPage - 1, inputBusqueda.value, initialFilter);
        paginationControls.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Página ${pagination.currentPage} de ${pagination.totalPages}`;
        pageInfo.style.margin = '0 15px';
        paginationControls.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.disabled = pagination.currentPage === pagination.totalPages;
        // **MODIFICADO**: Pasamos el filtro al cambiar de página
        nextButton.onclick = () => cargarProductos(pagination.currentPage + 1, inputBusqueda.value, initialFilter);
        paginationControls.appendChild(nextButton);
    }
    // **MODIFICADO**: Pasamos el filtro al buscar
    inputBusqueda.addEventListener('input', () => cargarProductos(1, inputBusqueda.value, initialFilter));

    // --- 6. MODALES Y FORMULARIOS ---
    btnNuevoProducto.onclick = () => {
        form.reset();
        document.getElementById('producto_id').value = '';
        modalTitle.textContent = 'Añadir Nuevo Producto';
        modal.style.display = 'flex';
    };
    closeModalSpan.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
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
                cargarProductos(currentPage, inputBusqueda.value, initialFilter);
            } else {
                alert('Error: ' + (result.message || 'Ocurrió un error.'));
            }
        } catch (error) {
            alert('Error de conexión al guardar el producto.');
        }
    });

    // --- 7. EDITAR Y ELIMINAR ---
    productosTbody.addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.dataset.id;
        if (target.classList.contains('btn-editar')) {
            // Esta llamada a la API no necesita el filtro, así que está bien como está
            const response = await fetch(`../backend/api_get_productos.php?id=${id}`);
            const result = await response.json();
            const producto = result.data[0];
            if (producto) {
                form.reset();
                document.getElementById('producto_id').value = producto.id;
                document.getElementById('nombre').value = producto.nombre;
                document.getElementById('tipo').value = producto.tipo;
                document.getElementById('stock_actual').value = producto.stock_actual;
                document.getElementById('precio_venta').value = producto.precio_venta;
                document.getElementById('lote').value = producto.lote || '';
                document.getElementById('fecha_caducidad').value = producto.fecha_caducidad;
                document.getElementById('descripcion').value = producto.descripcion || '';
                modalTitle.textContent = 'Editar Producto';
                modal.style.display = 'flex';
            }
        }
        if (target.classList.contains('btn-eliminar')) {
            if (confirm(`¿Estás seguro de que quieres eliminar este producto?`)) {
                try {
                    const formData = new FormData();
                    formData.append('id', id);
                    const response = await fetch('../backend/api_delete_producto.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        cargarProductos(currentPage, inputBusqueda.value, initialFilter);
                    } else {
                        alert('Error al eliminar: ' + result.message);
                    }
                } catch (error) {
                    alert('Error de conexión al eliminar el producto.');
                }
            }
        }
    });

    // **MODIFICADO**: Carga inicial de datos, pasando el filtro de la URL
    cargarProductos(1, '', initialFilter);
});
