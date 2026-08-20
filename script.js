const cart = {};

function updateCartCount(){
  document.getElementById('cartCount').textContent =
    Object.values(cart).reduce((sum,qty)=>sum+qty,0);
}

function renderCart(){
  const box = document.getElementById('cartItems');
  const entries = Object.entries(cart).filter(([,qty])=>qty>0);

  if(!entries.length){
    box.innerHTML = '<p class="empty">Your order is empty.</p>';
    return;
  }

  box.innerHTML = entries.map(([item,qty]) =>
    `<div class="cart-line"><div><strong>${item}</strong><span>Quantity: ${qty}</span></div><strong>${qty}×</strong></div>`
  ).join('');
}

document.querySelectorAll('.menu-card').forEach(card=>{
  const qtyEl = card.querySelector('.qty');
  const item = card.dataset.item;

  card.querySelector('.minus').addEventListener('click',()=>{
    qtyEl.textContent = Math.max(1, Number(qtyEl.textContent)-1);
  });

  card.querySelector('.plus').addEventListener('click',()=>{
    qtyEl.textContent = Number(qtyEl.textContent)+1;
  });

  card.querySelector('.add-btn').addEventListener('click',()=>{
    const qty = Number(qtyEl.textContent);
    cart[item] = (cart[item] || 0) + qty;
    qtyEl.textContent = '1';
    updateCartCount();
    renderCart();
    document.getElementById('cartPanel').classList.add('open');
  });
});

function closeCart(){
  document.getElementById('cartPanel').classList.remove('open');
}

document.getElementById('openCart').addEventListener('click',()=>{
  renderCart();
  document.getElementById('cartPanel').classList.add('open');
});

document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('cartBackdrop').addEventListener('click',closeCart);

document.getElementById('clearCart').addEventListener('click',()=>{
  Object.keys(cart).forEach(key=>delete cart[key]);
  updateCartCount();
  renderCart();
});

document.getElementById('sendWhatsApp').addEventListener('click',()=>{
  const entries = Object.entries(cart).filter(([,qty])=>qty>0);

  if(!entries.length){
    alert('Please add at least one item to your order.');
    return;
  }

  const lines = entries.map(([item,qty])=>`• ${qty} x ${item}`).join('\n');
  const message = `Hello Iramdam Biryani, I would like to order:\n${lines}\n\nPlease confirm price and availability.`;

  window.open(
    `https://wa.me/917005018537?text=${encodeURIComponent(message)}`,
    '_blank'
  );
});
