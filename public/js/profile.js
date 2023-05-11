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
  

  document.getElementById('image-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Update the image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-img').src = e.target.result;
        }
        reader.readAsDataURL(file);
        
        // Send the image to the server
        const formData = new FormData();
        formData.append('image', file);
        fetch('/upload-profile-image', { // Replace this with the correct API endpoint
            method: 'POST',
            body: formData
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profile image updated successfully.');
                // The server should return the URL of the new image
                document.getElementById('profile-img').src = data.imageUrl;
            } else {
                alert('Error updating profile image. Please try again.');
            }
        }).catch(error => {
            console.error('Error:', error);
            alert('Error updating profile image. Please try again.');
        });
    }
});


function saveProfile() {
    // Get the input values
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;

    // Create an object to send to the server
    const profileData = {
        nickname: nickname,
        email: email
    };

    // Send the data to the server
    fetch('/update-profile', { // Replace this with the correct API endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Profile updated successfully.');
        } else {
            alert('Error updating profile. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('Error updating profile. Please try again.');
    });
}
