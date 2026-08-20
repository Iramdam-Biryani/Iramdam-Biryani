document.querySelectorAll('.card').forEach(card=>{
  const qty=card.querySelector('.qty');

  card.querySelector('.minus').onclick=()=>
    qty.textContent=Math.max(1,+qty.textContent-1);

  card.querySelector('.plus').onclick=()=>
    qty.textContent=+qty.textContent+1;

  card.querySelector('.order').onclick=()=>{
    const msg=`Hello Iramdam Biryani, I want to order ${qty.textContent} x ${card.dataset.item}. Please confirm the price and availability.`;

    window.open(
      `https://wa.me/917005018537?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };
});
