import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Star, 
  MapPin, 
  ShoppingBag, 
  ChevronLeft, 
  Loader2, 
  MessageSquare,
  AlertCircle,
  Heart
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';


const ProductDetail = () => {
  const { id } = useParams();
  const { authenticatedFetch, user, updateWishlist } = useAuth();
  const { addToCart } = useCart();

  // Data states
  const [product, setProduct] = useState(null);
  const [shops, setShops] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  const uniqueImages = product ? [...new Set(product.images || [product.image])].filter(Boolean) : [];


  // Selection states
  const [selectedShopId, setSelectedShopId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState('single');

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Page states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState('');

  // Fetch Product & Shops
  const loadProductData = async () => {
    try {
      // Fetch shops
      const shopsRes = await authenticatedFetch('/shops');
      let shopsData = [];
      if (shopsRes.ok) {
        shopsData = await shopsRes.json();
        setShops(shopsData);
      }

      // Fetch product
      const productRes = await authenticatedFetch(`/products/${id}`);
      if (!productRes.ok) {
        throw new Error('Product not found or database offline.');
      }
      const productData = await productRes.json();
      setProduct(productData);
      setActiveImage(productData.image);
      setImageLoadError(false);

      // Default selected shop branch to the first shop that has stock, or fallback to the first shop
      if (productData.stock && shopsData.length > 0) {
        const firstInStockShop = shopsData.find(s => productData.stock[s.id] > 0);
        if (firstInStockShop) {
          setSelectedShopId(firstInStockShop.id);
        } else {
          setSelectedShopId(shopsData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Retrieving automotive specs...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-gray-900 border rounded-3xl space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Failed to retrieve product details</h3>
        <p className="text-sm text-gray-400">{error || 'Unknown error occurred.'}</p>
        <Link to="/" className="btn-primary inline-block py-2 text-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Active shop values
  const activeShop = shops.find(s => s.id === selectedShopId);
  const activeStock = product.stock?.[selectedShopId] ?? 0;
  const itemsPerCase = product.caseQuantity || 20;
  const maxAllowedQty = purchaseType === 'case' || purchaseType === 'carton' ? Math.floor(activeStock / itemsPerCase) : activeStock;

  // Add to cart handler
  const handleAddToCart = () => {
    if (!selectedShopId || !activeShop) {
      setCartError('Please select a shop location branch.');
      return;
    }

    try {
      setCartError('');
      addToCart(product, selectedShopId, activeShop.name, quantity, purchaseType);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      setCartError(err.message);
    }
  };

  // Handle Wishlist Toggle
  const handleWishlistToggle = async () => {
    if (!user || !product) return;
    const isSaved = (user.wishlist || []).includes(product.id);
    try {
      if (isSaved) {
        const res = await authenticatedFetch(`/users/wishlist/${product.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const nextWishlist = (user.wishlist || []).filter(id => id !== product.id);
          updateWishlist(nextWishlist);
        }
      } else {
        const res = await authenticatedFetch('/users/wishlist', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id })
        });
        if (res.ok) {
          const nextWishlist = [...(user.wishlist || []), product.id];
          updateWishlist(nextWishlist);
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  // Submit rating and review handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);
    setSubmittingReview(true);

    try {
      const response = await authenticatedFetch(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit review.');
      }

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      setNewComment('');
      setReviewSuccess(true);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back button */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>
      </div>

      {/* Main product specs block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl">
        
        {/* Left Side: Dynamic Gallery / Image */}
        <div className="space-y-4">
          <div className="h-96 md:h-[450px] bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-150 dark:border-gray-800 shadow-inner flex items-center justify-center p-4">
            <img 
              src={activeImage || product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain" 
              onError={(e) => {
                setImageLoadError(true);
                handleImageError(e, product.category, product.name);
              }}
            />
          </div>
          {!imageLoadError && uniqueImages.length > 1 && (
            <div className="grid grid-cols-3 gap-4">
              {/* Dynamic thumbnail previews based on unique product images */}
              {uniqueImages.map((imgUrl, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`h-20 bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border cursor-pointer shadow-sm flex items-center justify-center p-2 transition-all ${
                    (activeImage === imgUrl || (!activeImage && idx === 0)) 
                      ? 'border-indigo-600 ring-1 ring-indigo-600' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} preview ${idx + 1}`} className="max-h-full max-w-full object-contain opacity-95 hover:opacity-100 transition-opacity" onError={(e) => handleImageError(e, product.category, product.name)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Options & Checkout details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category / Brand info */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 uppercase">
                {product.category}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-400">{product.brand} Brand</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-1 text-sm font-bold">
              <span className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} 
                  />
                ))}
              </span>
              <span className="text-gray-800 dark:text-gray-200 pl-1">{product.rating || 'No ratings'}</span>
              <span className="text-gray-400 font-semibold">({product.reviews?.length || 0} customer reviews)</span>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Distributor Cost</p>
              <p className="text-3xl font-black text-indigo-600">
                ₹{((purchaseType === 'case' || purchaseType === 'carton') ? product.price * itemsPerCase : product.price).toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-gray-400 ml-1.5 uppercase">
                  {(purchaseType === 'case' || purchaseType === 'carton') ? 'per Case' : 'per Unit'}
                </span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Specifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description || 'No detailed specifications have been uploaded for this item yet.'}
              </p>
            </div>

            {/* Purchase Options Selector */}
            <div className="space-y-2 border-t border-gray-150 dark:border-gray-850 pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purchase Options</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseType('single');
                    setQuantity(1);
                  }}
                  className={`flex-1 p-3 rounded-2xl border text-center transition-all ${
                    purchaseType === 'single'
                      ? 'border-indigo-600 bg-indigo-600/5 font-bold text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:border-gray-400 dark:hover:border-gray-700'
                  }`}
                >
                  <p className="text-sm font-bold">Single Item</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">1 Unit per pack</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseType('case');
                    setQuantity(1);
                  }}
                  className={`flex-1 p-3 rounded-2xl border text-center transition-all ${
                    purchaseType === 'case' || purchaseType === 'carton'
                      ? 'border-indigo-600 bg-indigo-600/5 font-bold text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:border-gray-400 dark:hover:border-gray-700'
                  }`}
                >
                  <p className="text-sm font-bold">Case ({itemsPerCase} Items)</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{itemsPerCase} Units in box</p>
                </button>
              </div>
            </div>

          </div>

          {/* Action Row: Quantity + Cart Trigger */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              {activeStock > 0 && maxAllowedQty > 0 ? (
                <>
                  {/* Quantity adjuster */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 font-bold focus:outline-none disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-gray-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(Math.min(maxAllowedQty, 200), prev + 1))}
                      disabled={quantity >= 200 || quantity >= maxAllowedQty}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 font-bold focus:outline-none disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" /> Add to Order Cart
                  </button>

                  {/* Wishlist Toggle Button */}
                  <button
                    onClick={handleWishlistToggle}
                    className="p-2.5 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors flex items-center justify-center"
                    title={
                      (user?.wishlist || []).includes(product.id)
                        ? 'Remove from Wishlist'
                        : 'Add to Wishlist'
                    }
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        (user?.wishlist || []).includes(product.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400 dark:text-gray-500'
                      }`} 
                    />
                  </button>
                </>
              ) : (
                <div className="flex-grow p-3 text-center rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold text-sm border border-red-200 dark:border-red-900/30">
                  {(purchaseType === 'case' || purchaseType === 'carton') && activeStock > 0
                    ? `Insufficient stock to form a case (Needs ${itemsPerCase}, only ${activeStock} units left)`
                    : 'Out of Stock at this Shop Branch'}
                </div>
              )}


            </div>

            {/* Cart response alerts */}
            {cartSuccess && (
              <div className="p-3 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-900/30">
                Item successfully added to your order cart!
              </div>
            )}
            {cartError && (
              <div className="p-3 text-center rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 font-bold text-xs border border-red-200 dark:border-red-900/30">
                {cartError}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Review Submission & Rating board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Submit a new review */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl h-fit">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white border-b pb-3 border-gray-150 dark:border-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Share Your Experience
          </h3>
          
          {user ? (
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              {reviewSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-100 dark:border-emerald-900/20">
                  Review submitted successfully!
                </div>
              )}
              {reviewError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-150 dark:border-red-900/20">
                  {reviewError}
                </div>
              )}

              {/* Star Selection Row */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rating Stars</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 focus:outline-none transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= newRating 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-gray-300 hover:text-amber-400'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Your Comment</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How does this product perform? Mention durability, efficiency, packaging..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full btn-primary py-2 text-sm flex items-center justify-center"
              >
                {submittingReview ? 'Submitting Review...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="mt-4 p-4 text-center border border-dashed rounded-2xl bg-gray-50 dark:bg-gray-950">
              <p className="text-xs text-gray-400">Please sign in to leave a review and rate this product.</p>
              <Link to="/login" className="btn-primary inline-block mt-3 text-xs py-1.5 px-4">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Reviews Log List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white border-b pb-3 border-gray-150 dark:border-gray-800">
            Customer Feedback ({product.reviews?.length || 0})
          </h3>
          
          {(!product.reviews || product.reviews.length === 0) ? (
            <div className="text-center py-8 text-gray-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-sm">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {product.reviews.map((review, idx) => (
                <div key={idx} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-xs">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">{review.userName}</h5>
                        <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-xs text-amber-500">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s < review.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
