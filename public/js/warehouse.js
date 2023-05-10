const copyButton = document.getElementById("copy_button");
copyButton.addEventListener("click", () => {
  const cdKey = document.querySelector(".key1_details").textContent;
  navigator.clipboard.writeText(cdKey);
  alert("CD key copied to clipboard: " + cdKey);
});

