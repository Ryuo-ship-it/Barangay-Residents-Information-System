/**
 * Households Management Logic
 */

function refreshHouseholdsTable(filterQuery = '') {
    const tbody = document.querySelector('#households-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const households = DB.getAll(DB_KEYS.HOUSEHOLDS);
    const puroks = DB.getAll(DB_KEYS.PUROKS);
    
    households.forEach(hh => {
        if (filterQuery && !hh.familyName.toLowerCase().includes(filterQuery.toLowerCase())) return;

        const members = DB.getResidentsByHousehold(hh.id).filter(r => r.status === 'Active');
        const head = members.find(r => r.relationshipToHead === 'Head of Family');
        const purok = puroks.find(p => p.id === hh.purokId);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${hh.familyName}</td>
            <td>${head ? head.fullName : '<i>No Head Assigned</i>'}</td>
            <td>${members.length}</td>
            <td>${purok ? purok.name : 'Unknown'}</td>
            <td>${hh.is4Ps ? 'Yes' : 'No'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="addFamilyMember('${hh.id}')">+ Add Member</button>
                <button class="btn btn-secondary btn-sm" onclick="viewHousehold('${hh.id}')">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global functions for buttons
window.addFamilyMember = function(householdId) {
    // Switch to Residents tab
    document.querySelector('.nav-item[data-target="residents-view"]').click();
    
    // Open Add Resident Modal
    document.getElementById('btn-add-resident').click();
    
    // Pre-select Existing Mode and the specific household
    setTimeout(() => {
        document.getElementById('btn-mode-existing').click();
        document.getElementById('select-household').value = householdId;
    }, 100);
};

window.viewHousehold = function(id) {
    alert("Viewing Household ID: " + id + "\n(Detailed view to be fully implemented)");
};

document.addEventListener('DOMContentLoaded', () => {
    refreshHouseholdsTable();

    document.getElementById('search-household')?.addEventListener('input', (e) => {
        refreshHouseholdsTable(e.target.value);
    });
    
    document.getElementById('btn-add-household')?.addEventListener('click', () => {
        alert("To create a household, go to Residents and select 'Create New Family' when adding a Head of Family.");
        // Redirect to resident creation for better UX
        document.querySelector('.nav-item[data-target="residents-view"]').click();
        setTimeout(() => {
            document.getElementById('btn-add-resident').click();
            setTimeout(() => {
                document.getElementById('btn-mode-new').click();
            }, 100);
        }, 100);
    });
});
