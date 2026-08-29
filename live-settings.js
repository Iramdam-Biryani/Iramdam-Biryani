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
  }catch(error){
    console.warn('Firebase setup incomplete:',error.message);
  }
})();
