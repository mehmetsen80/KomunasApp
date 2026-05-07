import axiosInstance from './axiosInstance';

/**
 * Service for interacting with USCIS Resource Sync State APIs.
 */
const resourceSyncService = {
  /**
   * Fetches all monitored USCIS form statuses and maps them to UI-friendly objects.
   */
  getAllFormStatuses: async (userId = null) => {
    try {
      const url = userId ? `/api/uscis/status/check/all?userId=${userId}` : '/api/uscis/status/check/all';
      const response = await axiosInstance.get(url);
      
      // Map backend DTO to UI-friendly structure
      return response.data.map(item => ({
        id: item.resourceId,
        domain: item.domain,
        category: item.category,
        name: item.summary || 'USCIS Form',
        version: item.currentVersion || 'N/A',
        status: item.enabled ? 'Active' : 'Inactive',
        pdfUrl: item.resourceUrl,
        instrUrl: item.instructionsUrl,
        lastCheckedAt: item.lastCheckedAt,
        changeDetected: item.changeDetected,
        subscribed: item.subscribed,
        subscriptionId: item.subscriptionId
      }));
    } catch (error) {
      console.error('Error in resourceSyncService.getAllFormStatuses:', error);
      throw error;
    }
  },

  /**
   * Fetches the status and full history for a specific form.
   */
  getFormStatus: async (formId, userId = null) => {
    try {
      const url = userId ? `/api/uscis/status/check/${formId}?userId=${userId}` : `/api/uscis/status/check/${formId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error in resourceSyncService.getFormStatus for ${formId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches the status and full history for a specific newsroom resource.
   */
  getNewsroomStatus: async (resourceId, userId = null) => {
    try {
      const url = userId ? `/api/uscis/status/newsroom/${resourceId}?userId=${userId}` : `/api/uscis/status/newsroom/${resourceId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error in resourceSyncService.getNewsroomStatus for ${resourceId}:`, error);
      throw error;
    }
  }
};

export default resourceSyncService;
