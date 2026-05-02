import axiosInstance from './axiosInstance';

/**
 * Service for interacting with the local Notification API.
 */
const notificationService = {
  /**
   * Fetches all notifications for the authenticated user.
   */
  getMyNotifications: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/notifications/all?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error in notificationService.getMyNotifications:', error);
      throw error;
    }
  },

  /**
   * Marks a notification as read.
   */
  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.post(`/api/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error(`Error in notificationService.markAsRead for ${notificationId}:`, error);
      throw error;
    }
  }
};

export default notificationService;
