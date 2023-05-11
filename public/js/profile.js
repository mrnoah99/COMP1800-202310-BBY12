document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.profile-form form');
    const newPassword = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    const saveButton = document.querySelector('button[type="submit"]');
  
    saveButton.addEventListener('click', function(event) {
      event.preventDefault();
  
      if (newPassword.value === confirmPassword.value) {
        // Send the data to the server for updating the password
        updatePassword(newPassword.value);
      } else {
        alert('New passwords do not match. Please try again.');
      }
    });
  });
  
  function updatePassword(newPassword) {
    // Replace this URL with the API endpoint to update the password in your server
    const apiUrl = 'https://your-api-url.com/update-password';
  
    // Replace this object with the appropriate data format required by your API
    const data = {
      newPassword: newPassword
    };
  
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Password updated successfully.');
        } else {
          alert('Error updating password. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error updating password. Please try again.');
      });
  }
  