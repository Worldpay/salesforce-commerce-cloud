'use strict';

/**
 * Batch job for reading Custom Objects of Order Notifications,
 * updating Order Statuses and notifying about errors
 */
function orderNotificationUpdateJobAccess() {
    const Logger = require('dw/system/Logger').getLogger('awp');
    const Site = require('dw/system/Site');

    const {
        removeNotifyCustomObject
    } = require('*/cartridge/scripts/helpers/notifications/coHelper');
    const {
        updateOrderWithNotification,
        getValidNotificationCustomObjects
    } = require('*/cartridge/scripts/helpers/notifications/jobHelper');
    const {
        JobResult
    } = require('*/cartridge/scripts/helpers/notifications/mailerHelper');

    const validCustomObjects = getValidNotificationCustomObjects();
    if (!validCustomObjects.length) {
        return;
    }

    validCustomObjects.forEach(({ customObject, payload, order }) => {
        let transactionReference =
            payload && payload.eventDetails
                ? payload.eventDetails.transactionReference
                : null;

        const isOrderUpdated = updateOrderWithNotification(order, payload);
        removeNotifyCustomObject(
            customObject,
            transactionReference,
            isOrderUpdated
        );
        if (!isOrderUpdated) {
            JobResult.addError(
                `Failed to update order for transactionReference: ${transactionReference}`,
                transactionReference,
                payload
            );
            Logger.error(
                `Failed to update order for transactionReference: ${transactionReference}. Removing custom object with ID: ${customObject.custom.ID}`
            );
        }
    });
    const enableJobMailerService = Site.getCurrent().getCustomPreferenceValue(
        'EnableJobMailerService'
    );
    const fromAddress = Site.getCurrent().getCustomPreferenceValue(
        'NotifyJobMailFrom'
    );
    const toAddress =
        Site.getCurrent().getCustomPreferenceValue('NotifyJobMailTo');


    if (enableJobMailerService && fromAddress && toAddress) {
        const {
            jobMailService
        } = require('*/cartridge/scripts/helpers/notifications/mailerHelper');

        let jobResult = JobResult.getInstance();
        jobMailService({
            errorList: jobResult.errorList,
            totalCount: jobResult.totalCount,
            errorCount: jobResult.errorCount
        });
    } else {
        Logger.warn("Job mail service disabled or not configured, please check configuration");
    }
}

module.exports = {
    orderNotificationUpdateJobAccess: orderNotificationUpdateJobAccess
};
