const ADMIN_EMAIL='asemajitkumarsingh@gmail.com';
const config=window.IRAMDAM_FIREBASE_CONFIG;
const configured=config&&!String(config.apiKey).startsWith('PASTE_');
const loginView=document.getElementById('loginView');
const adminView=document.getElementById('adminView');
const loginStatus=document.getElementById('loginStatus');
const saveStatus=document.getElementById('saveStatus');
let auth,db,currentSettings={};

function setStatus(element,message,type=''){
  element.textContent=message;element.className=`status ${type}`;
}
function timeToMinutes(time){const [hours,minutes]=time.split(':').map(Number);return hours*60+minutes;}
function minutesToTime(minutes){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
function formatTime(time){const [h,m]=time.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}

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
  const snapshot=await db.collection('store').doc('settings').get();
  currentSettings=snapshot.exists?snapshot.data():{};
  document.getElementById('openingTime').value=minutesToTime(currentSettings.openMinutes??600);
  document.getElementById('closingTime').value=minutesToTime(currentSettings.closeMinutes??1200);
  document.getElementById('statusMode').value=currentSettings.statusMode||'automatic';
  document.getElementById('dashboardStoreName').value=currentSettings.storeName||'Iramdam Biryani';
  document.getElementById('dashboardTagline').value=currentSettings.tagline||'Fresh • Local • Made with care';
  document.getElementById('dashboardAddress').value=currentSettings.address||'Lamphel, Opposite MSPDCL Office';
  document.getElementById('announcementVisible').checked=currentSettings.announcementVisible!==false;
  document.getElementById('announcementText').value=currentSettings.announcementText||'';
  document.getElementById('announcementSpeed').value=currentSettings.announcementSpeed||34;
  const [logoAsset,headerAsset]=await Promise.all([db.collection('storeAssets').doc('logo').get(),db.collection('storeAssets').doc('header').get()]);
  if(logoAsset.exists){const logo=document.getElementById('logoPreview');logo.src=logoAsset.data().dataUrl;logo.hidden=false;}
  if(headerAsset.exists)document.getElementById('headerPreview').style.backgroundImage=`linear-gradient(rgba(30,10,0,.62),rgba(30,10,0,.72)),url("${headerAsset.data().dataUrl}")`;
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

document.getElementById('settingsForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('saveButton');button.disabled=true;setStatus(saveStatus,'Uploading images and publishing changes…');
  try{
    const logoDataUrl=await compressImage(document.getElementById('logoFile').files[0],320,320,.82);
    const headerDataUrl=await compressImage(document.getElementById('headerFile').files[0],1400,800,.78);
    const settings={openMinutes:timeToMinutes(document.getElementById('openingTime').value),closeMinutes:timeToMinutes(document.getElementById('closingTime').value),statusMode:document.getElementById('statusMode').value,storeName:document.getElementById('dashboardStoreName').value.trim(),tagline:document.getElementById('dashboardTagline').value.trim(),address:document.getElementById('dashboardAddress').value.trim(),announcementVisible:document.getElementById('announcementVisible').checked,announcementText:document.getElementById('announcementText').value.trim(),announcementSpeed:Number(document.getElementById('announcementSpeed').value),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    const writes=[db.collection('store').doc('settings').set(settings,{merge:true})];
    if(logoDataUrl) writes.push(db.collection('storeAssets').doc('logo').set({dataUrl:logoDataUrl,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
    if(headerDataUrl) writes.push(db.collection('storeAssets').doc('header').set({dataUrl:headerDataUrl,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
    await Promise.all(writes);currentSettings={...currentSettings,...settings};setStatus(saveStatus,'✓ Changes are now live for all customers.','success');
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
