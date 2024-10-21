// Declare selectedOptions in the global scope
var selectedOptions = [];

document.addEventListener("DOMContentLoaded", function() {
    var optionsContainer = document.getElementById("optionsContainer");
    var selectedOptionsTable = document.getElementById("selectedOptionsTable");

    var searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function(event) {
        var searchTerm = event.target.value.trim().toLowerCase();
        if (searchTerm.length < 2) {
            optionsContainer.innerHTML = ""; // Clear options when search field doesn't have enough characters
            return;
        }        

        optionsContainer.innerHTML = ""; // Clear previous options

        // Fetch options based on search term
        fetchOptions(searchTerm);
    });

    // Function to fetch options from server based on search term
function fetchOptions(searchTerm) {
    fetch(`/options?search=${searchTerm}`)
        .then(response => response.json())
        .then(data => {
            displayOptions(data);
        })
        .catch(error => console.error('Error fetching options:', error));
}

// Function to display options in the options container
function displayOptions(options) {
    // Filter out options that are already selected
    var filteredOptions = options.filter(function(option) {
        return !selectedOptions.some(function(selectedOption) {
            return selectedOption.designation === option.designation;
        });
    });

    filteredOptions.forEach(function(option) {
        addOption(option);
    });
}

function addOption(option) {
    var checkboxDiv = document.createElement("div");
    checkboxDiv.classList.add("form-check");

    var checkboxInput = document.createElement("input");
    checkboxInput.classList.add("form-check-input");
    checkboxInput.type = "checkbox";
    checkboxInput.id = option.designation; // Assuming designation is unique
    checkboxInput.name = option.designation; // Assuming designation is unique
    checkboxInput.addEventListener("change", function() {
        if (this.checked) {
            selectedOptions.push(option); // Update selectedOptions array
        } else {
            var index = selectedOptions.findIndex(item => item.designation === option.designation);
            if (index !== -1) {
                selectedOptions.splice(index, 1);
            }
        }
        updateSelectedOptionsTable();
    });

    var checkboxLabel = document.createElement("label");
    checkboxLabel.classList.add("form-check-label");
    checkboxLabel.setAttribute("for", option.designation); // Assuming designation is unique
    checkboxLabel.textContent = `${option.designation} - Lab: ${option.prix_labo} DA, Pharm: ${option.prix_pharm} DA`;

    checkboxDiv.appendChild(checkboxInput);
    checkboxDiv.appendChild(checkboxLabel);

    optionsContainer.appendChild(checkboxDiv);
}

function updateSelectedOptionsTable() {
    selectedOptionsTable.innerHTML = "";

    let totalLabo = 0;
    let totalPharm = 0;

    selectedOptions.forEach(function(option) {
        var row = selectedOptionsTable.insertRow();
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);

        // Construct the option with parentheses
        cell1.textContent = option.designation;
        cell2.textContent = option.type_tube;// Enclose abbreviation in parentheses
        cell3.textContent = option.prix_labo; // Enclose prix_labo in parentheses
        cell4.textContent = option.prix_pharm; // Enclose prix_pharm in parentheses
        // Remove button with icon
        var removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("btn", "btn-danger", "btn-sm");

        // Add icon
        var removeIcon = document.createElement("i");
        removeIcon.classList.add("fas", "fa-trash-alt"); // Assuming you're using Font Awesome icons

        removeButton.appendChild(removeIcon);
        removeButton.addEventListener("click", function() {
            removeOption(option);
        });

        // Center the button
        var buttonWrapper = document.createElement("div");
        buttonWrapper.classList.add("d-flex", "justify-content-center"); // Flexbox utility classes
        buttonWrapper.appendChild(removeButton);
        cell5.appendChild(buttonWrapper);

        // Extract labo and pharm values and add to totals
        totalLabo += parseInt(option.prix_labo);
        totalPharm += parseInt(option.prix_pharm);
    });

    // Add total row
    var totalRow = selectedOptionsTable.insertRow();
    var totalLaboCell = totalRow.insertCell(0);
    var totalPharmCell = totalRow.insertCell(1);
    totalLaboCell.innerHTML = "";
    totalPharmCell.innerHTML = "<mark>Total:</mark>";
    var totalLaboAmountCell = totalRow.insertCell(2);
    var totalPharmAmountCell = totalRow.insertCell(3);
    var total = totalRow.insertCell(4);
    totalLaboAmountCell.innerHTML = "<mark>" + totalLabo + " DA</mark>";
    totalPharmAmountCell.innerHTML = "<mark>" + totalPharm + " DA</mark>";

    // Clear search input
    searchInput.value = "";
    // Give focus to the search input
    searchInput.focus();
    
}
    function removeOption(optionText) {
        var index = selectedOptions.indexOf(optionText);
        if (index !== -1) {
            selectedOptions.splice(index, 1);
            updateSelectedOptionsTable();
            var checkbox = document.getElementById(optionText);
            if (checkbox) {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove("selected");
            }
        }
    }

    // Prevent form submission if no option is selected
    var form = document.getElementById("myForm"); // Replace "yourFormId" with the actual ID of your form
    form.addEventListener("submit", function(event) {
        if (selectedOptions.length === 0) {
            event.preventDefault(); // Prevent form submission
            alert("Veuillez sélectionner au moins une option.");
            // Translates to: "Please select at least one option."
        }
    });

});


