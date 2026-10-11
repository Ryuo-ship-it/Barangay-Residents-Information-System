/**
 * LocalStorage Database Wrapper for BRIS Prototype
 */

const DB_KEYS = {
    RESIDENTS: 'bris_residents',
    HOUSEHOLDS: 'bris_households',
    PUROKS: 'bris_puroks',
    HISTORY: 'bris_history',
    PROFILE: 'bris_profile'
};

const DB = {
    // Utility to generate unique IDs
    generateId: function(prefix) {
        return prefix + '-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    },

    // Get all data for a specific key
    getAll: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // Save all data for a specific key
    saveAll: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Initialization (seed default data if empty)
    init: function() {
        const defaultPuroks = [];
        for (let i = 1; i <= 10; i++) {
            defaultPuroks.push({ id: 'p' + i, name: 'Purok ' + i, status: 'Active' });
        }
        
        let existingPuroks = localStorage.getItem(DB_KEYS.PUROKS) ? JSON.parse(localStorage.getItem(DB_KEYS.PUROKS)) : [];
        if (existingPuroks.length < 10) {
            // Add any missing default puroks
            defaultPuroks.forEach(dp => {
                if (!existingPuroks.find(ep => ep.id === dp.id)) {
                    existingPuroks.push(dp);
                }
            });
            this.saveAll(DB_KEYS.PUROKS, existingPuroks);
        }

        if (!localStorage.getItem(DB_KEYS.PROFILE)) {
            this.saveAll(DB_KEYS.PROFILE, {
                barangayName: '',
                municipality: '',
                province: ''
            });
        }
    },

    /* --- Households --- */
    createHousehold: function(householdData) {
        const households = this.getAll(DB_KEYS.HOUSEHOLDS);
        const newHousehold = {
            id: this.generateId('hh'),
            createdAt: new Date().toISOString(),
            ...householdData
        };
        households.push(newHousehold);
        this.saveAll(DB_KEYS.HOUSEHOLDS, households);
        return newHousehold;
    },

    getHousehold: function(id) {
        return this.getAll(DB_KEYS.HOUSEHOLDS).find(hh => hh.id === id);
    },

    /* --- Residents --- */
    // Update an existing resident
    updateResident: function(id, updatedData) {
        const residents = this.getAll(DB_KEYS.RESIDENTS);
        const idx = residents.findIndex(r => r.id === id);
        if (idx === -1) return null;
        const updatedResident = { ...residents[idx], ...updatedData };
        residents[idx] = updatedResident;
        this.saveAll(DB_KEYS.RESIDENTS, residents);
        return updatedResident;
    },

    // Delete a resident by id
    deleteResident: function(id) {
        const residents = this.getAll(DB_KEYS.RESIDENTS).filter(r => r.id !== id);
        this.saveAll(DB_KEYS.RESIDENTS, residents);
        // Optionally, cleanup household head reference if needed
    },
    createResident: function(residentData, householdId, isHead = false) {
        const residents = this.getAll(DB_KEYS.RESIDENTS);
        
        const newResident = {
            id: this.generateId('res'),
            householdId: householdId,
            createdAt: new Date().toISOString(),
            status: 'Active',
            ...residentData
        };
        
        residents.push(newResident);
        this.saveAll(DB_KEYS.RESIDENTS, residents);

        // If this is the head of the family, update the household
        if (isHead) {
            const households = this.getAll(DB_KEYS.HOUSEHOLDS);
            const hhIndex = households.findIndex(hh => hh.id === householdId);
            if (hhIndex !== -1) {
                households[hhIndex].headResidentId = newResident.id;
                this.saveAll(DB_KEYS.HOUSEHOLDS, households);
            }
        }

        return newResident;
    },

    getResidentsByHousehold: function(householdId) {
        return this.getAll(DB_KEYS.RESIDENTS).filter(r => r.householdId === householdId);
    },

    /* --- Utilities --- */
    calculateAge: function(dob) {
        const birthday = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const m = today.getMonth() - birthday.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }
        return age;
    },

    exportData: function() {
        const exportObj = {};
        for (const key in DB_KEYS) {
            exportObj[DB_KEYS[key]] = this.getAll(DB_KEYS[key]);
        }
        return JSON.stringify(exportObj);
    },

    importData: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for (const key in DB_KEYS) {
                const storageKey = DB_KEYS[key];
                if (data[storageKey]) {
                    this.saveAll(storageKey, data[storageKey]);
                }
            }
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
};

// Initialize DB on load
DB.init();
