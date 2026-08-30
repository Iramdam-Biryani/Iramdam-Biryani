const ADMIN_EMAIL='asemajitkumarsingh@gmail.com';
const config=window.IRAMDAM_FIREBASE_CONFIG;
const configured=config&&!String(config.apiKey).startsWith('PASTE_');
const loginView=document.getElementById('loginView');
const adminView=document.getElementById('adminView');
const loginStatus=document.getElementById('loginStatus');
const saveStatus=document.getElementById('saveStatus');
let auth,db,currentSettings={};
const DEFAULT_MENU={
  chickenBiryani:{name:'Chicken Biryani',description:'Description will be added soon.',prices:{Small:170,Large:350,'Family Pack':950}},
  porkCurry:{name:'Pork Curry',description:'Description will be added soon.',prices:{Small:170,Large:360}},
  broilerMapum:{name:'Chicken Broiler Mapum Thongba',description:'Description will be added soon.',prices:{Small:550,Large:900}},
  ngaheiMapum:{name:'Ngahei Mapum Thongba',description:'Description will be added soon.',prices:{Small:450,Large:750}},
  koilerMapum:{name:'Chicken Koiler Mapum Thongba',description:'Description will be added soon.',prices:{Full:1100}},
  porkMapum:{name:'Pork Mapum Thongba',description:'Description will be added soon.',prices:{Full:2300}}
};
let currentMenu=JSON.parse(JSON.stringify(DEFAULT_MENU));
const BUILTIN_MENU_KEYS=new Set(Object.keys(DEFAULT_MENU));
const pendingItemImages={};

function setStatus(element,message,type=''){
  element.textContent=message;element.className=`status ${type}`;
}
function timeToMinutes(time){const [hours,minutes]=time.split(':').map(Number);return hours*60+minutes;}
function minutesToTime(minutes){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
function formatTime(time){const [h,m]=time.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}

function renderMenuEditor(){
  const editor=document.getElementById('menuEditor');
  editor.replaceChildren(...Object.entries(currentMenu).map(([key,item])=>{
    const card=document.createElement('article');card.className='menu-edit-card';card.dataset.menuKey=key;
    if(item.custom){card.classList.add('custom-item');const badge=document.createElement('span');badge.className='custom-badge';badge.textContent='Custom item';card.appendChild(badge);}
    const title=document.createElement('h3');title.textContent=item.name;card.appendChild(title);
    const descriptionLabel=document.createElement('label');descriptionLabel.textContent='Food description';
    const description=document.createElement('textarea');description.rows=3;description.maxLength=260;description.className='menu-description';description.value=item.description||'';descriptionLabel.appendChild(description);card.appendChild(descriptionLabel);
    const priceGrid=document.createElement('div');priceGrid.className='menu-price-grid';
    Object.entries(item.prices).forEach(([size,price])=>{
      const label=document.createElement('label');label.textContent=`${size} price (₹)`;
      const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.required=true;input.className='menu-price';input.dataset.size=size;input.value=price;label.appendChild(input);priceGrid.appendChild(label);
    });
    card.appendChild(priceGrid);return card;
  }));
}

function readMenuEditor(){
  const menu={};
  document.querySelectorAll('.menu-edit-card').forEach(card=>{
    const key=card.dataset.menuKey,item=currentMenu[key];
    const prices={};card.querySelectorAll('.menu-price').forEach(input=>prices[input.dataset.size]=Number(input.value));
    menu[key]={...item,name:item.name,description:card.querySelector('.menu-description').value.trim(),prices};
  });
  return menu;
}
renderMenuEditor();

if(!configured){document.getElementById('setupNotice').hidden=false;setStatus(loginStatus,'Complete the one-time Firebase setup first.','error');document.querySelector('#loginForm button').disabled=true;}
else{
  firebase.initializeApp(config);auth=firebase.auth();db=firebase.firestore();
  auth.onAuthStateChanged(async user=>{
    if(!user){loginView.hidden=false;adminView.hidden=true;return;}
    if((user.email||'').toLowerCase()!==ADMIN_EMAIL){await auth.signOut();setStatus(loginStatus,'This email is not authorised for the dashboard.','error');return;}
    loginView.hidden=true;adminView.hidden=false;document.getElementById('adminIdentity').textContent=user.email;await loadSettings();
  });
}

document.getElementById('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!configured) return;setStatus(loginStatus,'Signing in…');
  try{await auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value.trim(),document.getElementById('loginPassword').value);}
  catch(error){
    const messages={
      'auth/invalid-credential':'Incorrect email or password.',
      'auth/wrong-password':'Incorrect email or password.',
      'auth/unauthorized-domain':'This website domain is not authorised in Firebase.',
      'auth/api-key-not-valid':'The Firebase connection key is invalid.'
    };
    setStatus(loginStatus,messages[error.code]||`Unable to sign in (${error.code||'connection error'}).`,'error');
  }
});
document.getElementById('resetPassword').onclick=async()=>{
  if(!configured) return;
  try{await auth.sendPasswordResetEmail(ADMIN_EMAIL);setStatus(loginStatus,'Password reset email sent.','success');}catch(error){setStatus(loginStatus,'Could not send the reset email.','error');}
};
document.getElementById('logoutButton').onclick=()=>auth.signOut();

async function loadSettings(){
  setStatus(saveStatus,'Loading live settings…');
  const [snapshot,menuSnapshot,customSnapshot]=await Promise.all([db.collection('store').doc('settings').get(),db.collection('store').doc('menu').get().catch(()=>null),db.collection('storeAssets').where('type','==','menuItem').get().catch(()=>null)]);
  currentSettings=snapshot.exists?snapshot.data():{};
  if(menuSnapshot&&menuSnapshot.exists) currentMenu={...currentMenu,...menuSnapshot.data().items};
  if(customSnapshot) customSnapshot.forEach(doc=>{const data=doc.data();currentMenu[data.key||doc.id.replace(/^menu_/, '')]={...data.item,imageDataUrl:data.dataUrl||data.item.imageDataUrl||'',custom:true,assetDocId:doc.id};});
  renderMenuEditor();
  document.getElementById('openingTime').value=minutesToTime(currentSettings.openMinutes??600);
  document.getElementById('closingTime').value=minutesToTime(currentSettings.closeMinutes??1200);
  document.getElementById('statusMode').value=currentSettings.statusMode||'automatic';
  document.getElementById('dashboardStoreName').value=currentSettings.storeName||'Iramdam Biryani';
  document.getElementById('dashboardTagline').value=currentSettings.tagline||'Fresh • Local • Made with care';
  document.getElementById('dashboardAddress').value=currentSettings.address||'Lamphel, Opposite MSPDCL Office';
  document.getElementById('announcementVisible').checked=currentSettings.announcementVisible!==false;
  document.getElementById('announcementText').value=currentSettings.announcementText||'';
  document.getElementById('announcementSpeed').value=currentSettings.announcementSpeed||34;
  const [logoAsset,headerAsset,...bannerAssets]=await Promise.all([db.collection('storeAssets').doc('logo').get(),db.collection('storeAssets').doc('header').get(),...Array.from({length:4},(_,index)=>db.collection('storeAssets').doc(`announcement${index+1}`).get())]);
  if(logoAsset.exists){const logo=document.getElementById('logoPreview');logo.src=logoAsset.data().dataUrl;logo.hidden=false;}
  if(headerAsset.exists)document.getElementById('headerPreview').style.backgroundImage=`linear-gradient(rgba(30,10,0,.62),rgba(30,10,0,.72)),url("${headerAsset.data().dataUrl}")`;
  bannerAssets.forEach((asset,index)=>{const preview=document.getElementById(`bannerPreview${index+1}`);preview.src=asset.exists?asset.data().dataUrl:'food-announcement-strip.png';});
  updatePreview();setStatus(saveStatus,'Live settings loaded.','success');
}

async function compressImage(file,maxWidth,maxHeight,quality){
  if(!file) return null;
  if(file.size>5*1024*1024) throw new Error('Images must be smaller than 5 MB.');
  const image=await createImageBitmap(file);
  const scale=Math.min(1,maxWidth/image.width,maxHeight/image.height);
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL('image/jpeg',quality);
  if(dataUrl.length>850000) throw new Error('This image is too detailed. Please choose a smaller image.');
  return dataUrl;
}

function resetNewItemForm(){
  ['newItemName','newItemDescription','newItemSize','newItemPrice','newItemImage'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('newItemForm').hidden=true;setStatus(document.getElementById('newItemStatus'),'');
}
document.getElementById('showNewItemForm').onclick=()=>{document.getElementById('newItemForm').hidden=false;document.getElementById('newItemName').focus();};
document.getElementById('cancelNewItem').onclick=resetNewItemForm;
document.getElementById('addNewItem').onclick=async()=>{
  const status=document.getElementById('newItemStatus');
  const name=document.getElementById('newItemName').value.trim(),description=document.getElementById('newItemDescription').value.trim();
  const size=document.getElementById('newItemSize').value.trim(),price=Number(document.getElementById('newItemPrice').value),file=document.getElementById('newItemImage').files[0];
  if(!name||!description||!size||!Number.isFinite(price)||price<0||!file){setStatus(status,'Please enter the name, description, image, size and price.','error');return;}
  if(Object.values(currentMenu).some(item=>item.name.toLowerCase()===name.toLowerCase())){setStatus(status,'A menu item with this name already exists.','error');return;}
  try{
    setStatus(status,'Preparing the new item…');
    const key=`custom_${Date.now()}`;pendingItemImages[key]=await compressImage(file,900,700,.75);
    currentMenu[key]={name,description,prices:{[size]:price},custom:true,assetDocId:`menu_${key}`};
    renderMenuEditor();resetNewItemForm();setStatus(saveStatus,'New item prepared. Tap Save & Publish Changes to make it live.');
  }catch(error){setStatus(status,error.message||'Could not prepare this item.','error');}
};

document.getElementById('settingsForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('saveButton');button.disabled=true;setStatus(saveStatus,'Uploading images and publishing changes…');
  try{
    const logoDataUrl=await compressImage(document.getElementById('logoFile').files[0],320,320,.82);
    const headerDataUrl=await compressImage(document.getElementById('headerFile').files[0],1400,800,.78);
    const bannerDataUrls=await Promise.all(Array.from({length:4},(_,index)=>compressImage(document.getElementById(`bannerFile${index+1}`).files[0],1000,520,.78)));
    const settings={openMinutes:timeToMinutes(document.getElementById('openingTime').value),closeMinutes:timeToMinutes(document.getElementById('closingTime').value),statusMode:document.getElementById('statusMode').value,storeName:document.getElementById('dashboardStoreName').value.trim(),tagline:document.getElementById('dashboardTagline').value.trim(),address:document.getElementById('dashboardAddress').value.trim(),announcementVisible:document.getElementById('announcementVisible').checked,announcementText:document.getElementById('announcementText').value.trim(),announcementSpeed:Number(document.getElementById('announcementSpeed').value),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    const menu=readMenuEditor();
    const builtInMenu=Object.fromEntries(Object.entries(menu).filter(([key])=>BUILTIN_MENU_KEYS.has(key)));
    const writes=[db.collection('store').doc('settings').set(settings,{merge:true}),db.collection('store').doc('menu').set({items:builtInMenu,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})];
    Object.entries(menu).filter(([,item])=>item.custom).forEach(([key,item])=>{
      const imageDataUrl=pendingItemImages[key]||item.imageDataUrl;
      writes.push(db.collection('storeAssets').doc(item.assetDocId||`menu_${key}`).set({type:'menuItem',key,dataUrl:imageDataUrl||'',item:{name:item.name,description:item.description,prices:item.prices,custom:true},updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}));
    });
    if(logoDataUrl) writes.push(db.collection('storeAssets').doc('logo').set({dataUrl:logoDataUrl,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
    if(headerDataUrl) writes.push(db.collection('storeAssets').doc('header').set({dataUrl:headerDataUrl,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
    bannerDataUrls.forEach((dataUrl,index)=>{if(dataUrl) writes.push(db.collection('storeAssets').doc(`announcement${index+1}`).set({dataUrl,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));});
    await Promise.all(writes);currentSettings={...currentSettings,...settings};currentMenu=menu;Object.keys(pendingItemImages).forEach(key=>delete pendingItemImages[key]);setStatus(saveStatus,'✓ Store and menu changes are now live for all customers.','success');
  }catch(error){setStatus(saveStatus,error.message||'Could not publish changes.','error');}finally{button.disabled=false;}
});

function updatePreview(){
  const opening=document.getElementById('openingTime').value,closing=document.getElementById('closingTime').value;
  document.getElementById('namePreview').textContent=document.getElementById('dashboardStoreName').value||'Iramdam Biryani';
  document.getElementById('taglinePreview').textContent=document.getElementById('dashboardTagline').value;
  document.getElementById('addressPreview').textContent=document.getElementById('dashboardAddress').value;
  document.getElementById('hoursPreview').textContent=`${formatTime(opening)}–${formatTime(closing)}`;
  const announcementText=document.getElementById('announcementText').value;
  document.getElementById('announcementTextPreview').textContent=announcementText||'Your announcement will appear here.';
  document.getElementById('announcementPreview').hidden=!document.getElementById('announcementVisible').checked;
  document.getElementById('speedValue').textContent=`${document.getElementById('announcementSpeed').value} seconds`;
}
document.querySelectorAll('#settingsForm input,#settingsForm select').forEach(input=>input.addEventListener('input',updatePreview));
document.getElementById('logoFile').addEventListener('change',event=>{const file=event.target.files[0];if(file){const image=document.getElementById('logoPreview');image.src=URL.createObjectURL(file);image.hidden=false;}});
document.getElementById('headerFile').addEventListener('change',event=>{const file=event.target.files[0];if(file)document.getElementById('headerPreview').style.backgroundImage=`linear-gradient(rgba(30,10,0,.62),rgba(30,10,0,.72)),url("${URL.createObjectURL(file)}")`;});
Array.from({length:4},(_,index)=>index+1).forEach(slot=>document.getElementById(`bannerFile${slot}`).addEventListener('change',event=>{const file=event.target.files[0];if(file)document.getElementById(`bannerPreview${slot}`).src=URL.createObjectURL(file);}));
