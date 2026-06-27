import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  ShieldAlert, 
  ShoppingBag, 
  Package, 
  Users, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Bell, 
  BellRing,
  IndianRupee,
  TrendingUp,
  Inbox,
  Loader2,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';


const AdminDashboard = () => {
  const { user, token, authenticatedFetch, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tabs: 'overview', 'products', 'orders', 'customers', 'add-product', 'feedback'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Revenue filter period: 'all', 'monthly', 'weekly', 'today'
  const [revenuePeriod, setRevenuePeriod] = useState('all');

  // Orders filter period: 'all', 'monthly', 'weekly', 'today'
  const [ordersPeriod, setOrdersPeriod] = useState('all');

  // Notifications filter period: 'all', 'monthly', 'weekly', 'today'
  const [notifPeriod, setNotifPeriod] = useState('all');

  // Order search and date filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilterDate, setOrderFilterDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Live Toast Notifications
  const [toastNotif, setToastNotif] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [sseStatus, setSseStatus] = useState('connecting');

  // Modals / Forms States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showOutStockOnly, setShowOutStockOnly] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    image: '',
    stock: {}, // shopId: stockCount
    iINR: '',
    caseQuantity: ''
  });

  // Admin Management States
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [addAdminSuccess, setAddAdminSuccess] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');

  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const response = await authenticatedFetch('/users/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (activeTab === 'admin-roster') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAdmins();
    }
  }, [activeTab, fetchAdmins]);

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAdmin(true);
    setAddAdminError('');
    setAddAdminSuccess(false);

    try {
      const response = await authenticatedFetch('/users/admin', {
        method: 'POST',
        body: JSON.stringify(adminForm)
      });

      if (response.ok) {
        setAddAdminSuccess(true);
        setAdminForm({ name: '', email: '', password: '' });
        setTimeout(() => {
          setActiveTab('admin-roster');
          setAddAdminSuccess(false);
        }, 1500);
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Failed to register admin.');
      }
    } catch (err) {
      setAddAdminError(err.message);
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Simulated data for dynamic dashboard views

  // Reference for SSE EventSource
  const eventSourceRef = useRef(null);

  // Fetch initial dashboard records silently
  const loadDashboardDataSilently = useCallback(async () => {
    try {
      const pRes = await authenticatedFetch('/products');
      const oRes = await authenticatedFetch('/orders');
      const cRes = await authenticatedFetch('/users');
      const sRes = await authenticatedFetch('/shops');
      const fRes = await authenticatedFetch('/feedback');
      
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
      if (sRes.ok) setShops(await sRes.json());
      if (fRes.ok) setFeedbacks(await fRes.json());
    } catch (err) {
      console.error('Silent stats reload failed', err);
    }
  }, [authenticatedFetch]);

  // Fetch initial dashboard records
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await authenticatedFetch('/products');
      const oRes = await authenticatedFetch('/orders');
      const cRes = await authenticatedFetch('/users');
      const sRes = await authenticatedFetch('/shops');
      const nRes = await authenticatedFetch('/notifications');
      const fRes = await authenticatedFetch('/feedback');

      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
      if (sRes.ok) setShops(await sRes.json());
      if (fRes.ok) setFeedbacks(await fRes.json());
      if (nRes.ok) {
        const notifs = await nRes.json();
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to load dashboard specs:', err);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add-product') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('add-product');
      const initialStock = {};
      shops.forEach(s => {
        initialStock[s.id] = 999;
      });
      setProductForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'Oils & Lubricants',
        brand: '',
        image: '',
        stock: initialStock,
        iINR: '',
        caseQuantity: ''
      });
    }
  }, [location.search, shops]);

  // Real-Time SSE Listener callback
  const connectSSE = useCallback(() => {
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setSseStatus('connecting');
    const API_BASE = API_URL;
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${token}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseStatus('connected');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'NEW_NOTIFICATION') {
          // Prepend to notifications list
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Trigger screen toast
          setToastNotif(data.notification);
          
          // Re-load stats silently to update dashboard counts/revenue in real-time
          loadDashboardDataSilently();

          // Auto-hide toast after 6 seconds
          setTimeout(() => {
            setToastNotif(null);
          }, 6000);
        }
      } catch (err) {
        console.error('Error parsing SSE payload:', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE connection lost, event source error:', err);
      setSseStatus('disconnected');
    };
  }, [token, loadDashboardDataSilently]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectSSE]);

  // Polling Fallback when SSE is disconnected (for serverless environments)
  useEffect(() => {
    if (sseStatus !== 'disconnected') return;

    // Poll every 30 seconds to fetch updates silently
    const interval = setInterval(() => {
      loadDashboardDataSilently();
    }, 30000);

    return () => clearInterval(interval);
  }, [sseStatus, loadDashboardDataSilently]);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to moderate and delete this customer review?')) return;
    try {
      const response = await authenticatedFetch(`/feedback/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showFlashAlert(true, 'Feedback review successfully moderated and deleted.');
        loadDashboardDataSilently();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Moderation failed.');
      }
    } catch (err) {
      showFlashAlert(false, err.message);
    }
  };

  const showFlashAlert = (success, text) => {
    setAlertMessage({ success, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // OVERVIEW Calculations
  const totalOrders = orders.filter(o => {
    if (ordersPeriod === 'all') return true;

    const orderDate = new Date(o.createdAt);
    
    if (ordersPeriod === 'today') {
      const today = new Date();
      return orderDate.getDate() === today.getDate() &&
             orderDate.getMonth() === today.getMonth() &&
             orderDate.getFullYear() === today.getFullYear();
    }

    if (ordersPeriod === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return orderDate >= sevenDaysAgo;
    }

    if (ordersPeriod === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return orderDate >= thirtyDaysAgo;
    }

    return true;
  }).length;

  const totalProducts = products.length;
  const totalCustomers = customers.filter(c => c.role === 'customer').length;
  const totalRevenue = orders
    .filter(o => {
      // Exclude Rejected and Cancelled orders from revenue
      if (o.status === 'Rejected' || o.status === 'Cancelled') return false;

      if (revenuePeriod === 'all') return true;

      const orderDate = new Date(o.createdAt);
      
      if (revenuePeriod === 'today') {
        const today = new Date();
        return orderDate.getDate() === today.getDate() &&
               orderDate.getMonth() === today.getMonth() &&
               orderDate.getFullYear() === today.getFullYear();
      }

      if (revenuePeriod === 'weekly') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return orderDate >= sevenDaysAgo;
      }

      if (revenuePeriod === 'monthly') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return orderDate >= thirtyDaysAgo;
      }

      return true;
    })
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Dynamic notification filtering logic
  const filteredNotifications = notifications.filter(n => {
    if (notifPeriod === 'all') return true;

    const notifDate = new Date(n.createdAt);
    
    if (notifPeriod === 'today') {
      const today = new Date();
      return notifDate.getDate() === today.getDate() &&
             notifDate.getMonth() === today.getMonth() &&
             notifDate.getFullYear() === today.getFullYear();
    }

    if (notifPeriod === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return notifDate >= sevenDaysAgo;
    }

    if (notifPeriod === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return notifDate >= thirtyDaysAgo;
    }

    return true;
  });

  // Filtered orders list for Order Actions tab based on search query, date calendar, and status filter
  const filteredOrders = orders.filter(o => {
    // 1. Search Query filter (matches order ID, customer name, customer email, delivery recipient name, or delivery recipient phone)
    if (orderSearchQuery.trim() !== '') {
      const query = orderSearchQuery.toLowerCase();
      const orderIdMatch = o.id?.toLowerCase().includes(query);
      const userNameMatch = o.userName?.toLowerCase().includes(query);
      const userEmailMatch = o.userEmail?.toLowerCase().includes(query);
      const recipientNameMatch = o.deliveryDetails?.name?.toLowerCase().includes(query);
      const recipientPhoneMatch = o.deliveryDetails?.phone?.toLowerCase().includes(query);
      
      if (!orderIdMatch && !userNameMatch && !userEmailMatch && !recipientNameMatch && !recipientPhoneMatch) {
        return false;
      }
    }
    
    // 2. Date Filter
    if (orderFilterDate !== '') {
      const localDate = new Date(o.createdAt);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const formattedLocalDate = `${year}-${month}-${day}`;
      if (formattedLocalDate !== orderFilterDate) {
        return false;
      }
    }

    // 3. Status Filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'active') {
        // Active orders: Pending, Accepted, Packed, Shipped, Out for Delivery
        if (['Delivered', 'Cancelled', 'Rejected'].includes(o.status)) {
          return false;
        }
      } else if (orderStatusFilter === 'today') {
        // Today's orders in local timezone
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        const isToday = orderDate.getDate() === today.getDate() &&
                        orderDate.getMonth() === today.getMonth() &&
                        orderDate.getFullYear() === today.getFullYear();
        if (!isToday) {
          return false;
        }
      } else {
        // Exact status match
        if (o.status !== orderStatusFilter) {
          return false;
        }
      }
    }
    
    return true;
  });

  // PRODUCT ACTIONS
  const openAddProduct = () => {
    setEditingProduct(null);
    const initialStock = {};
    shops.forEach(s => {
      initialStock[s.id] = 999;
    });
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'Oils & Lubricants',
      brand: '',
      image: '',
      stock: initialStock,
      iINR: '',
      caseQuantity: ''
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    const itemStock = {};
    shops.forEach(s => {
      itemStock[s.id] = prod.stock?.[s.id] !== undefined ? prod.stock[s.id] : 0;
    });
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price.toString(),
      originalPrice: prod.originalPrice?.toString() || '',
      category: prod.category,
      brand: prod.brand,
      image: prod.image || '',
      stock: itemStock,
      iINR: prod.iINR || '',
      caseQuantity: prod.caseQuantity?.toString() || ''
    });
    setProductModalOpen(true);
  };

  const handleProductStockChange = (shopId, value) => {
    setProductForm(prev => ({
      ...prev,
      stock: {
        ...prev.stock,
        [shopId]: parseInt(value) || 0
      }
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    if (productForm.caseQuantity !== undefined && productForm.caseQuantity !== null && productForm.caseQuantity !== '') {
      const caseQtyNum = parseInt(productForm.caseQuantity);
      if (isNaN(caseQtyNum) || caseQtyNum < 1 || caseQtyNum > 30) {
        showFlashAlert(false, 'Case Quantity must be a number between 1 and 30.');
        setBtnLoading(false);
        return;
      }
    }

    try {
      const endpoint = editingProduct ? `/products/${editingProduct.id}` : '/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await authenticatedFetch(endpoint, {
        method,
        body: JSON.stringify(productForm)
      });

      if (response.ok) {
        showFlashAlert(true, `Product successfully ${editingProduct ? 'updated' : 'created'}!`);
        setProductModalOpen(false);
        loadDashboardDataSilently();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Operation failed.');
      }
    } catch (err) {
      showFlashAlert(false, err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from stock?`)) return;
    try {
      const response = await authenticatedFetch(`/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showFlashAlert(true, 'Product successfully removed from listing.');
        loadDashboardDataSilently();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Delete operation failed.');
      }
    } catch (err) {
      showFlashAlert(false, err.message);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete member "${name}"? This action is permanent.`)) return;
    try {
      const response = await authenticatedFetch(`/users/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showFlashAlert(true, 'Member successfully deleted.');
        loadDashboardDataSilently();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Delete operation failed.');
      }
    } catch (err) {
      showFlashAlert(false, err.message);
    }
  };

  const generateCustomerWhatsAppUrl = (order, type = 'Accepted') => {
    if (!order || !order.deliveryDetails?.phone) return '';
    const formattedTotal = order.totalPrice?.toLocaleString('en-IN');
    const itemsList = order.items?.map(item => `• ${item.name} (Qty: ${item.quantity}) - ₹${((item.price || 0) * item.quantity).toLocaleString('en-IN')}`).join('\n') || '';
    
    let title = '';
    let body = '';
    let footer = 'Thank you for choosing Manisha Tyres & Lubricants!';

    if (type === 'Accepted') {
      title = '*Order Accepted Successfully* ✅';
      body = `We are pleased to inform you that your order #${order.id} has been accepted by our distributor team.`;
    } else if (type === 'Shipped') {
      title = '*Order Shipped* 🚚';
      body = `Great news! Your order #${order.id} has been shipped by our team and is on the way.`;
      footer = `Our delivery partner will contact you shortly.\n\nThank you for choosing Manisha Tyres & Lubricants!`;
    } else if (type === 'Delivered') {
      title = '*Order Delivered Successfully* ✅';
      body = `We are happy to inform you that your order #${order.id} has been delivered successfully.`;
      footer = `Thank you for choosing Manisha Tyres & Lubricants! We hope to serve you again.`;
    }

    const message = `${title}
----------------------------------
Dear ${order.deliveryDetails?.name || ''},

${body}

🛍️ *Order Items:*
${itemsList}

💰 *Total Billing:* ₹${formattedTotal}

${footer}
----------------------------------`;

    const cleanPhone = order.deliveryDetails.phone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // ORDER ACTIONS
  const handleUpdateOrderStatus = async (orderId, nextStatus, newWindow = null) => {
    try {
      const response = await authenticatedFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        showFlashAlert(true, `Order status set to "${nextStatus}"`);
        loadDashboardDataSilently();
        
        if (['Accepted', 'Shipped', 'Delivered'].includes(nextStatus)) {
          try {
            const waUrl = generateCustomerWhatsAppUrl(updatedOrder, nextStatus);
            if (waUrl) {
              if (newWindow) {
                newWindow.location.href = waUrl;
              } else {
                window.open(waUrl, '_blank');
              }
            } else if (newWindow) {
              newWindow.close();
            }
          } catch (err) {
            console.error('Browser blocked WhatsApp redirection:', err);
            if (newWindow) newWindow.close();
          }
        } else if (newWindow) {
          newWindow.close();
        }
      } else {
        if (newWindow) newWindow.close();
        const err = await response.json();
        throw new Error(err.message || 'Status update failed.');
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      showFlashAlert(false, err.message);
    }
  };





  const extractOrderId = (message) => {
    if (!message) return null;
    const match = message.match(/#(orde-[a-zA-Z0-9-]+)/i);
    return match ? match[1] : null;
  };

  const handleNotificationClick = (n) => {
    const orderId = extractOrderId(n.message);
    if (orderId) {
      setHighlightedOrderId(orderId);
      setActiveTab('orders');
      
      // Scroll to the order row
      setTimeout(() => {
        const row = document.getElementById(`order-row-${orderId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  // NOTIFICATION CLEANING
  const handleClearNotifications = async () => {
    try {
      const response = await authenticatedFetch('/notifications/read-all', {
        method: 'PUT'
      });
      if (response.ok) {
        setUnreadCount(0);
        // Map local array to read
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const response = await authenticatedFetch(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const target = notifications.find(n => n.id === notificationId);
        if (target && !target.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-indigo-650 dark:text-indigo-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Syncing distributor networks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      
      {/* Live Toast SSE Notification Alert */}
      {toastNotif && (
        <div className="fixed top-20 right-4 z-50 w-80 p-4 rounded-2xl bg-indigo-600 dark:bg-indigo-950 text-white shadow-2xl border border-indigo-500/50 animate-in slide-in-from-right duration-300 flex gap-3">
          <BellRing className="w-6 h-6 text-indigo-300 animate-bounce flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm">{toastNotif.title}</h4>
            <p className="text-xs text-indigo-100">{toastNotif.message}</p>
            <span className="inline-block text-[9px] text-indigo-300">Just now</span>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 border-gray-150 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-indigo-650 dark:text-indigo-400" /> Admin Distributor Portal
          </h1>
          <p className="text-sm text-gray-400">Review sales metrics, configure parts list, and manage retail shop stocks.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-900 text-white dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Website</span>
          </Link>
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
          
          {/* SSE Status marker */}
          <button
            onClick={connectSSE}
            disabled={sseStatus === 'connected' || sseStatus === 'connecting'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-950 text-xs font-semibold text-gray-600 dark:text-gray-400 border hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:pointer-events-none"
            title={sseStatus === 'disconnected' ? "Click to reconnect to stream" : undefined}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${
              sseStatus === 'connected' 
                ? 'bg-emerald-500 animate-ping' 
                : sseStatus === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500'
            }`}></span>
            <span>
              {sseStatus === 'connected' && 'SSE Streams: Live Connection Active'}
              {sseStatus === 'connecting' && 'SSE Streams: Connecting...'}
              {sseStatus === 'disconnected' && 'SSE Streams: Disconnected (Click to Reconnect)'}
            </span>
          </button>
        </div>
      </div>

      {/* Global Alerts bar */}
      {alertMessage && (
        <div className={`p-3 text-center text-xs font-semibold rounded-xl border animate-fade-in ${
          alertMessage.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
        }`}>
          {alertMessage.text}
        </div>
      )}

      {/* Admin Tabs Toggle */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 gap-1.5">
        {[
          { id: 'overview', name: 'Performance Metrics', icon: TrendingUp },
          { id: 'products', name: 'Products Inventory', icon: Package },
          { id: 'orders', name: 'Order Actions', icon: ShoppingBag },
          { id: 'feedback', name: 'Customer Feedback', icon: MessageSquare },
          { id: 'members', name: 'Registered Members', icon: Users },
          { id: 'admin-roster', name: 'Admin', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                loadDashboardDataSilently();
              }}
              className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-600/5 font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {tab.id === 'overview' && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Revenue */}
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-650 shadow-md">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase">Gross Revenue</p>
                  <select
                    value={revenuePeriod}
                    onChange={(e) => setRevenuePeriod(e.target.value)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-900/40 rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All-Time</option>
                    <option value="monthly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Monthly</option>
                    <option value="weekly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Weekly</option>
                    <option value="today" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">Day Wise</option>
                  </select>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">₹{totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 ml-4">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            {/* Total Orders */}
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-650 shadow-md">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                  <select
                    value={ordersPeriod}
                    onChange={(e) => setOrdersPeriod(e.target.value)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-900/40 rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All-Time</option>
                    <option value="monthly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Monthly</option>
                    <option value="weekly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Weekly</option>
                    <option value="today" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">Day Wise</option>
                  </select>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalOrders}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 ml-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* Active Orders */}
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-650 shadow-md">
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase">Active Orders</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  {orders.filter(o => !['Delivered', 'Cancelled', 'Rejected'].includes(o.status)).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 ml-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* Total Products */}
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-650 shadow-md">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase">Inventory SKUs</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalProducts}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* Customers */}
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-650 shadow-md">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase">Customers Roster</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalCustomers}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Live Alerts & Notification Stream Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notification logger */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-gray-150 dark:border-gray-800 flex-wrap gap-2">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" /> Notifications Feed {unreadCount > 0 && <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-black animate-pulse">{unreadCount} new</span>}
                </h3>
                <div className="flex items-center gap-3">
                  <select
                    value={notifPeriod}
                    onChange={(e) => setNotifPeriod(e.target.value)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-900/40 rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All-Time</option>
                    <option value="monthly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Monthly</option>
                    <option value="weekly" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Weekly</option>
                    <option value="today" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">Day Wise</option>
                  </select>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto" />
                  <p className="text-sm">Notification log is clean.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {filteredNotifications.map((n, idx) => {
                    const orderId = extractOrderId(n.message);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => orderId && handleNotificationClick(n)}
                        className={`pt-3.5 first:pt-0 flex items-start justify-between gap-3 text-xs ${
                          orderId ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-850/50 p-1.5 rounded-xl transition-all' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <h5 className={`font-bold flex items-center gap-1.5 ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-black'}`}>
                            {n.title}
                            {orderId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                View Order
                              </span>
                            )}
                          </h5>
                          <p className="text-gray-500 dark:text-gray-400">{n.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400 whitespace-nowrap text-right block">
                            {new Date(n.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                            <span className="block text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </span>
                          <button
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Branch Locations Stock Summaries list */}
            <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white border-b pb-3 border-gray-150 dark:border-gray-800">
                Shop Availability Summaries
              </h3>
              <div className="space-y-3.5">
                {shops.map(shop => {
                  // Count total units in this shop
                  const stockSum = products.reduce((acc, p) => acc + (p.stock?.[shop.id] || 0), 0);
                  
                  return (
                    <div key={shop.id} className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-2xl flex flex-col justify-between gap-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-950 dark:text-white truncate max-w-[160px]">{shop.name}</span>
                        <span className="text-indigo-500 dark:text-indigo-400">{stockSum} units in stock</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight truncate">{shop.location}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGER */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border flex-wrap gap-3">
            <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Active Products ({products.length})</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowOutStockOnly(prev => !prev)}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all border ${
                  showOutStockOnly 
                    ? 'bg-red-600 text-white border-red-500 hover:bg-red-700' 
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {showOutStockOnly ? 'Showing Out Stock Only' : 'Out Stock Only'}
              </button>
              <button
                onClick={openAddProduct}
                className="btn-primary py-2 text-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product SKU
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 border rounded-3xl">
              <p className="text-gray-400 text-sm">No products in inventory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border bg-white dark:bg-gray-900 shadow-md">
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950 font-bold text-gray-400 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Item SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Branch Stocks</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-semibold text-gray-750 dark:text-gray-300">
                  {products
                    .filter(p => {
                      if (!showOutStockOnly) return true;
                      if (!p.stock) return true;
                      return Object.values(p.stock).every(qty => qty === 0);
                    })
                    .map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-955 border flex-shrink-0">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, p.category, p.name)} />
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-955 dark:text-white line-clamp-1 max-w-[200px]">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">ID: {p.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-950/20 text-indigo-500 text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.brand}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white">₹{p.price.toFixed(2)}</td>
                      <td className="px-6 py-4 space-y-0.5 text-[10px] font-medium text-gray-550">
                        {shops.map(s => {
                          const stockCount = p.stock?.[s.id] ?? 0;
                          return (
                            <div key={s.id} className={stockCount === 0 ? "text-red-500 font-bold" : ""}>
                              <span className="font-bold">Stock:</span> {stockCount} {stockCount === 0 && <span className="text-[8px] font-black uppercase tracking-wider pl-0.5">(Out Stock)</span>}
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-950/20 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDER MANAGER */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Customer Purchases ({filteredOrders.length})</h3>
              <p className="text-xs text-gray-400 mt-0.5">Search and filter customer purchase records.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <input
                type="text"
                placeholder="Search by ID, customer, phone..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-60 px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />

              {/* Date calendar picker */}
              <input
                type="date"
                value={orderFilterDate}
                onChange={(e) => setOrderFilterDate(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white font-semibold cursor-pointer"
              />

              {/* Status Filter Dropdown */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white font-semibold cursor-pointer"
              >
                <option value="all">All Orders</option>
                <option value="active">Active Orders</option>
                <option value="today">Today's Orders</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Reset button if filter is active */}
              {(orderSearchQuery !== '' || orderFilterDate !== '' || orderStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setOrderSearchQuery('');
                    setOrderFilterDate('');
                    setOrderStatusFilter('all');
                  }}
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 border rounded-3xl">
              <p className="text-gray-400 text-sm">No orders recorded in system.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 border rounded-3xl">
              <p className="text-gray-400 text-sm">No orders match your search query or selected date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border bg-white dark:bg-gray-900 shadow-md">
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950 font-bold text-gray-400 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Order Ref</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total Cost</th>
                    <th className="px-6 py-4">Delivery Recipient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-semibold text-gray-750 dark:text-gray-300">
                  {filteredOrders.map(o => (
                    <tr 
                      key={o.id} 
                      id={`order-row-${o.id}`}
                      className={`transition-all duration-500 hover:bg-gray-50/50 dark:hover:bg-gray-850/50 ${
                        highlightedOrderId === o.id 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 outline outline-2 outline-indigo-500' 
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {o.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{o.userName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{o.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-950 dark:text-white">₹{o.totalPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 space-y-0.5 text-[10px] font-medium text-gray-500">
                        <p><span className="font-bold text-gray-400">Name:</span> {o.deliveryDetails?.name}</p>
                        <p><span className="font-bold text-gray-400">Phone:</span> {o.deliveryDetails?.phone}</p>
                        <p className="max-w-[200px] truncate"><span className="font-bold text-gray-400">Addr:</span> {o.deliveryDetails?.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                          o.status === 'Delivered' 
                            ? 'bg-slate-100 text-slate-850 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800' 
                            : o.status === 'Shipped'
                              ? 'bg-indigo-100 text-indigo-850 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                              : o.status === 'Accepted'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900'
                                : o.status === 'Rejected'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900'
                                  : 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/10 dark:text-indigo-400 border-indigo-500/10 animate-pulse'
                        }`}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        {/* WhatsApp Notify Button for Accepted or Shipped */}
                        {['Accepted', 'Shipped'].includes(o.status) && (
                          <a
                            href={generateCustomerWhatsAppUrl(o, o.status)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-white rounded-lg hover:opacity-95 transition-all text-[11px] font-bold shadow-sm mr-2"
                            style={{ backgroundColor: '#25D366' }}
                            title="Notify Customer via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                            <span>Notify Customer</span>
                          </a>
                        )}
                        {/* Pending -> Accept / Reject */}
                        {o.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                const newWin = window.open('about:blank', '_blank');
                                handleUpdateOrderStatus(o.id, 'Accepted', newWin);
                              }}
                              className="px-2 py-1 bg-indigo-650 text-white rounded-lg hover:bg-indigo-750 transition-colors"
                              title="Accept Order"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, 'Rejected')}
                              className="px-2 py-1 bg-red-650 text-white rounded-lg hover:bg-red-750 transition-colors"
                              title="Reject Order"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {/* Accepted -> Ship */}
                        {o.status === 'Accepted' && (
                          <button
                            onClick={() => {
                              const newWin = window.open('about:blank', '_blank');
                              handleUpdateOrderStatus(o.id, 'Shipped', newWin);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Ship Package
                          </button>
                        )}
                        {/* Shipped -> Deliver */}
                        {o.status === 'Shipped' && (
                          <button
                            onClick={() => {
                              const newWin = window.open('about:blank', '_blank');
                              handleUpdateOrderStatus(o.id, 'Delivered', newWin);
                            }}
                            className="px-2.5 py-1 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {/* Completed state */}
                        {['Delivered', 'Rejected'].includes(o.status) && (
                          <span className="text-[10px] text-gray-400 font-bold">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ADD PRODUCT */}
      {activeTab === 'add-product' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-md space-y-6 max-w-2xl mx-auto">
            <div className="border-b pb-4 border-gray-150 dark:border-gray-800">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Add New Product SKU
              </h3>
              <p className="text-xs text-gray-400 mt-1">Specify part specifications, brand information, and stock numbers per location branch.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setBtnLoading(true);

              if (productForm.caseQuantity !== undefined && productForm.caseQuantity !== null && productForm.caseQuantity !== '') {
                const caseQtyNum = parseInt(productForm.caseQuantity);
                if (isNaN(caseQtyNum) || caseQtyNum < 1 || caseQtyNum > 30) {
                  showFlashAlert(false, 'Case Quantity must be a number between 1 and 30.');
                  setBtnLoading(false);
                  return;
                }
              }

              try {
                const response = await authenticatedFetch('/products', {
                  method: 'POST',
                  body: JSON.stringify(productForm)
                });

                if (response.ok) {
                  showFlashAlert(true, 'Product successfully created and added to shop!');
                  setActiveTab('products');
                  loadDashboardDataSilently();
                } else {
                  const err = await response.json();
                  throw new Error(err.message || 'Operation failed.');
                }
              } catch (err) {
                showFlashAlert(false, err.message);
              } finally {
                setBtnLoading(false);
              }
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Castrol EDGE Motor Oil"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white font-semibold"
                  >
                    <option value="Oils & Lubricants">Oils & Lubricants</option>
                    <option value="Batteries & Power">Batteries & Power</option>
                    <option value="Tyres & Wheels">Tyres & Wheels</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Castrol, Michelin"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="39.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Original Price (₹) <span className="text-[10px] text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Case Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    list="tab-case-qty-options"
                    placeholder="Select or enter quantity (1–30)"
                    value={productForm.caseQuantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, caseQuantity: e.target.value }))}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                  <datalist id="tab-case-qty-options">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={productForm.image}
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Description</label>
                <textarea
                  rows={3}
                  placeholder="Engine specifications, dimensions, features..."
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              {/* Multi-Shop stock forms */}
              <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Assign Stock Levels Per Branch
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedStock = {};
                      shops.forEach(s => {
                        updatedStock[s.id] = 0;
                      });
                      setProductForm(prev => ({ ...prev, stock: updatedStock }));
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors active:scale-95"
                  >
                    Out Stock Only
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {shops.map(shop => {
                    const isOutVal = (productForm.stock[shop.id] ?? 0) === 0;
                    return (
                      <div key={shop.id} className="space-y-1.5 bg-gray-50 dark:bg-gray-955 p-2.5 rounded-xl border text-center">
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate" title={shop.name}>
                          Stock {isOutVal && <span className="text-red-500 font-extrabold text-[8px] block uppercase tracking-wider mt-0.5">(Out Stock)</span>}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.stock[shop.id] !== undefined ? productForm.stock[shop.id] : 0}
                          onChange={(e) => handleProductStockChange(shop.id, e.target.value)}
                          className="block w-full text-center px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit footer */}
              <div className="border-t border-gray-150 dark:border-gray-800 pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="flex-1 btn-primary py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 flex items-center justify-center gap-1 font-bold text-white uppercase tracking-wider"
                >
                  {btnLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Product SKU</span>
                </button>
                <button
                  type="button; setActiveTab('products')"
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: CUSTOMER FEEDBACK MANAGEMENT */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border flex justify-between items-center">
            <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Customer Reviews & Feedback ({feedbacks.length})</h3>
          </div>

          <div className="overflow-x-auto rounded-3xl border bg-white dark:bg-gray-900 shadow-md">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-950 font-bold text-gray-400 uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4">Review ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment Review</th>
                  <th className="px-6 py-4">Date Posted</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-semibold text-gray-750 dark:text-gray-300">
                {feedbacks.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-400">{f.id}</td>
                    <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white">{f.userName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map(starIdx => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              f.rating >= starIdx ? 'fill-amber-400 stroke-amber-400' : 'stroke-gray-305 dark:stroke-slate-700 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 italic max-w-xs truncate" title={f.comment}>
                      "{f.comment}"
                    </td>
                    <td className="px-6 py-4">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteFeedback(f.id)}
                        className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:bg-red-950/20 dark:border-red-905/30 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* TAB 10: ADMIN ROSTER */}
      {activeTab === 'admin-roster' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border flex justify-between items-center">
            <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Admin Directory ({admins.length})</h3>
            <button
              onClick={() => setActiveTab('add-admin')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border bg-white dark:bg-gray-900 shadow-md">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-950 font-bold text-gray-400 uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-semibold text-gray-750 dark:text-gray-300">
                {adminsLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading admins...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">No admins found.</td>
                  </tr>
                ) : (
                  admins.map(adm => (
                    <tr key={adm.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-400">{adm.id}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white">{adm.name}</td>
                      <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{adm.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-indigo-600/5 text-indigo-600 border border-indigo-500/10 rounded-md font-bold uppercase tracking-wider text-[9px]">
                          {adm.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 12: REGISTERED MEMBERS */}
      {activeTab === 'members' && (() => {
        const allMembers = customers;
        const googleOrEmailCount = allMembers.filter(c => !c.email?.endsWith('@autohub.com')).length;
        const mobileOtpCount = allMembers.filter(c => c.email?.endsWith('@autohub.com')).length;

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border">
              <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Registered Members Directory ({allMembers.length})</h3>
              <p className="text-xs text-gray-400 mt-0.5">Directory of all registered retail customers, delivery staff, managers, and administrators.</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border bg-white dark:bg-gray-900 shadow-md">
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-955 font-bold text-gray-400 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Member ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email / Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Cancelled</th>
                    <th className="px-6 py-4">Registration Method</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-semibold text-gray-750 dark:text-gray-300">
                  {allMembers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-400">No registered members found.</td>
                    </tr>
                  ) : (
                    allMembers.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-450">{member.id}</td>
                        <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white">{member.name}</td>
                        <td className="px-6 py-4">
                          {!member.email?.endsWith('@autohub.com') && (
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">{member.email}</p>
                          )}
                          {member.phone && (
                            <p className="text-[11px] text-gray-500 font-mono">Phone: {member.phone}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] ${
                            member.role === 'customer' 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' 
                              : member.role === 'delivery' 
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10' 
                              : 'bg-indigo-650/10 text-indigo-600 border border-indigo-500/10'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {member.role === 'customer' ? orders.filter(o => o.userId === member.id).length : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-red-650 dark:text-red-400">
                          {member.role === 'customer' ? orders.filter(o => o.userId === member.id && o.status === 'Cancelled').length : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                            member.registrationMethod === 'Google Auth'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/10'
                              : member.registrationMethod === 'Mobile OTP'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                              : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/10'
                          }`}>
                            {member.registrationMethod || 'Email / Google'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 11: ADD NEW SYSTEM ADMIN */}
      {activeTab === 'add-admin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border flex justify-between items-center">
            <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">Add System Admin</h3>
            <button
              onClick={() => setActiveTab('admin-roster')}
              className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to List
            </button>
          </div>

          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border rounded-3xl p-6 shadow-md">
            {addAdminSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-150 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">New system admin account created successfully!</span>
              </div>
            )}

            {addAdminError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-150 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{addAdminError}</span>
              </div>
            )}

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manisha Sharma"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. manisha@autodist.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter a secure password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdmin}
                className="w-full btn-primary py-2.5 text-xs bg-indigo-600 hover:bg-indigo-755 focus:ring-indigo-500 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
              >
                {submittingAdmin && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Register Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product SKU' : 'Add New Product SKU'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scroll Content */}
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Castrol EDGE Motor Oil"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white font-semibold"
                  >
                    <option value="Oils & Lubricants">Oils & Lubricants</option>
                    <option value="Batteries & Power">Batteries & Power</option>
                    <option value="Tyres & Wheels">Tyres & Wheels</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Castrol, Michelin"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="39.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Original Price (₹) <span className="text-[10px] text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Case Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    list="modal-case-qty-options"
                    placeholder="Select or enter quantity (1–30)"
                    value={productForm.caseQuantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, caseQuantity: e.target.value }))}
                    className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                  <datalist id="modal-case-qty-options">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={productForm.image}
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Description</label>
                <textarea
                  rows={2}
                  placeholder="Engine specifications, dimensions, features..."
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              {/* Multi-Shop stock forms */}
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Assign Stock Levels Per Branch
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedStock = {};
                      shops.forEach(s => {
                        updatedStock[s.id] = 0;
                      });
                      setProductForm(prev => ({ ...prev, stock: updatedStock }));
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors active:scale-95"
                  >
                    Out Stock Only
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {shops.map(shop => {
                    const isOutVal = (productForm.stock[shop.id] ?? 0) === 0;
                    return (
                      <div key={shop.id} className="space-y-1.5 bg-gray-50 dark:bg-gray-955 p-2.5 rounded-xl border text-center">
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate" title={shop.name}>
                          Stock {isOutVal && <span className="text-red-500 font-extrabold text-[8px] block uppercase tracking-wider mt-0.5">(Out Stock)</span>}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.stock[shop.id] !== undefined ? productForm.stock[shop.id] : 0}
                          onChange={(e) => handleProductStockChange(shop.id, e.target.value)}
                          className="block w-full text-center px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>              {/* Submit footer inside modal */}
              <div className="border-t border-gray-150 dark:border-gray-800 pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="flex-1 btn-primary py-2 text-sm bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 flex items-center justify-center gap-1 font-bold"
                >
                  {btnLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? 'Save Product Changes' : 'Create Product SKU'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-800 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};

export default AdminDashboard;
