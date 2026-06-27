import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Keep localStorage in sync with cart state
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, shopId, shopName, quantity = 1, purchaseType = 'single') => {
    const availableStock = product.stock[shopId] || 0;
    const itemsPerCase = product.caseQuantity || 20;
    
    if (availableStock <= 0) {
      throw new Error(`This item is currently out of stock at ${shopName}.`);
    }

    const isCase = purchaseType === 'case' || purchaseType === 'carton';
    const maxStockAllowed = isCase ? Math.floor(availableStock / itemsPerCase) : availableStock;
    if (isCase && maxStockAllowed < 1) {
      throw new Error(`Not enough stock at ${shopName} to form a full case (requires at least ${itemsPerCase} units).`);
    }

    // Clamp the requested quantity to [1, 200]
    const clampedQty = Math.max(1, Math.min(200, quantity));

    setCartItems(prevItems => {
      // Find if item already exists in cart for the SAME shop and SAME purchaseType
      const existingIndex = prevItems.findIndex(
        item => item.productId === product.id && item.shopId === shopId && 
          (item.purchaseType === purchaseType || 
           (isCase && (item.purchaseType === 'case' || item.purchaseType === 'carton')))
      );

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const maxAllowed = Math.min(200, maxStockAllowed);
        const newQuantity = Math.min(maxAllowed, existingItem.quantity + clampedQty);

        if (newQuantity === existingItem.quantity) {
          throw new Error(`Cannot add more. The limit is 200 ${isCase ? 'cases' : 'units'}, and you already have ${existingItem.quantity} in your cart.`);
        }

        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        // New item entry
        if (clampedQty > maxStockAllowed) {
          throw new Error(`Cannot add requested amount. Insufficient stock at ${shopName}.`);
        }

        return [
          ...prevItems,
          {
            productId: product.id,
            name: isCase ? `${product.name} (Case of ${itemsPerCase})` : product.name,
            price: isCase ? product.price * itemsPerCase : product.price,
            image: product.image,
            category: product.category,
            quantity: clampedQty,
            purchaseType: isCase ? 'case' : 'single',
            shopId,
            shopName,
            maxStock: maxStockAllowed,
            itemsPerCase: itemsPerCase
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, shopId, newQuantity, purchaseType = 'single') => {
    const clampedQty = Math.max(1, Math.min(200, newQuantity));

    setCartItems(prevItems =>
      prevItems.map(item => {
        const isMatch = item.productId === productId && item.shopId === shopId && 
          (item.purchaseType === purchaseType || 
           ((purchaseType === 'case' || purchaseType === 'carton') && 
            (item.purchaseType === 'case' || item.purchaseType === 'carton')));
        
        if (isMatch) {
          const maxAllowed = Math.min(200, item.maxStock);
          const finalQuantity = Math.min(maxAllowed, clampedQty);
          return { ...item, quantity: finalQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, shopId, purchaseType = 'single') => {
    setCartItems(prevItems =>
      prevItems.filter(item => {
        const isMatch = item.productId === productId && item.shopId === shopId && 
          (item.purchaseType === purchaseType || 
           ((purchaseType === 'case' || purchaseType === 'carton') && 
            (item.purchaseType === 'case' || item.purchaseType === 'carton')));
        return !isMatch;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const totalPrice = parseFloat(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
