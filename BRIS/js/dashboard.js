/**
 * Dashboard Logic
 */

function refreshDashboard() {
    const residents = DB.getAll(DB_KEYS.RESIDENTS).filter(r => r.status === 'Active');
    const households = DB.getAll(DB_KEYS.HOUSEHOLDS);

    // Totals
    document.getElementById('stat-total-pop').textContent = residents.length;
    document.getElementById('stat-total-households').textContent = households.length;

    // Sex Breakdown
    const maleCount = residents.filter(r => r.sex === 'Male').length;
    const femaleCount = residents.filter(r => r.sex === 'Female').length;
    document.getElementById('stat-male').textContent = maleCount;
    document.getElementById('stat-female').textContent = femaleCount;

    // Age Groups
    let children = 0, adults = 0, seniors = 0;
    residents.forEach(r => {
        const age = DB.calculateAge(r.dateOfBirth);
        if (age < 18) children++;
        else if (age >= 18 && age < 60) adults++;
        else if (age >= 60) seniors++;
    });

    document.getElementById('stat-children').textContent = children;
    document.getElementById('stat-adults').textContent = adults;
    document.getElementById('stat-seniors').textContent = seniors;
    document.getElementById('stat-seniors-detail').textContent = seniors;

    // 4Ps Status (From Household Level)
    const _4psCount = residents.filter(r => {
        const hh = DB.getHousehold(r.householdId);
        return hh && hh.is4Ps;
    }).length;
    document.getElementById('stat-4ps').textContent = _4psCount;
    document.getElementById('stat-non-4ps').textContent = residents.length - _4psCount;

    // Housing (Household Level vs Resident Level - user requested House Ownership to be Resident level, 
    // but housing stats are often complicated. I will use Household level for these stats as requested 
    // in requirement 13 "housing statistics must NOT count every family member as a separate house")
    let ownHouse = 0, renting = 0, withRelatives = 0, otherHousing = 0;
    
    households.forEach(hh => {
        if (hh.houseOwnership === 'Own House') ownHouse++;
        else if (hh.houseOwnership === 'Renting') renting++;
        else if (hh.houseOwnership === 'Living with Relatives') withRelatives++;
        else otherHousing++;
    });

    document.getElementById('stat-own-house').textContent = ownHouse;
    document.getElementById('stat-renting').textContent = renting;
    document.getElementById('stat-relatives').textContent = withRelatives;
    document.getElementById('stat-housing-other').textContent = otherHousing;
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    refreshDashboard();
});
