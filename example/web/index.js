
async function main() {

  const w = await window.wallet({
    network : 'regtest'
  });
  (document.getElementById('seed')).textContent = w.seed.mnemonic
  window.demoWallet = w
}


document.addEventListener("DOMContentLoaded", function(event) {
  main()
});
