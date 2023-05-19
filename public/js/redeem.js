const redeemButton = document.getElementById("redeem_button");
const remainElement = document.querySelector(".redeem_remain");

async function fetchRemainingKeys() {
  try {
    const response = await fetch("/getRemainingQuantity", { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      remainElement.textContent = data.remainingQuantity;
      if (data.remainingQuantity === 0) {
        redeemButton.disabled = true;
        redeemButton.innerHTML = "No keys remaining";
      }
    } else {
      console.error("Failed to fetch remaining keys");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}


async function redeemKey() {
  try {
    const response = await fetch("/redeemKey", { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      alert("Redeem successfully! Your CD key is " + data.cdKey);
      redeemButton.disabled = true;
      redeemButton.innerHTML = "Key Redeemed";
      fetchRemainingKeys();
    } else {
      const data = await response.json();
      alert(data.message);
      if (data.cdKey) {
        redeemButton.disabled = true;
        redeemButton.innerHTML = "Key Redeemed";
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}


redeemButton.addEventListener("click", redeemKey);
fetchRemainingKeys();


