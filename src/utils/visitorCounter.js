// Visitor counter utility
export class VisitorCounter {
    constructor() {
        this.storageKey = 'luminance_visitor_data';
        this.init();
    }

    init() {
        const data = this.getVisitorData();
        
        // Check if this is a new session (page reload after more than 30 minutes)
        const now = Date.now();
        const lastVisit = data.lastVisit || 0;
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        if (now - lastVisit > sessionTimeout) {
            // New session, increment unique visitors
            data.uniqueVisitors = (data.uniqueVisitors || 0) + 1;
        }
        
        // Update visit data
        data.lastVisit = now;
        data.totalVisits = (data.totalVisits || 0) + 1;
        
        // Save updated data
        this.saveVisitorData(data);
        
        console.log('Visitor data:', {
            uniqueVisitors: data.uniqueVisitors,
            totalVisits: data.totalVisits,
            lastVisit: new Date(data.lastVisit).toLocaleString()
        });
    }

    getVisitorData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading visitor data:', error);
            return {};
        }
    }

    saveVisitorData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving visitor data:', error);
        }
    }

    getUniqueVisitors() {
        return this.getVisitorData().uniqueVisitors || 0;
    }

    getTotalVisits() {
        return this.getVisitorData().totalVisits || 0;
    }

    reset() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Visitor counter reset');
        } catch (error) {
            console.error('Error resetting visitor counter:', error);
        }
    }
}
