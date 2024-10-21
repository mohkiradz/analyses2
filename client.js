$(document).ready(function() {
  // Function to update data based on selected date
  function updateData(selectedDate) {
    $.get('/data', { date: selectedDate }, function(response) {
      console.log('Generated SQL Query:', response.sqlQuery);

      $('#results-container').empty();

      if (Array.isArray(response.data)) {
        response.data.forEach(function(result) {
          var dob = new Date(result.dob);
          var formattedDob = dob.getDate().toString().padStart(2, '0') + '/' + 
  (dob.getMonth() + 1).toString().padStart(2, '0') + '/' + 
  dob.getFullYear();
          
          var today = new Date();
          var age = today.getFullYear() - dob.getFullYear();
          var monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }

          // Create card HTML with a new "Print" button
          var cardHtml = `
            <div class="col-md-10 mx-auto">
              <div class="card mb-3">
                <div class="card-header d-flex flex-nowrap" style="font-size:17px; font-weight:800">
                  <div class="col-7">${result.nom} ${result.prenom} </div>
                  <div class="col-5">
                    <span class="card-text details-btn float-end"  data-form-id="${result.id}"><i class="fa-solid fa-list-check"></i> Details</span> 
                    <span class="card-text toggle-valid-btn ms-2" style="color:Red;"  data-form-id="${result.id}" data-valid="${result.valid}"><i class="fa-regular fa-trash-can"></i> Supp</span> 
                    <span class="card-text print-btn ms-2" style="color:green;" data-form-id="${result.id}"><i class="fa-solid fa-print"></i> Facture</span>
                  </div> 
                </div>
                <div class="card-body">
                  <span class="card-text">Date Naissance: ${formattedDob} (${age} Ans)</span>
                  <span class="card-text float-end" style="color:Red;">Total Labo: ${result.total_labo} DA</span> <br>           
                  <span class="card-text">Num: ${result.num}</span>
                  <span class="card-text float-end" style="color:green;">Total Pharm: ${result.total_pharm} DA</span>
                </div>
                <div class="col-11 mx-auto mb-1">
                  <div class="selected-options-container" style="display: none;"></div>
                </div>
              </div>
            </div>
          `;
          $('#results-container').append(cardHtml);
        });

        // Attach click event listener to "Toggle Validity" button
        $('.toggle-valid-btn').on('click', async function() {
          const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer le prelevement ?');
          if (!confirmation) return;

          const $button = $(this);
          const formId = $button.data('form-id');
          if (formId === undefined) return;

          try {
            const response = await fetch('/update-validity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ form_id: formId })
            });

            if (response.ok) {
              const data = await response.json();
              $button.data('valid', 0);
              $button.closest('.card').slideUp();
            } else {
              console.error('Failed to update validity:', response.statusText);
            }
          } catch (error) {
            console.error('An error occurred:', error);
          }
        });

        // Attach click event listener to "Details" button
        $('.details-btn').on('click', function() {
          var formId = $(this).data('form-id');
          var $selectedOptionsContainer = $(this).closest('.card').find('.selected-options-container');

          $.get('/selected-options', { form_id: formId }, function(selectedOptions) {
            $selectedOptionsContainer.empty();

            if (Array.isArray(selectedOptions)) {
              selectedOptions.forEach(function(option) {
                var optionHtml = `<span class="badge bg-light text-dark" style="font-size:15px">${option.designation} (${option.prix_labo} DA)</span>`;
                $selectedOptionsContainer.append(optionHtml);
              });
            } else {
              console.error('Response data is not an array:', selectedOptions);
            }

            $selectedOptionsContainer.slideToggle(200);
          });
        });

        // Attach click event listener to "Print" button
        $('.print-btn').on('click', function() {
          var formId = $(this).data('form-id');
          var result = response.data.find(item => item.id === formId);

          // Recalculate formattedDob and age for the specific result
          var dob = new Date(result.dob);
          var formattedDob = dob.getDate().toString().padStart(2, '0') + '/' + 
  (dob.getMonth() + 1).toString().padStart(2, '0') + '/' + 
  dob.getFullYear();
          var pre = new Date(result.prelevement);
          var formattedpre = pre.getDate().toString().padStart(2, '0') + ' ' +
  pre.toLocaleString('default', { month: 'long' }) + ' ' +
  pre.getFullYear();   
          var today = new Date();
          var age = today.getFullYear() - dob.getFullYear();
          var monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }

          // Fetch selected options for the form
          $.get('/selected-options', { form_id: formId }, function(selectedOptions) {
            var optionsHtml = '';
            var optionsHtml2 = '';
            if (Array.isArray(selectedOptions)) {
              selectedOptions.forEach(function(option) {
                optionsHtml += `<span class="badge bg-light text-dark" style="font-size:15px">${option.designation} (${option.prix_labo} DA)</span><br>`;
                optionsHtml2 += `<span class="badge bg-light text-dark" style="font-size:15px">${option.designation} (${option.prix_pharm} DA)</span><br>`;
              });
            } else {
              console.error('Response data is not an array:', selectedOptions);
            }

            // Create a new window
            var printWindow = window.open('', '', 'width=800,height=600');
            
            // Ensure document.close() and setTimeout to trigger print after content load
            var printContent = `
              <html>
                <head>
                  <title>Print Result</title>
                  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                </head>
                <body>
                  <div class="container mt-5">
                    <h3>${result.nom} ${result.prenom}</h3>
                    <p>Prelevement du: ${formattedpre}</p>
                    <p>Date Naissance: ${formattedDob} (${age} Ans)</p>
                    
                    
                    <p>Total Pharm: ${result.total_pharm} DA</p>
                    <p><strong>Analyses:</strong></p>
                    ${optionsHtml2}
                  </div>
                </body>
              </html>
            `;

            // Write content to the new window and trigger the print
            printWindow.document.write(printContent);
            printWindow.document.close(); // Important to signal the end of writing

            // Use setTimeout to ensure the content is loaded before printing
            setTimeout(function() {
              printWindow.focus();
              
            }, 500); // Adjust delay if necessary
          });
        });
      } else {
        console.error('Response data is not an array:', response.data);
      }
    });
  }

  // Function to get formatted date (dd/mm/yyyy)
  function getFormattedDate(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;
    return day + '/' + month + '/' + year;
  }
  $(document).ready(function() {
    // Handle click event on the button
    $('#fetchDataBtn').on('click', function() {
      var selectedDate = $('#pre').val(); // Get the selected date value from the input field
      console.log('Selected Date:', selectedDate); // Log the selected date
      
      // Construct the URL with the selected date
      var url = '/results?prelevement=' + selectedDate;
      
      // Navigate to the constructed URL
      window.location.href = url;
    });
  
    // Handle change in the date input field
    $('#pre').on('change', function() {
      var selectedDate = $(this).val(); // Get the selected date value
      console.log('Selected Date:', selectedDate); // Log the selected date
      updateData(selectedDate); // Update data based on selected date
    });
  
    // Manually trigger the change event to log the selected date on page load
    $('#pre').trigger('change');
  
    // Get today's date
    var today = new Date();
    var formattedDate = getFormattedDate(today); // Format today's date to dd/mm/yyyy
  
    // Update data initially with today's date
    updateData(formattedDate);
  });
  });
