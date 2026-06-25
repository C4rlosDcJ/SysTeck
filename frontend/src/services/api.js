const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = API_URL.replace('/api', '');

// Helper para hacer peticiones
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
    }

    return data;
}

// Auth Service
export const authService = {
    register: (userData) => fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (credentials) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    getMe: () => fetchAPI('/auth/me'),

    updateProfile: (data) => fetchAPI('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    changePassword: (data) => fetchAPI('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    forgotPassword: (email) => fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),

    resetPassword: (token, password) => fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
    })
};

// Repairs Service
export const repairService = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/repairs${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchAPI(`/repairs/${id}`),

    create: (data) => fetchAPI('/repairs', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => fetchAPI(`/repairs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    updateStatus: (id, status, notes, estimated_delivery = null, signature = null) => fetchAPI(`/repairs/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes, estimated_delivery, signature })
    }),

    addNote: (id, note, isInternal = false) => fetchAPI(`/repairs/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note, is_internal: isInternal })
    }),

    submitReview: (id, rating, reviewText) => fetchAPI(`/repairs/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, review_text: reviewText })
    }),

    delete: (id) => fetchAPI(`/repairs/${id}`, { method: 'DELETE' })
};

// Services Catalog
export const servicesCatalog = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/services${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchAPI(`/services/${id}`),

    getDeviceTypes: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/services/device-types${query ? `?${query}` : ''}`);
    },

    createDeviceType: (data) => fetchAPI('/services/device-types', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    updateDeviceType: (id, data) => fetchAPI(`/services/device-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    deleteDeviceType: (id) => fetchAPI(`/services/device-types/${id}`, { method: 'DELETE' }),

    getBrands: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/services/brands${query ? `?${query}` : ''}`);
    },

    createBrand: (data) => fetchAPI('/services/brands', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    updateBrand: (id, data) => fetchAPI(`/services/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    deleteBrand: (id) => fetchAPI(`/services/brands/${id}`, { method: 'DELETE' }),

    create: (data) => fetchAPI('/services', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => fetchAPI(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => fetchAPI(`/services/${id}`, { method: 'DELETE' }),

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    }
};

// Customers Service (Admin)
export const customerService = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/customers${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchAPI(`/customers/${id}`),

    getRepairs: (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/customers/${id}/repairs${query ? `?${query}` : ''}`);
    },

    create: (data) => fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => fetchAPI(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
};

// User/Staff Service
export const userService = {
    getTechnicians: () => fetchAPI('/auth/technicians')
};

// Stats Service (Admin)
export const statsService = {
    getDashboard: () => fetchAPI('/stats/dashboard'),

    getRevenue: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/stats/revenue${query ? `?${query}` : ''}`);
    },

    getTechniciansStats: () => fetchAPI('/stats/technicians')
};

// Settings Service (Admin)
export const settingsService = {
    getAll: () => fetchAPI('/settings'),
    get: () => fetchAPI('/settings'), // Alias for compatibility
    update: (settings) => fetchAPI('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
    })
};

// Inventory Service (Admin)
export const inventoryService = {
    // Categorías
    getCategories: () => fetchAPI('/inventory/categories'),
    createCategory: (data) => fetchAPI('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) => fetchAPI(`/inventory/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) => fetchAPI(`/inventory/categories/${id}`, { method: 'DELETE' }),

    // Productos
    getProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/inventory/products${query ? `?${query}` : ''}`);
    },
    getProductById: (id) => fetchAPI(`/inventory/products/${id}`),
    createProduct: (data) => fetchAPI('/inventory/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => fetchAPI(`/inventory/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => fetchAPI(`/inventory/products/${id}`, { method: 'DELETE' }),

    // Stock
    getStockMovements: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/inventory/stock-movements${query ? `?${query}` : ''}`);
    },
    addStockMovement: (data) => fetchAPI('/inventory/stock-movements', { method: 'POST', body: JSON.stringify(data) }),

    // Stats
    getStats: () => fetchAPI('/inventory/stats'),
};

// POS Service (Admin)
export const posService = {
    createSale: (data) => fetchAPI('/pos/sales', { method: 'POST', body: JSON.stringify(data) }),
    getSales: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/pos/sales${query ? `?${query}` : ''}`);
    },
    getSaleById: (id) => fetchAPI(`/pos/sales/${id}`),
    cancelSale: (id) => fetchAPI(`/pos/sales/${id}/cancel`, { method: 'PUT' }),
    getStats: () => fetchAPI('/pos/sales/stats'),

    // Reparaciones cobrables
    getBillableRepairs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/pos/repairs/billable${query ? `?${query}` : ''}`);
    },
    getRepairForPOS: (id) => fetchAPI(`/pos/repairs/${id}`),
};

// Upload Service
export const uploadService = {
    uploadImages: async (repairId, files, imageType = 'before') => {
        const token = localStorage.getItem('token');
        const formData = new FormData();

        files.forEach(file => {
            formData.append('images', file);
        });
        formData.append('image_type', imageType);

        const response = await fetch(`${API_URL}/uploads/repair/${repairId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    deleteImage: (imageId) => fetchAPI(`/uploads/${imageId}`, { method: 'DELETE' })
};

// Public Service (sin auth)
export const publicService = {
    trackRepair: async (ticket) => {
        const response = await fetch(`${API_URL}/public/track/${encodeURIComponent(ticket)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al buscar la reparación');
        return data;
    },
    getTheme: async () => {
        const response = await fetch(`${API_URL}/public/theme`);
        const data = await response.json();
        return data;
    },
    getCatalogServices: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/public/catalog/services${query ? `?${query}` : ''}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener servicios');
        return data;
    },
    getCatalogProducts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/public/catalog/products${query ? `?${query}` : ''}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener productos');
        return data;
    }
};

// Orders Service (authenticated)
export const orderService = {
    create: (data) => fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/orders${query ? `?${query}` : ''}`);
    },
    getById: (id) => fetchAPI(`/orders/${id}`),
    updateStatus: (id, status, admin_notes) => fetchAPI(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, admin_notes })
    }),
    cancel: (id) => fetchAPI(`/orders/${id}/cancel`, { method: 'PUT' }),
    update: (id, data) => fetchAPI(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getStats: () => fetchAPI('/orders/stats')
};

// Search Service (Admin)
export const searchService = {
    globalSearch: (query) => fetchAPI(`/search?q=${encodeURIComponent(query)}`)
};

// AI Service
export const aiService = {
    diagnose: (data) => fetchAPI('/ai/diagnose', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    parseQuote: (description) => fetchAPI('/ai/parse-quote', {
        method: 'POST',
        body: JSON.stringify({ description })
    }),
    improveNote: (note) => fetchAPI('/ai/improve-note', {
        method: 'POST',
        body: JSON.stringify({ note })
    }),
    chat: (message, history) => fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history })
    })
};

export default {
    auth: authService,
    repairs: repairService,
    services: servicesCatalog,
    customers: customerService,
    stats: statsService,
    settings: settingsService,
    uploads: uploadService,
    inventory: inventoryService,
    pos: posService,
    public: publicService,
    search: searchService,
    ai: aiService,
    orders: orderService
};

