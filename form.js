function redirectToIndex() {
    window.location.href = 'index.html';
}

document.getElementById('myForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value,
        lastName: document.getElementById('lastName').value,
        dob: document.getElementById('dob').value,
        pre: document.getElementById('pre').value,
        num: document.getElementById('num').value, // Convert to integer
        selectedOptionsData: selectedOptions // Use selectedOptions array directly
    };
    
    // Check if any option is selected
    if (formData.selectedOptionsData.length === 0) {
        event.preventDefault(); // Prevent form submission
        alert("Veuillez sélectionner au moins une option.");
        // Translates to: "Please select at least one option."
    } else {
        // Make POST request to backend server
        fetch('submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Form data submitted successfully:', data);
            $('#statusSuccessModal').modal('show');
            // Optionally, display success message to the user
        })
        .catch(error => {
            console.error('There was a problem submitting the form:', error);
            // Optionally, display error message to the user
        });
    }
});
