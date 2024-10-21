  
  function redirectTo() {
    window.location.href = 'analyses.html';
}


// JavaScript to handle live search after the user has typed at least 2 letters
document.getElementById('searchInput').addEventListener('input', async function(event) {
    const searchTerm = event.target.value.trim(); // Get search term from input field

    // Check if the search term is empty
    if (!searchTerm) {
        // Clear previous search results
        const searchResultsContainer = document.getElementById('searchResults');
        searchResultsContainer.innerHTML = '';
        return; // Exit the function early if search term is empty
    }

    // Check if the search term has at least 2 letters
    if (searchTerm.length >= 2) {
        try {
            // Make AJAX request to search for analyses as the user types
            const response = await fetch(`/search-analyses?search=${searchTerm}`);
            const data = await response.json();

            // Clear previous search results
            const searchResultsContainer = document.getElementById('searchResults');
            searchResultsContainer.innerHTML = '';

            // Create and append Bootstrap cards for each analysis in the search results
            data.forEach(analysis => {
                const card = document.createElement('div');
                const cardHtml = `
       
                    <div class="col-md-8 mx-auto">
              <div class="card mb-3">
                <div class="card-header" style="font-size:17px; font-weight:800">${analysis.designation} 
                <button type="button" class="btn btn-secondary btn-sm edit-btn float-end">Modifier</button></div>
                <div class="card-body">
                  
                  <span class="card-text" style="color:Blue;">Type Tube: ${analysis.type_tube}</span>
                  <span class="card-text float-end"  style="color:Blue;">Abreviation: ${analysis.abreviation}</span> <br>
                  <span class="card-text"  style="color:red;">Prix Labo: ${analysis.prix_labo} DA</span>
                  <span class="card-text float-end" style="color:green;">Prix Pharmacie: ${analysis.prix_pharm} DA</span>         
                                    
                </div>
              </div>
            </div>


    
                `;

                card.innerHTML = cardHtml;

                // Attach edit button event listener
                const editButton = card.querySelector('.edit-btn');
                editButton.addEventListener('click', function() {
                    // Open edit modal and populate with analysis data
                    document.getElementById('editAnalysisId').value = analysis.id;
                    document.getElementById('editDesignation').value = analysis.designation;
                    document.getElementById('editLaboPrice').value = analysis.prix_labo;
                    document.getElementById('editPharmPrice').value = analysis.prix_pharm;
                    $('#editModal').modal('show');
                });

                // Append card to search results container
                searchResultsContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error searching for analyses:', error);
            // Handle errors (e.g., display an error message to the user)
        }
    }
});
// JavaScript to handle form submission inside the modal
document.getElementById('editForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Get form data
    const formData = new FormData(this);
    const analysisId = formData.get('analysisId');
    const designation = formData.get('designation');
    const laboPrice = formData.get('laboPrice');
    const pharmPrice = formData.get('pharmPrice');

    try {
        // Make AJAX request to update the analysis in the database
        const response = await fetch('/update-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: analysisId,
                designation: designation,
                prix_labo: laboPrice,
                prix_pharm: pharmPrice
            })
        });

        if (response.ok) {
            // Close the modal
            $('#editModal').modal('hide');
            // Reload search results or update the specific card with the new data
            // You may need to implement this based on your application flow
            // Show the success modal
            $('#editedSuccessModal').modal('show');
        } else {
            console.error('Failed to update analysis');
            // Handle error (e.g., display an error message to the user)
        }
    } catch (error) {
        console.error('Error updating analysis:', error);
        // Handle errors (e.g., display an error message to the user)
    }
});



// JavaScript to handle click event of the "Add New Row" button and show the modal
document.getElementById('addRowButton').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default action
    $('#addRowModal').modal('show'); // Show the modal
});

document.getElementById('addRowForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Get form data
    const formData = new FormData(this);
    let typeTube = formData.get('type_tube'); // Get the value of the select input
    const newTypeTube = formData.get('new_type_tube'); // Get the value of the new type tube input
    if (typeTube === '__addNew__') {
        // If "Add New..." is selected, use the value from the newTypeTubeInput
        typeTube = newTypeTube;
    }

    // Log data before sending to the server
    console.log('Data being added to the database:');
    console.log('Designation:', formData.get('designation'));
    console.log('Type Tube (selected):', typeTube); // Log the selected value of typeTube
    console.log('New Type Tube:', newTypeTube); // Log the value of newTypeTubeInput
    console.log('Prix Labo:', formData.get('prix_labo'));
    console.log('Prix Pharm:', formData.get('prix_pharm'));
    // Add more console.log statements for additional form fields if needed

    // Rest of your code to submit form data to the server
    try {
        // Make AJAX request to add a new row to the database
        const response = await fetch('/add-row', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                designation: formData.get('designation'),
                type_tube: typeTube, // Use the updated value of typeTube
                prix_labo: formData.get('prix_labo'),
                prix_pharm: formData.get('prix_pharm')
                // Add more form fields as needed
            })
        });

        if (response.ok) {
            // Close the modal
            $('#addRowModal').modal('hide');
            // Reload search results or update the specific card with the new data
            // You may need to implement this based on your application flow
            // Show the success modal
            $('#addedSuccessModal').modal('show');
        } else {
            console.error('Failed to add analysis');
            // Handle error (e.g., display an error message to the user)
        }

        // Handle response...
    } catch (error) {
        console.error('Error adding new row:', error);
        // Handle errors (e.g., display an error message to the user)
    }
});
// JavaScript to handle change event of the type tube select input
document.getElementById('typeTubeInput').addEventListener('change', function() {
    const selectElement = this;
    const selectedValue = selectElement.value;
    
    if (selectedValue === '__addNew__') {
        // If "Add New..." option is selected, show the input field for new type tube
        document.getElementById('newTypeTubeInputWrapper').classList.remove('d-none');
        // Set focus to the input field for new type tube
        document.getElementById('newTypeTubeInput').focus();
        
    } else {
        // If any other option is selected, hide the input field for new type tube
        document.getElementById('newTypeTubeInputWrapper').classList.add('d-none');
    }
});


