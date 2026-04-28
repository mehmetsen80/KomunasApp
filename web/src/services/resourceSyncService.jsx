import axiosInstance from './axiosInstance';

/**
 * Service for interacting with USCIS Resource Sync State APIs.
 */
const resourceSyncService = {
  /**
   * Fetches all monitored USCIS form statuses and maps them to UI-friendly objects.
   */
  getAllFormStatuses: async () => {
    try {
      const response = await axiosInstance.get('/api/uscis/status/check/all');
      
      // Map backend DTO to UI-friendly structure
      return response.data.map(item => ({
        id: item.resourceId,
        name: item.summary || 'USCIS Form',
        version: item.currentVersion || 'N/A',
        status: item.enabled ? 'Active' : 'Inactive',
        pdfUrl: item.resourceUrl,
        instrUrl: item.instructionsUrl,
        lastCheckedAt: item.lastCheckedAt,
        changeDetected: item.changeDetected
      }));
    } catch (error) {
      console.error('Error in resourceSyncService.getAllFormStatuses:', error);
      throw error;
    }
  },

  /**
   * Fetches the status and full history for a specific form.
   */
  getFormStatus: async (formId) => {
    try {
      const response = await axiosInstance.get(`/api/uscis/status/check/${formId}`);
      return response.data;
    } catch (error) {
      console.error(`Error in resourceSyncService.getFormStatus for ${formId}:`, error);
      throw error;
    }
  }
};

export default resourceSyncService;
