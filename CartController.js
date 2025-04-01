import { getCartItems } from '../store';
import { createCart } from 'shopify';

// TODO ajouter aussi gestion de l'auth dans la classe pour récup le cart associé au compte courant
// + refactor les layout.svelte une fois la classe écrite
// trouver comment utiliser une seule instance de CartController dans tout le front (Factory JS)

let cartId;
let checkoutUrl;
let cartCreatedAt;
let cartItems = [];

async function onLoad () {
  if (typeof window !== 'undefined') {
    cartId = JSON.parse(localStorage.getItem('cartId'));
    cartCreatedAt = JSON.parse(localStorage.getItem('cartCreatedAt'));
    checkoutUrl = JSON.parse(localStorage.getItem('cartUrl'));

    let currentDate = Date.now();
    let difference = currentDate - cartCreatedAt;
    let totalDays = Math.ceil(difference / (1000 * 3600 * 24));
    let cartIdExpired = totalDays > 6;
    if (cartId === 'undefined' || cartId === 'null' || cartIdExpired) {
      await callCreateCart();
    }
    await loadCart();
    document.addEventListener('keydown', (e) => {
      let keyCode = e.keyCode;
      if (keyCode === 27) {
        showCart = false;
      }
    });
  }
}

async function callCreateCart() {
  const cartRes = await createCart();

  if (typeof window !== 'undefined') {
    localStorage.setItem('cartCreatedAt', Date.now());
    localStorage.setItem('cartId', JSON.stringify(cartRes.body?.data?.cartCreate?.cart?.id));
    localStorage.setItem(
      'cartUrl',
      JSON.stringify(cartRes.body?.data?.cartCreate?.cart?.checkoutUrl)
    );
  }
}

async function loadCart() {
  const res = await getCartItems();
  cartItems = res?.body?.data?.cart?.lines?.edges;
}

let showCart = false;
let loading = false;

async function openCart() {
  await loadCart();
  showCart = true;
}
function hideCart() {
  showCart = false;
}

function getCheckoutUrl() {
  window.open(checkoutUrl, '_blank');
  loading = false;
}

async function addToCart(event) {
  await fetch('/cart.json', {
    method: 'PATCH',
    body: JSON.stringify({ cartId: cartId, variantId: event.detail.body })
  });
  // Wait for the API to finish before updating cart items
  await loadCart();
  loading = false;
}

async function removeProduct(event) {
  if (typeof window !== 'undefined') {
    cartId = JSON.parse(localStorage.getItem('cartId'));
  }
  await fetch('/cart.json', {
    method: 'PUT',
    body: JSON.stringify({
      cartId,
      lineId: event.detail.body.lineId,
      quantity: event.detail.body.quantity,
      variantId: event.detail.body.variantId
    })
  });
  await loadCart();
  loading = false;
}
