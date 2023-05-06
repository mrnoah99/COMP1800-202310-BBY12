const phoneInput = document.getElementById('phone');

phoneInput.addEventListener('input', () => {
  const input = phoneInput.value.replace(/\D/g, '').substring(0,10);
  const formatted = input.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'); 
  phoneInput.value = formatted;
});
