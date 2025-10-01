const WHATSAPP_NUMBER = "94787204432"; // Your WhatsApp number

const Cart = {
  // 1. Load cart from local storage, or return an empty array
  getCart: () => {
    try {
      const cart = JSON.parse(localStorage.getItem("mirigama_kaju_cart")) || [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      console.error("Error parsing cart from localStorage:", e);
      return [];
    }
  },

  // 2. Save cart to local storage
  saveCart: (cart) => {
    localStorage.setItem("mirigama_kaju_cart", JSON.stringify(cart));
    Cart.updateCartCount();
  },

  // 3. Add a product to the cart or update its quantity
  addToCart: (buttonElement) => {
    // data-price is the final discounted price (set by products.html script)
    const finalPrice = parseFloat(buttonElement.getAttribute("data-price")); 
    // data-discount-rs is the fixed rupee discount amount
    const discountRs = parseFloat(buttonElement.getAttribute("data-discount-rs")) || 0; 
    
    // Calculate the original price for display on cart page (Final Price + Discount)
    const originalPrice = finalPrice + discountRs; 

    const product = {
      id: buttonElement.getAttribute("data-id"),
      name: buttonElement.getAttribute("data-name"),
      price: finalPrice, // Store the final price for calculation
      originalPrice: originalPrice, // Store the original price for display
      discountRs: discountRs, // Store the discount amount
      quantity: 1, // Always add 1 from the product page
    };

    let cart = Cart.getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantity;
      // Note: We assume price/discount won't change after adding
      // If it does, a full item replacement or price update logic would be needed here.
    } else {
      cart.push(product);
    }

    Cart.saveCart(cart);

    // Simple confirmation notification
    const buttonText = buttonElement.querySelector("i")
      ? ""
      : buttonElement.textContent.trim();
    alert(`${product.name} has been added to the cart!`);
  },

  // 4. Update the quantity of an item in the cart
  updateItemQuantity: (id, newQuantity) => {
    let cart = Cart.getCart();
    const item = cart.find((item) => item.id === id);

    if (item) {
      const quantity = parseInt(newQuantity);
      if (quantity > 0) {
        item.quantity = quantity;
      } else {
        // If quantity is 0, remove the item
        cart = cart.filter((item) => item.id !== id);
      }
      Cart.saveCart(cart);
      Cart.renderCart(); // Re-render the cart page
    }
  },

  // 5. Remove an item completely
  removeItem: (id) => {
    let cart = Cart.getCart();
    cart = cart.filter((item) => item.id !== id);
    Cart.saveCart(cart);
    Cart.renderCart(); // Re-render the cart page
  },

  // 6. Update the number displayed in the header cart icon
  updateCartCount: () => {
    const cart = Cart.getCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const countElement = document.getElementById("cart-count");

    if (countElement) {
      countElement.textContent = totalItems;
      countElement.classList.toggle("hidden", totalItems === 0);
    }
  },

  // 7. Render the cart contents on the cart.html page
  renderCart: () => {
    const cart = Cart.getCart();
    const cartTableBody = document.getElementById("cart-table-body");
    const cartTotal = document.getElementById("cart-total");
    const whatsappButton = document.getElementById("whatsapp-order-btn");
    let total = 0;

    if (!cartTableBody) return; // Only run on cart.html

    cartTableBody.innerHTML = "";

    if (cart.length === 0) {
      cartTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-zinc-400">Your cart is empty. <a href="products.html" class="text-amber-500 hover:underline">Start shopping!</a></td></tr>';
      cartTotal.textContent = "LKR 0.00";
      whatsappButton.classList.add("hidden");
      return;
    }

    whatsappButton.classList.remove("hidden");

    cart.forEach((item) => {
      // Calculate subtotal using the final discounted price
      const subtotal = item.price * item.quantity; 
      total += subtotal;

      // Price Display Logic
      let priceDisplayHtml;
      if (item.discountRs > 0) {
        const originalPriceFormatted = item.originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 });
        const finalPriceFormatted = item.price.toLocaleString("en-US", { minimumFractionDigits: 2 });

        // Display original price struck out, final price, and saving amount
        priceDisplayHtml = `
            <div class="flex flex-col items-end">
                <span class="text-xs text-zinc-500 line-through">LKR ${originalPriceFormatted}</span>
                <span class="text-sm text-red-400 font-semibold">LKR ${finalPriceFormatted}</span>
                <span class="text-xs text-green-400">Save Rs. ${item.discountRs.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
        `;
      } else {
        // No discount, display only the final price (which is also the original price)
        const finalPriceFormatted = item.price.toLocaleString("en-US", { minimumFractionDigits: 2 });
        priceDisplayHtml = `<span class="text-sm text-amber-400 font-semibold">LKR ${finalPriceFormatted}</span>`;
      }


      const row = document.createElement("tr");
      row.className =
        "border-b border-zinc-700 hover:bg-zinc-700 transition-colors";
      row.innerHTML = `
                <td class="px-4 py-3 text-left font-semibold">${item.name}</td>
                <td class="px-4 py-3 text-right">${priceDisplayHtml}</td>
                <td class="px-4 py-3 text-center">
                    <input type="number" value="${item.quantity}" min="1" 
                           data-id="${item.id}"
                           class="w-16 text-center bg-zinc-800 border border-zinc-600 rounded-lg text-white p-2 focus:border-amber-500 focus:ring focus:ring-amber-500/50"
                           onchange="Cart.updateItemQuantity('${item.id}', this.value)"
                    />
                </td>
                <td class="px-4 py-3 text-right font-bold text-lg text-white">LKR ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="Cart.removeItem('${item.id}')" class="text-red-500 hover:text-red-700 transition-colors">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
      cartTableBody.appendChild(row);
    });

    cartTotal.textContent = `LKR ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  },

  // 8. Generate and open the WhatsApp order link
  sendWhatsAppOrder: () => {
    const cart = Cart.getCart();
    let message =
      "Hello Mirigama Kaju, I would like to place an order with the following items:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      
      let discountText = '';
      if (item.discountRs > 0) {
          const originalPriceFormatted = item.originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 });
          discountText = ` (Discounted from LKR ${originalPriceFormatted}, Saved Rs. ${item.discountRs.toLocaleString("en-US", { minimumFractionDigits: 2 })})`;
      }

      // Format: 1. Raw Full Cashews (500g) x 2 - LKR 8,000.00 (Discounted from LKR 9,000.00)
      message += `${index + 1}. ${item.name} x ${item.quantity} - LKR ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}${discountText}\n`;
    });

    // Add total and instructions
    message += `\n*Total Order Value:* LKR ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    message +=
      "\n\nCould you please confirm the final price including delivery and my delivery details.";

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  },
};

// Initialize cart count on page load
document.addEventListener("DOMContentLoaded", () => {
  Cart.updateCartCount();
  // If on the cart page, render the cart
  if (document.getElementById("cart-container")) {
    Cart.renderCart();

    const whatsappButton = document.getElementById("whatsapp-order-btn");
    if (whatsappButton) {
      whatsappButton.addEventListener("click", Cart.sendWhatsAppOrder);
    }
  }
});