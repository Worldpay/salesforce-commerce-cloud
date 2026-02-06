'use strict';

const WORLDPAY_ORDER_STATUS = {
    AUTHORIZED: 'authorized',
    REFUSED: 'refused',
    CANCELLEDSTATUS: 'cancelled',
    EXPIRED: 'expired',
    SETTLED: 'settled',
    SENT_FOR_REFUND: 'sentForRefund',
    SENT_FOR_SETTLE: 'sentForSettlement',
    WORLDPAY: 'Worldpay'
};

module.exports = { WORLDPAY_ORDER_STATUS };
