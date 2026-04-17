'use strict';

const Logger = require('dw/system/Logger').getLogger('recurringPaymentJob');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const recurringJobHelper = require('*/cartridge/scripts/helpers/recurring/recurringJobHelper');

/**
 * Recurring payment job
 * @returns {dw.system.Status} Status - job results
 */
function recurringPaymentJob() {
    const allowRecurringTokenization = Site.getCurrent().getCustomPreferenceValue('allowRecurringTokenization');

    if (!allowRecurringTokenization) {
        Logger.info(`Recurring job disabled doue to allowRecurringTokenization preference`)
        return new Status(Status.OK);
    }

    const recurringOrders = recurringJobHelper.getRecurringOrders();

    if (!recurringOrders || recurringOrders.count === 0) {
        Logger.info(`Recurring orders not found`)
        return new Status(Status.OK);
    }

    const results = recurringJobHelper.filterRecurringOrders(recurringOrders);

    if (!results) {
        Logger.error(`Recurring job failed`)
        return new Status(Status.ERROR);
    }

    Logger.info(`Recurring job. Total orders:${results.total}, success:${results.successTotal}, failed:${results.failedTotal}`)

    return new Status(Status.OK);
}

module.exports = {
    recurringPaymentJob: recurringPaymentJob
};
