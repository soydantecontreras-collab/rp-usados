import { createSignature } from './global-cursor.js';
const signature=createSignature();
const descriptions={
  A:'Precisión / Un punto y una envolvente mínima que se acomoda a cada contexto.',
  B:'Rodaje / Una pequeña rueda instrumental gira con el desplazamiento y acusa la velocidad.',
  C:'Cinta / Un trazo flexible conserva la dirección del gesto y se pliega sobre las acciones.',
  D:'Encuentro / El punto sigue tu mano; una segunda marca se encuentra con el elemento. Mi favorita.',
};
document.querySelectorAll('[data-system]').forEach(button=>button.addEventListener('click',()=>{
  signature.setMode(button.dataset.system);
  document.querySelectorAll('[data-system]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  document.querySelector('#system-description').textContent=descriptions[button.dataset.system];
}));
document.querySelector('#global-enabled').addEventListener('change',event=>signature.setEnabled(event.target.checked));
const photos=['side-1024x576','rear-1024x576','front-683x1024'],labels=['vista lateral','parte trasera','vista vertical'];
let index=0;
function show(n){
  index=(n+photos.length)%photos.length;
  const image=document.querySelector('#study-photo');
  image.src='./assets/demo-vento-'+photos[index]+'.jpg';image.alt='Volkswagen Vento DEMO, '+labels[index];
  document.querySelector('#gallery-counter').textContent=String(index+1).padStart(2,'0')+' / 03';
  document.querySelectorAll('[data-photo]').forEach((button,n)=>n===index?button.setAttribute('aria-current','true'):button.removeAttribute('aria-current'));
}
document.querySelector('#gallery-prev').addEventListener('click',()=>show(index-1));
document.querySelector('#gallery-next').addEventListener('click',()=>show(index+1));
document.querySelector('.gallery-picture').addEventListener('click',()=>show(index+1));
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.photo))));
document.querySelector('#contact-demo').addEventListener('click',()=>{document.querySelector('#pending-contact').hidden=false;});
