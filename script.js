const cart=[];

function money(n){return `₹${n}`}

function updateCount(){
  document.getElementById('cartCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}

function total(){
  return cart.reduce((s,i)=>s+i.price*i.qty,0);
}

function render(){
  const box=document.getElementById('cartItems');
  if(!cart.length){
    box.innerHTML='<p>Your order is empty.</p>';
  }else{
    box.innerHTML=cart.map((i,idx)=>`
      <div class="cartline">
        <div><strong>${i.name}</strong><br><small>${i.size} • ${money(i.price)} each • Qty ${i.qty}</small></div>
        <div><strong>${money(i.price*i.qty)}</strong><br><button onclick="removeItem(${idx})">Remove</button></div>
      </div>`).join('');
  }
  document.getElementById('cartTotal').textContent=money(total());
}

function removeItem(index){
  cart.splice(index,1);
  updateCount();
  render();
}

document.querySelectorAll('.card').forEach(card=>{
  const qty=card.querySelector('.qty');
  const size=card.querySelector('.size-select');

  card.querySelector('.minus').onclick=()=>qty.textContent=Math.max(1,+qty.textContent-1);
  card.querySelector('.plus').onclick=()=>qty.textContent=+qty.textContent+1;

  card.querySelector('.add').onclick=()=>{
    const selected=size.options[size.selectedIndex];
    cart.push({
      name:card.dataset.item,
      size:selected.value,
      price:+selected.dataset.price,
      qty:+qty.textContent
    });
    qty.textContent='1';
    updateCount();
    render();
    document.getElementById('cartPanel').classList.add('open');
  };
});

document.getElementById('openCart').onclick=()=>{
  render();
  document.getElementById('cartPanel').classList.add('open');
};

document.getElementById('closeCart').onclick=()=>document.getElementById('cartPanel').classList.remove('open');
document.getElementById('backdrop').onclick=()=>document.getElementById('cartPanel').classList.remove('open');

document.getElementById('clearCart').onclick=()=>{
  cart.length=0;
  updateCount();
  render();
};

let customerLocation='';

document.getElementById('shareLocation').onclick=()=>{
  const status=document.getElementById('locationStatus');

  if(!navigator.geolocation){
    status.textContent='Location is not supported on this device.';
    return;
  }

  status.textContent='Getting your location...';

  navigator.geolocation.getCurrentPosition(
    (position)=>{
      const lat=position.coords.latitude;
      const lng=position.coords.longitude;

      customerLocation=`https://www.google.com/maps?q=${lat},${lng}`;

      status.textContent='✅ Location added successfully';
    },
    ()=>{
      status.textContent='Unable to get location. Please allow location permission.';
    },
    {
      enableHighAccuracy:true,
      timeout:10000
    }
  );
};
document.getElementById('sendWhatsApp').onclick=()=>{
  if(!cart.length){
    alert('Please add at least one item to your order.');
    return;
  }

  const name=document.getElementById('customerName').value.trim();
  const phone=document.getElementById('customerPhone').value.trim();
  const type=document.getElementById('orderType').value;
  const address=document.getElementById('customerAddress').value.trim();

  const lines=cart.map(i=>`• ${i.qty} x ${i.name} (${i.size}) — ${money(i.price*i.qty)}`).join('\n');

  const message=`Hello Iramdam Biryani, I would like to order:

${lines}

Total: ${money(total())}

Customer: ${name||'Not provided'}
Phone: ${phone||'Not provided'}
Order type: ${type}
Address: ${address||(type==='Pickup'?'Pickup from shop':'Not provided')} 
Location:${customerLocation || 'Not shared'}

Please confirm my order.`;

  window.open(`https://wa.me/917005018537?text=${encodeURIComponent(message)}`,'_blank');
};  
const orderType = document.getElementById('orderType');
const customerAddress = document.getElementById('customerAddress');

function updateAddressVisibility(){
  if(orderType.value === 'Delivery'){
    customerAddress.style.display = 'block';
  }else{
    customerAddress.style.display = 'none';
    customerAddress.value = '';
  }
}

orderType.addEventListener('change', updateAddressVisibility);
updateAddressVisibility();
