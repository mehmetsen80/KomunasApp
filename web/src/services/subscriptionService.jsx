import axiosInstance from './axiosInstance';

/**
 * Service for interacting with the local Subscription API.
 */
const subscriptionService = {
  /**
   * Subscribes a user to a specific USCIS resource for monitoring.
   */
  subscribe: async (resourceId, userId, userEmail) => {
    try {
      const response = await axiosInstance.post('/api/subscriptions/subscribe', {
        resourceCategory: 'uscis-sentinel',
        resourceId: resourceId,
        userId: userId,
        appName: 'komunas-app',
        delivery: {
          emailEnabled: true,
          email: userEmail || userId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error in subscriptionService.subscribe for ${resourceId}:`, error);
      throw error;
    }
  },

  /**
   * Unsubscribes a user from a specific monitoring record.
   */
  unsubscribe: async (subscriptionId) => {
    try {
      await axiosInstance.delete(`/api/subscriptions/${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(`Error in subscriptionService.unsubscribe for ${subscriptionId}:`, error);
      throw error;
    }
  }
};

export default subscriptionService;
