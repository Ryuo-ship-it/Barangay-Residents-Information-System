/**
 * Core Application Logic & Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(view => view.classList.remove('active'));
            
            // Add active class to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Update Title
            pageTitle.textContent = item.textContent.trim();

            // Trigger view-specific refreshes
            if (targetId === 'dashboard-view' && typeof refreshDashboard === 'function') {
                refreshDashboard();
            }
        });
    });

    // --- Settings / Backup Logic ---
    
    // Load Settings
    const profile = DB.getAll(DB_KEYS.PROFILE);
    if(profile && Object.keys(profile).length > 0) {
        document.getElementById('setting-brgy-name').value = profile.barangayName || '';
        document.getElementById('setting-municipality').value = profile.municipality || '';
        document.getElementById('setting-province').value = profile.province || '';
    }

    // Save Settings
    document.getElementById('btn-save-profile')?.addEventListener('click', () => {
        const newProfile = {
            barangayName: document.getElementById('setting-brgy-name').value,
            municipality: document.getElementById('setting-municipality').value,
            province: document.getElementById('setting-province').value
        };
        DB.saveAll(DB_KEYS.PROFILE, newProfile);
        alert('Profile saved successfully!');
    });

    // Export Backup
    document.getElementById('btn-backup-data')?.addEventListener('click', () => {
        const dataStr = DB.exportData();
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'bris_backup_' + new Date().toISOString().slice(0,10) + '.json';
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    // Import Backup
    document.getElementById('file-import-data')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (confirm('Warning: This will overwrite all current data. Are you sure you want to proceed?')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = DB.importData(event.target.result);
                if (success) {
                    alert('Data restored successfully! The page will now reload.');
                    location.reload();
                } else {
                    alert('Failed to parse backup file. Make sure it is a valid JSON backup.');
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        e.target.value = '';
    });

});
