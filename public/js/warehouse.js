document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll("#copy_button");

  copyButtons.forEach((copyButton, index) => {
    copyButton.addEventListener("click", () => {
      const keyDetails = document.querySelector(`.key${index + 1}_details`).textContent;
      
      navigator.clipboard.writeText(keyDetails).then(() => {
        console.log('CD Key copied to clipboard');
      }).catch(err => {
        console.error('Error in copying CD Key: ', err);
      });
    });
  });
});
