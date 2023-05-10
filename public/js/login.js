const loginButton = document.getElementById("login-button");

loginButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

const signupButton = document.getElementById("gotosignup-button");

signupButton.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "signup.html";
});
