/**
 * Residents Management Logic
 */

let currentAddMode = null; // 'existing' or 'new'
let editResidentId = null; // holds id when editing

function refreshResidentsTable(filterQuery = '', filterPurok = '') {
    const tbody = document.querySelector('#residents-table tbody');
    tbody.innerHTML = '';
    
    let residents = DB.getAll(DB_KEYS.RESIDENTS).filter(r => r.status === 'Active');
    
    residents.forEach(res => {
        const hh = DB.getHousehold(res.householdId);
        if (!hh) return;

        // Apply filters
        if (filterPurok && hh.purokId !== filterPurok) return;
        if (filterQuery) {
            const q = filterQuery.toLowerCase();
            if (!res.fullName.toLowerCase().includes(q) && !hh.familyName.toLowerCase().includes(q)) return;
        }

        const age = DB.calculateAge(res.dateOfBirth);
        const purok = DB.getAll(DB_KEYS.PUROKS).find(p => p.id === hh.purokId);
        const purokName = purok ? purok.name : 'Unknown';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${res.fullName}</td>
            <td>${age}</td>
            <td>${res.sex}</td>
            <td>${purokName}</td>
            <td>${hh.familyName} (${res.relationshipToHead})</td>
            <td class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="viewResident('${res.id}')"><i class="ph ph-eye"></i> View</button>
                <button class="btn btn-primary btn-sm" onclick="editResident('${res.id}')"><i class="ph ph-pencil-simple"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteResident('${res.id}')"><i class="ph ph-trash"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initResidentModal() {
    const modal = document.getElementById('resident-modal');
    const btnAdd = document.getElementById('btn-add-resident');
    const btnClose = document.querySelector('.close-modal');
    const btnCancel = document.getElementById('btn-cancel-resident');
    
    // Mode buttons
    const btnModeExisting = document.getElementById('btn-mode-existing');
    const btnModeNew = document.getElementById('btn-mode-new');
    const form = document.getElementById('resident-form');
    const modeSelector = document.getElementById('add-mode-selector');
    
    // Sections
    const sectionExisting = document.getElementById('existing-family-section');
    const sectionNew = document.getElementById('new-family-section');

    function resetModal() {
        form.reset();
        form.style.display = 'none';
        modeSelector.style.display = 'block';
        currentAddMode = null;
    }

    btnAdd.addEventListener('click', () => {
        resetModal();
        modal.style.display = 'flex';
        populateDropdowns();
    });

    btnClose.addEventListener('click', () => modal.style.display = 'none');
    btnCancel.addEventListener('click', () => modal.style.display = 'none');

    // 4Ps Toggle
    document.getElementById('hh-is-4ps').addEventListener('change', (e) => {
        document.getElementById('group-4ps-id').style.display = e.target.checked ? 'block' : 'none';
    });

    btnModeExisting.addEventListener('click', () => {
        currentAddMode = 'existing';
        modeSelector.style.display = 'none';
        form.style.display = 'block';
        sectionExisting.style.display = 'block';
        sectionNew.style.display = 'none';
        
        // Required fields toggle
        document.getElementById('select-household').required = true;
        document.getElementById('hh-family-name').required = false;
        document.getElementById('hh-address').required = false;
    });

    btnModeNew.addEventListener('click', () => {
        currentAddMode = 'new';
        modeSelector.style.display = 'none';
        form.style.display = 'block';
        sectionExisting.style.display = 'none';
        sectionNew.style.display = 'block';

        // Set default relation to Head
        document.getElementById('res-relationship').value = 'Head of Family';
        
        // Required fields toggle
        document.getElementById('select-household').required = false;
        document.getElementById('hh-family-name').required = true;
        document.getElementById('hh-address').required = true;
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let householdId = null;

        if (currentAddMode === 'new') {
            const hhData = {
                familyName: document.getElementById('hh-family-name').value,
                address: document.getElementById('hh-address').value,
                purokId: document.getElementById('hh-purok').value,
                houseOwnership: document.getElementById('hh-ownership').value,
                is4Ps: document.getElementById('hh-is-4ps').checked,
                "4PsHouseholdID": document.getElementById('hh-4ps-id').value || null
            };
            const newHh = DB.createHousehold(hhData);
            householdId = newHh.id;
        } else {
            householdId = document.getElementById('select-household').value;
        }

        const resData = {
            fullName: document.getElementById('res-name').value,
            relationshipToHead: document.getElementById('res-relationship').value,
            dateOfBirth: document.getElementById('res-dob').value,
            sex: document.getElementById('res-sex').value,
            civilStatus: document.getElementById('res-civil').value,
            educationalAttainment: document.getElementById('res-education').value,
            contactNumber: document.getElementById('res-contact').value,
            occupation: document.getElementById('res-occupation').value
        };

        // Determine if we are editing an existing resident
        if (editResidentId) {
            // Update resident data
            DB.updateResident(editResidentId, { ...resData, householdId });
            alert('Resident updated successfully!');
            // Reset edit mode
            editResidentId = null;
        } else {
            const isHead = resData.relationshipToHead === 'Head of Family';
            DB.createResident(resData, householdId, isHead);
            alert('Resident saved successfully!');
        }
        modal.style.display = 'none';
        refreshResidentsTable();
        if (typeof refreshDashboard === 'function') refreshDashboard();
        if (typeof refreshHouseholdsTable === 'function') refreshHouseholdsTable();
    });
}

function populateDropdowns() {
    // Populate Puroks
    const puroks = DB.getAll(DB_KEYS.PUROKS);
    const purokSelects = [document.getElementById('hh-purok'), document.getElementById('filter-purok')];
    
    purokSelects.forEach(select => {
        if (!select) return;
        const isFilter = select.id === 'filter-purok';
        select.innerHTML = isFilter ? '<option value="">All Puroks</option>' : '';
        puroks.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            select.appendChild(opt);
        });
    });

    // Populate Households for Existing
    const households = DB.getAll(DB_KEYS.HOUSEHOLDS);
    const hhSelect = document.getElementById('select-household');
    if (hhSelect) {
        hhSelect.innerHTML = '<option value="">-- Select Household --</option>';
        households.forEach(hh => {
            const purok = puroks.find(p => p.id === hh.purokId);
            const opt = document.createElement('option');
            opt.value = hh.id;
            opt.textContent = `${hh.familyName} - ${hh.address} (${purok ? purok.name : ''})`;
            hhSelect.appendChild(opt);
        });
    }
}

// Global View function
window.viewResident = function(id) {
    const resident = DB.getAll(DB_KEYS.RESIDENTS).find(r => r.id === id);
    if (resident) {
        alert("Resident: " + resident.fullName + "\nDOB: " + resident.dateOfBirth + "\nSex: " + resident.sex);
    } else {
        alert('Resident not found');
    }
};

window.editResident = function(id) {
    const resident = DB.getAll(DB_KEYS.RESIDENTS).find(r => r.id === id);
    if (!resident) { alert('Resident not found'); return; }
    editResidentId = id;
    // Populate modal fields
    document.getElementById('res-name').value = resident.fullName;
    document.getElementById('res-relationship').value = resident.relationshipToHead;
    document.getElementById('res-dob').value = resident.dateOfBirth;
    document.getElementById('res-sex').value = resident.sex;
    document.getElementById('res-civil').value = resident.civilStatus || '';
    document.getElementById('res-education').value = resident.educationalAttainment || '';
    document.getElementById('res-contact').value = resident.contactNumber || '';
    document.getElementById('res-occupation').value = resident.occupation || '';
    // Set modal for edit mode
    const modal = document.getElementById('resident-modal');
    modal.style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Edit Resident';
    // Hide mode selector, show form with existing household selection
    document.getElementById('add-mode-selector').style.display = 'none';
    const form = document.getElementById('resident-form');
    form.style.display = 'block';
    document.getElementById('existing-family-section').style.display = 'block';
    document.getElementById('new-family-section').style.display = 'none';
    // Pre-select household
    document.getElementById('select-household').value = resident.householdId;
    // Ensure inputs enabled and save button visible
    document.querySelectorAll('#resident-form input, #resident-form select').forEach(el => el.disabled = false);
    document.getElementById('btn-save-resident').classList.remove('hidden');
};

window.deleteResident = function(id) {
    if (!confirm('Are you sure you want to delete this resident?')) return;
    DB.deleteResident(id);
    refreshResidentsTable();
    if (typeof refreshDashboard === 'function') refreshDashboard();
    if (typeof refreshHouseholdsTable === 'function') refreshHouseholdsTable();
};

document.addEventListener('DOMContentLoaded', () => {
    initResidentModal();
    populateDropdowns();
    refreshResidentsTable();

    // Search filters
    document.getElementById('search-resident').addEventListener('input', (e) => {
        refreshResidentsTable(e.target.value, document.getElementById('filter-purok').value);
    });
    document.getElementById('filter-purok').addEventListener('change', (e) => {
        refreshResidentsTable(document.getElementById('search-resident').value, e.target.value);
    });
});
