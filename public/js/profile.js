document.getElementById('edit-profile-pic-btn').addEventListener('click', function() {
    document.getElementById('profile-pic-input').click();
});

document.getElementById('profile-pic-input').addEventListener('change', function() {
    const reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById('profile-pic').src = e.target.result;
    }

    reader.readAsDataURL(this.files[0]);
});


window.onload = function() {
  // Simulated user data
  var user = {
    nickname: "UserNickname",
    email: "user@example.com",
    password: "UserPassword"
  };
  
  // Fill form fields with user data
  document.getElementById('nickname').value = user.nickname;
  document.getElementById('email').value = user.email;
  // Do not display user password!
  
  // Add event listener to update user data when 'Save' button is clicked
  document.getElementById('save-button').addEventListener('click', function(e) {
    e.preventDefault();  // prevent form submission for this demo
    
    user.nickname = document.getElementById('nickname').value;
    user.email = document.getElementById('email').value;
    // Handle password change separately!
    
    // Update display fields
    document.getElementById('display-nickname').innerText = user.nickname;
    document.getElementById('display-email').innerText = user.email;
    
    // Here, you would normally send updated user data to your server
    // ...
  });
}

