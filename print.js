function printContent() {
        var section = document.getElementById('section');
        var sectionHeight = section.offsetHeight;
        var printableAreaHeight = window.innerHeight;

        // Check if the section height exceeds the printable area height
        if (sectionHeight > printableAreaHeight) {
            // Force a page break before the section
            section.style.pageBreakBefore = 'always';
        }

        // Initiate the print process
        window.print();
    }

