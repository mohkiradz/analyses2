$(document).ready(function() {
  // Function to update data based on selected date
  function updateData(selectedDate) {
    // Make AJAX request to fetch data from server with the selected date
    $.get('http://localhost:3000/data', { date: selectedDate }, function(response) {
      // Log the generated SQL query to the browser console
      console.log('Generated SQL Query:', response.sqlQuery);

      // Clear previous results
      $('#results-container').empty();

      // Check if response data is an array
      if (Array.isArray(response.data)) {
        // Iterate over the data and create table rows
        response.data.forEach(function(result) {
          // Format date of birth
          var dob = new Date(result.dob);
          var formattedDob = dob.getDate() + '/' + (dob.getMonth() + 1) + '/' + dob.getFullYear();

          // Calculate age
          var today = new Date();
          var age = today.getFullYear() - dob.getFullYear();
          var monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }

          // Create table row HTML
          var rowHtml = `
            <tr>
              <td>${result.nom} ${result.prenom}</td>
              <td>${formattedDob}</td>
              <td>${age}</td>
              <td>${result.total_labo} DA</td>
              <td>${result.total_pharm} DA</td>
              <td><button class="btn btn-primary details-btn" data-form-id="${result.id}">Details</button></td>
            </tr>
          `;
          $('#results-container').append(rowHtml);
        });

        // Attach click event listener to "Details" buttons
        $('.details-btn').on('click', function() {
          var formId = $(this).data('form-id');
          var $selectedOptionsContainer = $(this).closest('tr').find('.selected-options-container');

          // Make AJAX request to fetch selected options based on form ID
          $.get('http://localhost:3000/selected-options', { form_id: formId }, function(selectedOptions) {
            // Clear previous selected options
            $selectedOptionsContainer.empty();

            // Check if response data is an array
            if (Array.isArray(selectedOptions)) {
              // Iterate over the selected options and display them
              selectedOptions.forEach(function(option) {
                var optionHtml = `
                  <span class="badge bg-light text-dark" style="font-size:15px">${option.designation} (${option.prix_labo} DA)</span>
                `;
                $selectedOptionsContainer.append(optionHtml);
              });
            } else {
              console.error('Response data is not an array:', selectedOptions);
            }

            // Toggle visibility of selected options container
            $selectedOptionsContainer.slideToggle();
          });
        });
      } else {
        console.error('Response data is not an array:', response.data);
      }
    });
  }

  // Function to get formatted date (yyyy-mm-dd)
  function getFormattedDate(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1; // Month is zero-based
    var year = date.getFullYear();

    // Pad single digit day and month with leading zero
    if (day < 10) {
      day = '0' + day;
    }
    if (month < 10) {
      month = '0' + month;
    }

    return year + '-' + month + '-' + day;
  }

  // Handle change in the date input field
  $('#pre').on('change', function() {
    var selectedDate = $(this).val(); // Get the selected date value
    console.log('Selected Date:', selectedDate); // Log the selected date
    updateData(selectedDate); // Update data based on selected date
  });

  // Get today's date
  var today = new Date();
  var formattedDate = getFormattedDate(today); // Format today's date to yyyy-mm-dd

  // Update data initially with today's date
  updateData(formattedDate);
});