const cart=[];
let STORE_OPEN_MINUTES=10*60;
let STORE_CLOSE_MINUTES=20*60;
let STORE_STATUS_MODE='automatic';
const UPI_ID='allthetimemotivation@okhdfcbank';

function indiaMinutesNow(){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date());
  const hour=Number(parts.find(part=>part.type==='hour').value);
  const minute=Number(parts.find(part=>part.type==='minute').value);
  return hour*60+minute;
}

function isStoreOpen(){
  if(STORE_STATUS_MODE==='force-open') return true;
  if(STORE_STATUS_MODE==='force-closed') return false;
  const now=indiaMinutesNow();
  return now>=STORE_OPEN_MINUTES&&now<STORE_CLOSE_MINUTES;
}

function closedMessage(){
  return `Iramdam Biryani is currently closed. Ordering is available daily from ${formatMinutes12(STORE_OPEN_MINUTES)} to ${formatMinutes12(STORE_CLOSE_MINUTES)}. Advance orders are not accepted.`;
}

function updateStoreStatus(){
  const open=isStoreOpen();
  const status=document.getElementById('storeStatus');
  status.textContent=STORE_STATUS_MODE==='force-open'?'🟢 Open now — accepting orders':STORE_STATUS_MODE==='force-closed'?'🔴 Temporarily closed':open?`🟢 Open now — closes at ${formatMinutes12(STORE_CLOSE_MINUTES)}`:`🔴 Store closed — opens at ${formatMinutes12(STORE_OPEN_MINUTES)}`;
  status.classList.toggle('open',open);
  status.classList.toggle('closed',!open);

  document.querySelectorAll('.add,.qtybox button').forEach(button=>button.disabled=!open);
  document.getElementById('openCart').disabled=!open;
  document.getElementById('sendWhatsApp').disabled=!open;
  document.querySelectorAll('.order-link,.food-slide').forEach(link=>{
    link.classList.toggle('store-closed-link',!open);
    link.setAttribute('aria-disabled',String(!open));
  });
}

function formatMinutes12(minutes){
  const hour24=Math.floor(minutes/60)%24;
  const minute=minutes%60;
  const suffix=hour24>=12?'PM':'AM';
  const hour=hour24%12||12;
  return `${hour}:${String(minute).padStart(2,'0')} ${suffix}`;
}

window.applyLiveStoreSettings=settings=>{
  if(Number.isFinite(settings.openMinutes)) STORE_OPEN_MINUTES=settings.openMinutes;
  if(Number.isFinite(settings.closeMinutes)) STORE_CLOSE_MINUTES=settings.closeMinutes;
  if(['automatic','force-open','force-closed'].includes(settings.statusMode)) STORE_STATUS_MODE=settings.statusMode;
  document.getElementById('storeHours').textContent=`Open daily: ${formatMinutes12(STORE_OPEN_MINUTES)}–${formatMinutes12(STORE_CLOSE_MINUTES)}`;
  document.getElementById('footerStoreHours').innerHTML=`Open daily from <strong>${formatMinutes12(STORE_OPEN_MINUTES)} to ${formatMinutes12(STORE_CLOSE_MINUTES)}</strong>.`;
  if(settings.storeName) document.getElementById('storeName').textContent=settings.storeName;
  if(settings.tagline) document.getElementById('storeTagline').textContent=settings.tagline;
  if(settings.address) document.getElementById('storeAddress').textContent=settings.address;
  if(settings.headerImageUrl) document.getElementById('storeHeader').style.backgroundImage=`linear-gradient(rgba(35,13,0,.58),rgba(35,13,0,.7)),url("${settings.headerImageUrl}")`;
  const logo=document.getElementById('storeLogo');
  if(settings.logoUrl){logo.src=settings.logoUrl;logo.hidden=false;}else{logo.hidden=true;}
  const announcement=document.getElementById('announcementBanner');
  announcement.hidden=settings.announcementVisible===false;
  announcement.style.setProperty('--announcement-speed',`${Math.max(10,Number(settings.announcementSpeed)||34)}s`);
  const message=document.getElementById('announcementMessage');
  message.textContent=settings.announcementText||'';
  message.hidden=!settings.announcementText;
  updateStoreStatus();
};

window.applyLiveBannerPhoto=(slot,dataUrl)=>{
  if(!dataUrl) return;
  document.querySelectorAll(`[data-banner-slot="${slot}"]`).forEach(image=>{image.src=dataUrl;image.classList.add('custom-banner-photo');});
};

window.applyLiveMenu=items=>{
  Object.values(items).forEach(item=>{
    const card=[...document.querySelectorAll('.card')].find(element=>element.dataset.item===item.name);
    if(!card) return;
    if(item.description) card.querySelector('.food-description').textContent=item.description;
    const select=card.querySelector('.size-select');
    const options=Object.entries(item.prices||{}).filter(([,price])=>Number.isFinite(Number(price))&&Number(price)>=0).map(([size,price])=>{const option=document.createElement('option');option.value=size;option.dataset.price=String(price);option.textContent=`${size} — ₹${price}`;return option;});
    if(options.length)select.replaceChildren(...options);
  });
};

const BUILTIN_MENU_NAMES={chickenBiryani:'Chicken Biryani',porkCurry:'Pork Curry',broilerMapum:'Chicken Broiler Mapum Thongba',ngaheiMapum:'Ngahei Mapum Thongba',koilerMapum:'Chicken Koiler Mapum Thongba',porkMapum:'Pork Mapum Thongba'};
window.applyLiveMenuItemImage=(key,dataUrl)=>{
  if(!key||!dataUrl)return;
  const name=BUILTIN_MENU_NAMES[key];
  const card=document.querySelector(`.card[data-menu-key="${CSS.escape(key)}"]`)||[...document.querySelectorAll('.card')].find(element=>element.dataset.item===name);
  const image=card&&card.querySelector('.food-photo img');if(image){image.src=dataUrl;image.classList.add('custom-food-image');}
};

window.applyCustomMenuItem=(key,item)=>{
  if(!item||!item.name) return;
  let card=document.querySelector(`.card[data-menu-key="${CSS.escape(key)}"]`);
  if(!card){
    card=document.createElement('article');card.className='card';card.dataset.menuKey=key;card.dataset.item=item.name;
    card.innerHTML=`<div class="food food-photo"><img class="custom-food-image" alt=""></div><div class="pad"><h3></h3><p class="food-description"></p><select class="size-select"></select><div class="qtyrow"><span>Quantity</span><div class="qtybox"><button class="minus" type="button">−</button><span class="qty">1</span><button class="plus" type="button">+</button></div></div><button class="add" type="button">Add to Order</button></div>`;
    document.getElementById('menuGrid').appendChild(card);bindOrderCard(card);bindPhotoCard(card);
  }
  card.dataset.item=item.name;card.querySelector('h3').textContent=item.name;card.querySelector('.food-description').textContent=item.description||'';
  const image=card.querySelector('.food-photo img');image.src=item.imageDataUrl||'';image.alt=`${item.name} from Iramdam Biryani`;
  const select=card.querySelector('.size-select');select.replaceChildren(...Object.entries(item.prices||{}).map(([size,price])=>{const option=document.createElement('option');option.value=size;option.dataset.price=String(price);option.textContent=`${size} — ₹${price}`;return option;}));
  updateStoreStatus();
};

document.querySelectorAll('.order-link,.food-slide').forEach(link=>{
  link.addEventListener('click',event=>{
    if(!isStoreOpen()){
      event.preventDefault();
      alert(closedMessage());
    }
  });
});

function money(n){return `₹${n}`}

function updateCount(){
  document.getElementById('cartCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}

function foodSubtotal(){
  return cart.reduce((s,i)=>s+i.price*i.qty,0);
}

function deliveryCharge(){
  const type=document.getElementById('orderType').value;
  if(type!=='Delivery') return 0;
  if(customerDistanceKm===null||customerDistanceKm>MAX_DELIVERY_DISTANCE_KM) return null;
  if(customerDistanceKm<=3) return 30;
  if(customerDistanceKm<=6) return 50;
  return 70;
}

function total(){
  return foodSubtotal()+(deliveryCharge()||0);
}

function selectedPaymentMethod(){
  return document.querySelector('input[name="paymentMethod"]:checked').value;
}

function updatePaymentChoice(){
  const method=selectedPaymentMethod();
  const isUpi=method==='UPI Payment';
  const upiBox=document.getElementById('upiPaymentBox');
  const payUpi=document.getElementById('payUpi');
  upiBox.hidden=!isUpi;
  payUpi.href=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent('Iramdam Biryani')}&am=${total().toFixed(2)}&cu=INR&tn=${encodeURIComponent('Food order from Iramdam Biryani')}`;
  document.getElementById('paymentSummary').textContent=isUpi?'UPI Payment':'Cash';
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
  const fee=deliveryCharge();
  const isDelivery=document.getElementById('orderType').value==='Delivery';
  document.getElementById('cartSubtotal').textContent=money(foodSubtotal());
  document.getElementById('deliveryFee').textContent=!isDelivery?money(0):
    customerDistanceKm>MAX_DELIVERY_DISTANCE_KM?'Unavailable':
    fee===null?'Share location':money(fee);
  document.getElementById('cartTotal').textContent=money(total());
  updatePaymentChoice();
}

function removeItem(index){
  cart.splice(index,1);
  updateCount();
  render();
}

function bindOrderCard(card){
  if(card.dataset.orderBound) return;card.dataset.orderBound='true';
  const qty=card.querySelector('.qty');
  const size=card.querySelector('.size-select');

  card.querySelector('.minus').onclick=()=>qty.textContent=Math.max(1,+qty.textContent-1);
  card.querySelector('.plus').onclick=()=>qty.textContent=+qty.textContent+1;

  card.querySelector('.add').onclick=()=>{
    if(!isStoreOpen()){
      alert(closedMessage());
      return;
    }
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
}
document.querySelectorAll('.card').forEach(bindOrderCard);

document.getElementById('openCart').onclick=()=>{
  if(!isStoreOpen()){
    alert(closedMessage());
    return;
  }
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

const STORE_LAT=24.817522;
const STORE_LNG=93.925204;
const MAX_DELIVERY_DISTANCE_KM=10;

let customerLocation='';
let customerDistanceKm=null;
let pendingWhatsAppUrl='';

function distanceInKm(lat1,lng1,lat2,lng2){
  const earthRadiusKm=6371;
  const toRadians=degrees=>degrees*Math.PI/180;
  const latitudeDifference=toRadians(lat2-lat1);
  const longitudeDifference=toRadians(lng2-lng1);
  const a=Math.sin(latitudeDifference/2)**2+
    Math.cos(toRadians(lat1))*Math.cos(toRadians(lat2))*
    Math.sin(longitudeDifference/2)**2;
  return earthRadiusKm*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

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
      customerDistanceKm=distanceInKm(STORE_LAT,STORE_LNG,lat,lng);

      if(customerDistanceKm<=MAX_DELIVERY_DISTANCE_KM){
        status.textContent=`✅ Location accepted — ${customerDistanceKm.toFixed(1)} km from the store`;
      }else{
        status.textContent=`❌ ${customerDistanceKm.toFixed(1)} km from the store — outside our 10 km delivery area`;
      }
      render();
    },
    ()=>{
      customerLocation='';
      customerDistanceKm=null;
      status.textContent='Unable to get location. Please allow location permission.';
      render();
    },
    {
      enableHighAccuracy:true,
      timeout:10000
    }
  );
};
document.getElementById('sendWhatsApp').onclick=()=>{
  if(!isStoreOpen()){
    alert(closedMessage());
    return;
  }
  if(!cart.length){
    alert('Please add at least one item to your order.');
    return;
  }

  const name=document.getElementById('customerName').value.trim();
  const phone=document.getElementById('customerPhone').value.trim();
  const type=document.getElementById('orderType').value;
  const address=document.getElementById('customerAddress').value.trim();
  const instructions=document.getElementById('orderInstructions').value.trim();
  const paymentMethod=selectedPaymentMethod();

  if(!name){
    document.getElementById('cartPanel').classList.remove('open');
    alert('Please enter your name before ordering.');
    document.getElementById('customerName').focus();
    return;
  }

  const phoneDigits=phone.replace(/\D/g,'');
  if(phoneDigits.length!==10){
    document.getElementById('cartPanel').classList.remove('open');
    alert('Please enter a valid 10-digit phone number.');
    document.getElementById('customerPhone').focus();
    return;
  }

  if(type==='Delivery'&&!address){
    document.getElementById('cartPanel').classList.remove('open');
    alert('Please enter your delivery address.');
    document.getElementById('customerAddress').focus();
    return;
  }

  if(type==='Delivery'&&customerDistanceKm===null){
    document.getElementById('cartPanel').classList.remove('open');
    alert('Please tap Share My Location. Location is required for delivery orders.');
    document.getElementById('shareLocation').focus();
    return;
  }

  if(type==='Delivery'&&customerDistanceKm>MAX_DELIVERY_DISTANCE_KM){
    document.getElementById('cartPanel').classList.remove('open');
    alert(`Sorry, delivery is available only within 10 km of Iramdam Biryani. Your location is ${customerDistanceKm.toFixed(1)} km away.`);
    document.getElementById('shareLocation').focus();
    return;
  }

  const lines=cart.map(i=>`• ${i.qty} x ${i.name} (${i.size}) — ${money(i.price*i.qty)}`).join('\n');

  const message=`Hello Iramdam Biryani, I would like to order:

${lines}

Food subtotal: ${money(foodSubtotal())}
Delivery charge: ${money(deliveryCharge()||0)}
Total: ${money(total())}
Payment method: ${paymentMethod}
${paymentMethod==='UPI Payment'?`UPI ID: ${UPI_ID}\nPayment verification: Please check and confirm`:''}

Customer: ${name||'Not provided'}
Phone: ${phone||'Not provided'}
Order type: ${type}
Address: ${address||(type==='Pickup'?'Pickup from shop':'Not provided')} 
Special instructions: ${instructions||'None'}
Location:${customerLocation || 'Not shared'}
Distance from store: ${customerDistanceKm===null?'Not checked':`${customerDistanceKm.toFixed(1)} km`}

Please confirm my order.`;

  pendingWhatsAppUrl=`https://wa.me/919402855024?text=${encodeURIComponent(message)}`;
  document.getElementById('confirmItems').textContent=cart.map(i=>`${i.qty} × ${i.name} (${i.size}) — ${money(i.price*i.qty)}`).join('\n');
  document.getElementById('confirmSubtotal').textContent=money(foodSubtotal());
  document.getElementById('confirmDelivery').textContent=money(deliveryCharge()||0);
  document.getElementById('confirmTotal').textContent=money(total());
  document.getElementById('confirmCustomer').textContent=`${name} • ${phone}`;
  document.getElementById('confirmOrderType').textContent=type;
  document.getElementById('confirmPayment').textContent=paymentMethod;
  document.getElementById('confirmAddress').textContent=address||(type==='Pickup'?'Pickup from shop':'Not provided');
  document.getElementById('confirmDistance').textContent=customerDistanceKm===null?'Not required':`${customerDistanceKm.toFixed(1)} km`;
  document.getElementById('cartPanel').classList.remove('open');
  const confirmationPanel=document.getElementById('confirmationPanel');
  confirmationPanel.classList.add('open');
  confirmationPanel.setAttribute('aria-hidden','false');
};

function closeConfirmation(reopenCart=false){
  const confirmationPanel=document.getElementById('confirmationPanel');
  confirmationPanel.classList.remove('open');
  confirmationPanel.setAttribute('aria-hidden','true');
  if(reopenCart) document.getElementById('cartPanel').classList.add('open');
}

document.getElementById('editOrder').onclick=()=>closeConfirmation(true);
document.getElementById('closeConfirmation').onclick=()=>closeConfirmation(true);
document.querySelector('.confirmation-backdrop').onclick=()=>closeConfirmation(true);
document.getElementById('confirmWhatsApp').onclick=()=>{
  if(!isStoreOpen()){
    closeConfirmation(false);
    alert(closedMessage());
    return;
  }
  if(!pendingWhatsAppUrl) return;
  window.open(pendingWhatsAppUrl,'_blank');
  closeConfirmation(false);
};

const photoViewer=document.getElementById('photoViewer');
const largeFoodPhoto=document.getElementById('largeFoodPhoto');
let viewerPhotos=[];
let viewerIndex=0;
let viewerDishName='';
let touchStartX=0;

function renderPhotoViewer(){
  const photo=viewerPhotos[viewerIndex];
  largeFoodPhoto.src=photo.src;
  largeFoodPhoto.alt=photo.alt;
  document.getElementById('photoDishName').textContent=viewerDishName;
  document.getElementById('photoCounter').textContent=`Photo ${viewerIndex+1} of ${viewerPhotos.length}`;
  const dots=document.getElementById('photoDots');
  dots.replaceChildren(...viewerPhotos.map((_,index)=>{
    const dot=document.createElement('button');
    dot.type='button';
    dot.className=index===viewerIndex?'active':'';
    dot.setAttribute('aria-label',`View photo ${index+1}`);
    dot.onclick=()=>{viewerIndex=index;renderPhotoViewer();};
    return dot;
  }));
}

function openPhotoViewer(card,startIndex){
  viewerPhotos=[...card.querySelectorAll('.food-photo img,.secondary-gallery img')].map(image=>({src:image.src,alt:image.alt}));
  viewerDishName=card.dataset.item;
  viewerIndex=startIndex;
  renderPhotoViewer();
  photoViewer.classList.add('open');
  photoViewer.setAttribute('aria-hidden','false');
  document.body.classList.add('photo-viewer-open');
  document.getElementById('closePhotoViewer').focus();
}

function closePhotoViewer(){
  photoViewer.classList.remove('open');
  photoViewer.setAttribute('aria-hidden','true');
  document.body.classList.remove('photo-viewer-open');
}

function changePhoto(direction){
  viewerIndex=(viewerIndex+direction+viewerPhotos.length)%viewerPhotos.length;
  renderPhotoViewer();
}

function bindPhotoCard(card){
  if(card.dataset.photoBound) return;card.dataset.photoBound='true';
  card.querySelectorAll('.food-photo img,.secondary-gallery img').forEach((image,index)=>{
    image.tabIndex=0;
    image.setAttribute('role','button');
    image.setAttribute('aria-label',`${image.alt}. Open larger photo`);
    image.onclick=()=>openPhotoViewer(card,index);
    image.onkeydown=event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openPhotoViewer(card,index);}
    };
  });
}
document.querySelectorAll('.card').forEach(bindPhotoCard);

document.getElementById('closePhotoViewer').onclick=closePhotoViewer;
document.querySelector('.photo-viewer-backdrop').onclick=closePhotoViewer;
document.getElementById('previousPhoto').onclick=()=>changePhoto(-1);
document.getElementById('nextPhoto').onclick=()=>changePhoto(1);
largeFoodPhoto.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0].clientX;},{passive:true});
largeFoodPhoto.addEventListener('touchend',event=>{
  const distance=event.changedTouches[0].clientX-touchStartX;
  if(Math.abs(distance)>45) changePhoto(distance<0?1:-1);
},{passive:true});
document.addEventListener('keydown',event=>{
  if(!photoViewer.classList.contains('open')) return;
  if(event.key==='Escape') closePhotoViewer();
  if(event.key==='ArrowLeft') changePhoto(-1);
  if(event.key==='ArrowRight') changePhoto(1);
});
const orderType = document.getElementById('orderType');
const customerAddress = document.getElementById('customerAddress');

function updateAddressVisibility(){
  if(orderType.value === 'Delivery'){
    customerAddress.style.display = 'block';
    customerAddress.required = true;
  }else{
    customerAddress.style.display = 'none';
    customerAddress.required = false;
    customerAddress.value = '';
  }
  render();
}

orderType.addEventListener('change', updateAddressVisibility);
document.querySelectorAll('input[name="paymentMethod"]').forEach(option=>option.addEventListener('change',updatePaymentChoice));
updateAddressVisibility();
updatePaymentChoice();
updateStoreStatus();
setInterval(updateStoreStatus,30000);
