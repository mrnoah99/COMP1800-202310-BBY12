const redeemButton = document.getElementById("redeem_button");
const remainElement = document.querySelector(".redeem_remain");

async function fetchRemainingQuantity() {
  try {
    const response = await fetch("/getRemainingQuantity");
    if (response.ok) {
      const data = await response.json();
      remainElement.textContent = data.remainingQuantity;
      if (data.remainingQuantity === 0) {
        redeemButton.disabled = true;
      }
    } else {
      console.error("Failed to fetch remaining quantity");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function updateRemainingQuantity() {
  try {
    const response = await fetch("/updateRemainingQuantity", { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      remainElement.textContent = data.remainingQuantity;
      if (data.remainingQuantity === 0) {
        redeemButton.disabled = true;
      }
    } else {
      console.error("Failed to update remaining quantity");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function generateCDKey() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let cdKey = "";

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    cdKey += characters[randomIndex];
    if ((i + 1) % 4 === 0 && i !== 11) {
      cdKey += "-";
    }
  }

  return cdKey;
}

async function redeem() {
  document.getElementById("redeem_button").innerHTML = "Redeemed";
  document.getElementById("redeem_button").disabled = true;
  const cdKey = generateCDKey();
  alert("Redeem successfully! Your CD key is " + cdKey);
  await updateRemainingQuantity();
}

redeemButton.addEventListener("click", redeem);
fetchRemainingQuantity();
