/**
 * Reports Generation Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const btnGenerate = document.getElementById('btn-generate-report');
    const btnPrint = document.getElementById('btn-print-report');
    const reportTypeSelect = document.getElementById('report-type');
    const previewContainer = document.getElementById('report-preview');

    btnGenerate?.addEventListener('click', () => {
        const type = reportTypeSelect.value;
        generateReport(type);
    });

    btnPrint?.addEventListener('click', () => {
        if (!previewContainer.innerHTML.trim()) {
            alert('Please generate a report first.');
            return;
        }
        window.print();
    });

    function generateReport(type) {
        let html = '';
        const profile = DB.getAll(DB_KEYS.PROFILE);
        
        // Header (visible mostly in print)
        const headerHtml = `
            <div class="report-header" style="text-align: center; margin-bottom: 20px;">
                <h2>Barangay ${profile.barangayName || '[Barangay Name]'}</h2>
                <p>${profile.municipality || '[Municipality]'}, ${profile.province || '[Province]'}</p>
                <h3 style="margin-top: 10px; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
                    ${reportTypeSelect.options[reportTypeSelect.selectedIndex].text}
                </h3>
                <p style="text-align: right; font-size: 0.9em; margin-top: 5px;">Date Printed: ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        if (type === 'population') {
            html = generatePopulationReport();
        } else if (type === 'purok') {
            html = generatePurokReport();
        } else if (type === 'households') {
            html = generateHouseholdReport();
        } else if (type === '4ps') {
            html = generate4PsReport();
        }

        previewContainer.innerHTML = headerHtml + html;
    }

    function generatePopulationReport() {
        const residents = DB.getAll(DB_KEYS.RESIDENTS).filter(r => r.status === 'Active');
        
        let table = `<table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Civil Status</th>
                    <th>Contact</th>
                </tr>
            </thead>
            <tbody>`;
            
        residents.forEach(r => {
            table += `<tr>
                <td>${r.fullName}</td>
                <td>${DB.calculateAge(r.dateOfBirth)}</td>
                <td>${r.sex}</td>
                <td>${r.civilStatus}</td>
                <td>${r.contactNumber || 'N/A'}</td>
            </tr>`;
        });
        
        table += `</tbody></table>`;
        return `<p><strong>Total Population:</strong> ${residents.length}</p>` + table;
    }

    function generatePurokReport() {
        const residents = DB.getAll(DB_KEYS.RESIDENTS).filter(r => r.status === 'Active');
        const puroks = DB.getAll(DB_KEYS.PUROKS);
        
        let html = '';
        
        puroks.forEach(p => {
            const purokResidents = residents.filter(r => {
                const hh = DB.getHousehold(r.householdId);
                return hh && hh.purokId === p.id;
            });
            
            html += `<h4>${p.name} (Total: ${purokResidents.length})</h4>`;
            if (purokResidents.length === 0) {
                html += `<p>No residents found.</p>`;
                return;
            }
            
            html += `<table class="data-table" style="margin-bottom: 20px;">
                <thead><tr><th>Name</th><th>Age</th><th>Sex</th></tr></thead>
                <tbody>`;
            purokResidents.forEach(r => {
                html += `<tr><td>${r.fullName}</td><td>${DB.calculateAge(r.dateOfBirth)}</td><td>${r.sex}</td></tr>`;
            });
            html += `</tbody></table>`;
        });
        
        return html;
    }

    function generateHouseholdReport() {
        const households = DB.getAll(DB_KEYS.HOUSEHOLDS);
        const puroks = DB.getAll(DB_KEYS.PUROKS);
        
        let table = `<table class="data-table">
            <thead>
                <tr>
                    <th>Family Name</th>
                    <th>Purok</th>
                    <th>Address</th>
                    <th>House Ownership</th>
                </tr>
            </thead>
            <tbody>`;
            
        households.forEach(hh => {
            const p = puroks.find(p => p.id === hh.purokId);
            table += `<tr>
                <td>${hh.familyName}</td>
                <td>${p ? p.name : 'Unknown'}</td>
                <td>${hh.address}</td>
                <td>${hh.houseOwnership}</td>
            </tr>`;
        });
        
        table += `</tbody></table>`;
        return `<p><strong>Total Households:</strong> ${households.length}</p>` + table;
    }

    function generate4PsReport() {
        const households = DB.getAll(DB_KEYS.HOUSEHOLDS).filter(h => h.is4Ps);
        
        let table = `<table class="data-table">
            <thead>
                <tr>
                    <th>Family Name</th>
                    <th>4Ps Household ID</th>
                    <th>Members Count</th>
                </tr>
            </thead>
            <tbody>`;
            
        households.forEach(hh => {
            const membersCount = DB.getResidentsByHousehold(hh.id).length;
            table += `<tr>
                <td>${hh.familyName}</td>
                <td>${hh['4PsHouseholdID'] || 'Not Provided'}</td>
                <td>${membersCount}</td>
            </tr>`;
        });
        
        table += `</tbody></table>`;
        return `<p><strong>Total 4Ps Households:</strong> ${households.length}</p>` + table;
    }
});
