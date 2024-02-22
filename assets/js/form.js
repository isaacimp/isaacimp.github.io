window.addEventListener("load", function() {
    const form = document.getElementById('my-form');
    const submitButton = form.querySelector('input[type="submit"]');

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const data = new FormData(form);
        const action = e.target.action;

        fetch(action, {
                method: 'POST',
                body: data
            })
            .then(() => {
                submitButton.value = "Thank you for your message!";
                submitButton.disabled = true; // Disable the submit button
                clearFormInputs(form); // Clear form inputs
            })
            .catch(() => {
                alert("An error occurred. Please try again later.");
            });
    });

    // Function to clear form inputs
    function clearFormInputs(form) {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach(input => {
            input.value = '';
        });
    }
});