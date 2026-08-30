(function(){
  const config=window.IRAMDAM_FIREBASE_CONFIG;
  if(!config||String(config.apiKey).startsWith('PASTE_')) return;
  try{
    if(!firebase.apps.length) firebase.initializeApp(config);
    firebase.firestore().collection('store').doc('settings').onSnapshot(snapshot=>{
      if(snapshot.exists&&window.applyLiveStoreSettings) window.applyLiveStoreSettings(snapshot.data());
    },error=>console.warn('Live store settings unavailable:',error.message));
    firebase.firestore().collection('storeAssets').doc('logo').onSnapshot(snapshot=>{
      if(snapshot.exists&&window.applyLiveStoreSettings) window.applyLiveStoreSettings({logoUrl:snapshot.data().dataUrl});
    });
    firebase.firestore().collection('storeAssets').doc('header').onSnapshot(snapshot=>{
      if(snapshot.exists&&window.applyLiveStoreSettings) window.applyLiveStoreSettings({headerImageUrl:snapshot.data().dataUrl});
    });
    Array.from({length:4},(_,index)=>index+1).forEach(slot=>firebase.firestore().collection('storeAssets').doc(`announcement${slot}`).onSnapshot(snapshot=>{
      if(snapshot.exists&&window.applyLiveBannerPhoto) window.applyLiveBannerPhoto(slot,snapshot.data().dataUrl);
    }));
    firebase.firestore().collection('storeAssets').where('type','==','menuItem').onSnapshot(snapshot=>{
      snapshot.docChanges().forEach(change=>{
        if(change.type==='removed') return;
        const data=change.doc.data();
        if(window.applyCustomMenuItem) window.applyCustomMenuItem(data.key||change.doc.id.replace(/^menu_/,''),{...data.item,imageDataUrl:data.dataUrl||data.item.imageDataUrl||''});
      });
    },error=>console.warn('Custom menu items unavailable:',error.message));
    firebase.firestore().collection('store').doc('menu').onSnapshot(snapshot=>{
      if(snapshot.exists&&window.applyLiveMenu) window.applyLiveMenu(snapshot.data().items||{});
    });
  }catch(error){
    console.warn('Firebase setup incomplete:',error.message);
  }
})();
