document.addEventListener('DOMContentLoaded', () => {
  const profileImageElement = document.getElementById('profile-image');
  const editProfilePictureButton = document.getElementById('edit-profile-picture-button');

  editProfilePictureButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileData = e.target.result;
        profileImageElement.src = fileData; // Assign the file data directly to src

        // Save the file data to a variable or use it directly in the fetch request
        const saveProfilePictureButton = document.getElementById('save-profile-picture-button');
        saveProfilePictureButton.addEventListener('click', async () => {
          const formData = new FormData();
          formData.append('profileImage', file); // Append the file itself, not the file data

          try {
            const response = await fetch('/submitProfile', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              console.log('프로필 이미지가 성공적으로 업로드되었습니다.');
            } else {
              console.error('프로필 이미지 업로드 실패:', response.statusText);
            }
          } catch (error) {
            console.error('프로필 이미지 업로드 오류:', error);
          }
        });
      };

      reader.readAsDataURL(file);
    });

    input.click();
  });
});

// window.addEventListener('DOMContentLoaded', function () {
//   var passwordForm = document.getElementById('password-form');
//   if (passwordForm) {
//     passwordForm.addEventListener('submit', function (e) {
//       e.preventDefault();
//       var newPassword = document.getElementById('password').value;
//       var confirmPassword = document.getElementById('confirm-password').value;
//       if (newPassword === confirmPassword) {
//         fetch('/changePassword', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ newPassword: newPassword }),
//         })
//           .then(function (response) {
//             if (response.ok) {
//               alert('비밀번호가 성공적으로 변경되었습니다.');
//             } else {
//               throw new Error('비밀번호 변경에 실패했습니다.');
//             }
//           })
//           .catch(function (error) {
//             console.error('비밀번호 변경 오류:', error);
//             alert(error.message); // 오류 메시지를 출력합니다.
//           });
//       } else {
//         alert('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
//       }
//     });
//   }
// });


