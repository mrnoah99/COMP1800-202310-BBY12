$('.like-button').on('click', function() {
  var postId = $(this).data('id');
  var liked = $(this).hasClass('liked'); // Check if the post is already liked

<<<<<<< HEAD
<<<<<<< HEAD
    fetch(/community/${postId}/like, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Update the like count on the button
                $(this).find('.like-count').text(data.likes);
                // Toggle the liked state on the button
                $(this).toggleClass('liked');
            } else {
                console.error('Error:', data);
            }
        })
        .catch((error) => console.error('Error:', error));
});

$(document).ready(function () {
    $('.like-button').each(function () {
        var postId = $(this).data('id');
        fetch(/community/${postId}/like, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    $(this).find('.like-count').text(data.likes);
                } else {
                    console.error('Error:', data);
                }
            })
            .catch((error) => console.error('Error:', error));
    });
})
=======
=======
>>>>>>> f5892d793f8391f9e8dcb177fed00e9cc97f8185
  fetch(`/community/${postId}/like`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked: liked }) // Send the liked state to the server
  })
  .then((response) => response.json())
  .then((data) => {
      if (data.success) {
          // Update the like count on the button
          this.querySelector('.like-count').textContent = data.likeCount;

          // Toggle the liked state on the button
          $(this).toggleClass('liked');
      } else {
          console.error('Error:', data);
      }
  })
  .catch((error) => console.error('Error:', error));
});
<<<<<<< HEAD
>>>>>>> dev
=======
>>>>>>> f5892d793f8391f9e8dcb177fed00e9cc97f8185
