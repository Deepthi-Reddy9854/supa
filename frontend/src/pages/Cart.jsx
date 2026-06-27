import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Trash2, 
  MapPin, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  Tag,
  CheckCircle
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';


const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { authenticatedFetch, user } = useAuth();

  // Delivery details form state
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    notes: ''
  });

  // Coupon promo code
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type: 'percent'|'flat', value }
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Loyalty points
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Page states
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setDeliveryDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = (e) => {
    const idx = e.target.value;
    if (idx === '') {
      setDeliveryDetails({
        name: user?.name || '',
        phone: user?.phone || '',
        address: '',
        notes: ''
      });
      return;
    }
    const selected = user?.addresses?.[parseInt(idx)];
    if (selected) {
      setDeliveryDetails({
        name: selected.name,
        phone: selected.phone,
        address: selected.address,
        notes: ''
      });
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.toUpperCase().trim();
    
    if (code === 'AUTOHUB10') {
      setAppliedCoupon({ code, type: 'percent', value: 10 });
      setCouponSuccess('10% off applied successfully!');
    } else if (code === 'BIGSAVINGS') {
      if (totalPrice < 5000) {
        setCouponError('BIGSAVINGS requires minimum purchase of ₹5,000.');
      } else {
        setAppliedCoupon({ code, type: 'flat', value: 500 });
        setCouponSuccess('₹500 discount applied successfully!');
      }
    } else {
      setCouponError('Invalid coupon code. Try "AUTOHUB10" or "BIGSAVINGS".');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Calculations
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      couponDiscount = totalPrice * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'flat') {
      couponDiscount = appliedCoupon.value;
    }
  }

  const postCouponTotal = totalPrice - couponDiscount;

  const pointsDiscount = 0;
  const finalTotal = Math.max(0, postCouponTotal);

  const generateWhatsAppUrl = (order) => {
    if (!order) return '';
    const formattedTotal = order.totalPrice?.toLocaleString('en-IN');
    const itemsList = order.items?.map(item => `• ${item.name} (Qty: ${item.quantity}) - ₹${((item.price || 0) * item.quantity).toLocaleString('en-IN')}`).join('\n') || '';
    
    const message = `*New Order Placed* 📦
----------------------------------
👤 *Customer Name:* ${order.deliveryDetails?.name || ''}
📞 *Phone Number:* ${order.deliveryDetails?.phone || ''}
📍 *Location:* ${order.deliveryDetails?.address || ''}
💳 *Payment Method:* Cash on Delivery (COD) Only

🛍️ *Order Items:*
${itemsList}

💰 *Total Billing:* ₹${formattedTotal}
----------------------------------`;

    return `https://api.whatsapp.com/send?phone=919849643618&text=${encodeURIComponent(message)}`;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutLoading(true);

    const phoneDigits = deliveryDetails.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setCheckoutError('Please enter a valid 10-digit contact phone number.');
      setCheckoutLoading(false);
      return;
    }

    try {
        const itemsPayload = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: (item.purchaseType === 'case' || item.purchaseType === 'carton') ? item.quantity * (item.itemsPerCase || item.itemsPerCarton || 20) : item.quantity,
        shopId: item.shopId,
        shopName: item.shopName,
        image: item.image,
        category: item.category
      }));

      const response = await authenticatedFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsPayload,
          deliveryDetails,
          deductPoints: false,
          gstNumber: '',
          couponCode: appliedCoupon?.code || null,
          paymentMethod: 'Cash on Delivery (COD)',
          totalPrice: finalTotal
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed.');
      }

      setOrderConfirmed(data);
      clearCart();

      // Auto-open WhatsApp message redirect
      try {
        const waUrl = generateWhatsAppUrl(data);
        window.open(waUrl, '_blank');
      } catch (err) {
        console.error('Browser blocked WhatsApp redirection:', err);
      }
    } catch (err) {
      setCheckoutError(err.message || 'Server error placing your order.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-gray-900 dark:text-gray-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-250 dark:border-emerald-900/30">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400 fill-current animate-bounce" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.989-1.874-1.875-4.35-2.907-6.992-2.908-5.441 0-9.866 4.42-9.871 9.867-.001 1.737.457 3.432 1.328 4.922L1.875 22.1l4.772-1.253l-.001-.001zM17.586 14.41c-.29-.145-1.71-.845-1.973-.94-.265-.1-.456-.145-.648.145-.19.29-.74.94-.908 1.134-.166.19-.333.213-.623.068c-.29-.145-1.226-.452-2.335-1.441-.864-.771-1.447-1.724-1.617-2.014-.17-.29-.018-.447.127-.591.13-.13.29-.34.435-.508.145-.17.193-.29.29-.483.097-.19.048-.36-.024-.508-.07-.145-.648-1.56-.888-2.137-.233-.56-.47-.482-.648-.492a30.12 30.12 0 0 0-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.776 1.16 2.97c.145.19 2.01 3.07 4.87 4.31c.68.295 1.21.47 1.62.6c.683.217 1.3.186 1.79.112.546-.08 1.71-.7 1.95-1.376.24-.677.24-1.258.17-1.377-.07-.12-.26-.19-.55-.336z"/>
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-450">WhatsApp Order Placed!</h2>
          <p className="text-xs text-gray-400">Your order has been recorded in our system. A WhatsApp window should have opened to send the details directly to the distributor.</p>
          <span className="inline-block mt-2 font-mono text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 font-extrabold text-emerald-600 dark:text-emerald-450">
            Order Reference: {orderConfirmed.id}
          </span>
        </div>

        {/* Order review details */}
        <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-left text-xs space-y-2.5 bg-gray-50 dark:bg-gray-950">
          <div className="flex justify-between font-semibold">
            <span>Customer Name:</span>
            <span>{orderConfirmed.deliveryDetails?.name}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Contact Phone:</span>
            <span>{orderConfirmed.deliveryDetails?.phone}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Location:</span>
            <span>{orderConfirmed.deliveryDetails?.address}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-150 dark:border-gray-800 pt-2">
            <span>Payment Method:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Cash on Delivery (COD) Only</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-2 font-bold text-sm text-gray-900 dark:text-white">
            <span>Total Billing:</span>
            <span>₹{orderConfirmed.totalPrice?.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5 space-y-2.5">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] block">Items Ordered:</span>
            {orderConfirmed.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px] font-semibold text-gray-750 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" onError={(e) => handleImageError(e, item.category, item.name)} />
                  </div>
                  <span className="truncate max-w-[180px] font-bold text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <span>{item.quantity} x ₹{item.price.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={generateWhatsAppUrl(orderConfirmed)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.989-1.874-1.875-4.35-2.907-6.992-2.908-5.441 0-9.866 4.42-9.871 9.867-.001 1.737.457 3.432 1.328 4.922L1.875 22.1l4.772-1.253l-.001-.001zM17.586 14.41c-.29-.145-1.71-.845-1.973-.94-.265-.1-.456-.145-.648.145-.19.29-.74.94-.908 1.134-.166.19-.333.213-.623.068c-.29-.145-1.226-.452-2.335-1.441-.864-.771-1.447-1.724-1.617-2.014-.17-.29-.018-.447.127-.591.13-.13.29-.34.435-.508.145-.17.193-.29.29-.483.097-.19.048-.36-.024-.508-.07-.145-.648-1.56-.888-2.137-.233-.56-.47-.482-.648-.492a30.12 30.12 0 0 0-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.776 1.16 2.97c.145.19 2.01 3.07 4.87 4.31c.68.295 1.21.47 1.62.6c.683.217 1.3.186 1.79.112.546-.08 1.71-.7 1.95-1.376.24-.677.24-1.258.17-1.377-.07-.12-.26-.19-.55-.336z"/>
            </svg>
            Send / Reopen WhatsApp Chat
          </a>
          <div className="flex gap-4">
            <Link to="/" className="flex-1 py-2.5 bg-black hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-4 shadow-lg text-gray-900 dark:text-gray-100">
        <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
        <div>
          <h3 className="font-extrabold text-lg uppercase tracking-tight">Your shopping cart is empty</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Browse our automotive catalog to select tyres, lubricants, and engine spares.</p>
        </div>
        <Link to="/" className="btn-primary inline-block py-2.5 text-xs font-bold uppercase tracking-wider px-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-black tracking-tight uppercase mb-8">Checkout Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-5 md:p-6 rounded-none shadow-md space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider border-b pb-3 border-gray-100 dark:border-gray-800">
              Cart Items ({cartItems.length})
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.shopId}-${item.purchaseType}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 first:pt-0 gap-4">
                  {/* Left info image */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-955 rounded-lg overflow-hidden flex-shrink-0 border dark:border-gray-800">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" onError={(e) => handleImageError(e, item.category, item.name)} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white line-clamp-1 max-w-[250px] uppercase">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5 uppercase">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {item.shopName}
                      </p>
                      {(item.purchaseType === 'case' || item.purchaseType === 'carton') && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold mt-1 uppercase tracking-wide">
                          Case Pack ({item.itemsPerCase || item.itemsPerCarton || 20} Items)
                        </span>
                      )}
                      <span className="text-xs font-bold text-indigo-600 block mt-1">₹{item.price.toLocaleString('en-IN')} {(item.purchaseType === 'case' || item.purchaseType === 'carton') ? 'per Case' : 'per Unit'}</span>
                    </div>
                  </div>

                  {/* Quantity Controller & Remove button */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-0 pt-2 sm:pt-0 dark:border-gray-800">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-955">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.shopId, item.quantity - 1, item.purchaseType)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 font-bold focus:outline-none disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-800 dark:text-white">{item.quantity} {(item.purchaseType === 'case' || item.purchaseType === 'carton') ? 'case' : 'qty'}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.shopId, item.quantity + 1, item.purchaseType)}
                        disabled={item.quantity >= 200 || item.quantity >= item.maxStock}
                        className="px-2.5 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-855 text-gray-600 dark:text-gray-300 font-bold focus:outline-none disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal cost */}
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Trash */}
                    <button
                      onClick={() => removeFromCart(item.productId, item.shopId, item.purchaseType)}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline uppercase">
            <ArrowLeft className="w-4 h-4" /> Continue browsing products catalog
          </Link>
        </div>

        {/* Right Column: Checkout Billing & Address Form */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Order Summary & Coupon Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-6 shadow-md space-y-6">
            
            {/* Price Calculations */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-gray-950 dark:text-white border-b pb-3 border-gray-100 dark:border-gray-800 uppercase">
                Order Billing
              </h3>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                <span>Subtotal Items cost:</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-xs text-red-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Coupon Discount ({appliedCoupon.code}):
                  </span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}



              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                <span>Delivery fees:</span>
                <span className="text-emerald-500 font-bold uppercase text-[10px]">Free distributor shipping</span>
              </div>

              <div className="flex justify-between border-t border-gray-150 dark:border-gray-800 pt-3 text-base font-black text-gray-900 dark:text-white">
                <span>Total Billing:</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Promo Coupon Form */}
            <div className="space-y-2.5 border-t border-gray-100 dark:border-gray-800 pt-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Apply Promo Code
              </label>
              
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-950 p-2 border dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{appliedCoupon.code} active</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. AUTOHUB10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-[10px]"
                  >
                    Apply
                  </button>
                </div>
              )}
              
              {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
            </div>



            {/* Error alerts */}
            {checkoutError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded-none border border-red-200 dark:border-red-900/30 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Shipping Address & Checkout Form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Delivery Details</h4>

              {/* Saved Address Book select dropdown */}
              {user?.addresses?.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Saved Address</label>
                  <select
                    onChange={handleAddressSelect}
                    className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-xs font-bold uppercase focus:ring-1 focus:ring-black focus:outline-none dark:text-white"
                  >
                    <option value="">-- Use custom delivery address --</option>
                    {user.addresses.map((addr, idx) => (
                      <option key={idx} value={idx}>
                        {addr.label} ({addr.name} - {addr.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter recipient full name"
                  value={deliveryDetails.name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-black dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 9876500000"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={deliveryDetails.phone}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-955 focus:outline-none focus:ring-1 focus:ring-black dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shipping Address Coordinates</label>
                <textarea
                  name="address"
                  rows={2}
                  required
                  placeholder="Enter full workshop or residential address"
                  value={deliveryDetails.address}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-black dark:text-white"
                />
              </div>

              <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</label>
                <div className="flex items-center p-3 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs font-semibold rounded-none">
                  <div className="flex-1 text-left">
                    <span className="block font-black text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">Cash on Delivery (COD)</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5 font-normal leading-normal">Only Cash on Delivery is accepted. UPI (PhonePe, Google Pay, etc.) is not supported.</span>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-indigo-600 bg-indigo-600 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3.5 text-white font-extrabold text-xs uppercase tracking-widest rounded-none transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.989-1.874-1.875-4.35-2.907-6.992-2.908-5.441 0-9.866 4.42-9.871 9.867-.001 1.737.457 3.432 1.328 4.922L1.875 22.1l4.772-1.253l-.001-.001zM17.586 14.41c-.29-.145-1.71-.845-1.973-.94-.265-.1-.456-.145-.648.145-.19.29-.74.94-.908 1.134-.166.19-.333.213-.623.068c-.29-.145-1.226-.452-2.335-1.441-.864-.771-1.447-1.724-1.617-2.014-.17-.29-.018-.447.127-.591.13-.13.29-.34.435-.508.145-.17.193-.29.29-.483.097-.19.048-.36-.024-.508-.07-.145-.648-1.56-.888-2.137-.233-.56-.47-.482-.648-.492a30.12 30.12 0 0 0-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.776 1.16 2.97c.145.19 2.01 3.07 4.87 4.31c.68.295 1.21.47 1.62.6c.683.217 1.3.186 1.79.112.546-.08 1.71-.7 1.95-1.376.24-.677.24-1.258.17-1.377-.07-.12-.26-.19-.55-.336z"/>
                    </svg>
                    Confirm & Order via WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
