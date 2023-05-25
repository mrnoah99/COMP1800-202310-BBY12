$('.like-button').on('click', function () {
    var postId = $(this).data('id');

    fetch(`/community/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {

                $(this).find('.like-count').text(data.likes);

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
        fetch(`/community/${postId}/like`, {
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
});
