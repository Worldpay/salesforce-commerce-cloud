/**
* This Method describes all constants used in worldpay
*/
function WorldpayConstants() {}
WorldpayConstants.XMLVERSION = '<?xml version="1.0"?>';
WorldpayConstants.DTDINFO = '<!DOCTYPE paymentService PUBLIC "-//Worldpay/DTD Worldpay PaymentService v1//EN" "http://dtd.worldpay.com/paymentService_v1.dtd">';
WorldpayConstants.UNKNOWN_ENTITY = 'UNKNOWN_IDENTITY';
WorldpayConstants.CANCELLEDBYSHOPPER = 'CANCELLED_BY_SHOPPER';
WorldpayConstants.THREEDERROR = '3DERROR';
WorldpayConstants.THREEDSINVALIDERROR = '3DS_INVALID_ERROR';
WorldpayConstants.NOT_IDENTIFIED_NOID = 'NOT_IDENTIFIED_NOID';
WorldpayConstants.VISASSL = 'VISA-SSL';
WorldpayConstants.CBSSL = 'CB-SSL';
WorldpayConstants.AUTHORIZED = 'AUTHORISED';
WorldpayConstants.PARTIAL = 'PARTIALLYSETTLED';
WorldpayConstants.REFUND = 'PARTIALREFUND';
WorldpayConstants.CAPTURED = 'CAPTURED';
WorldpayConstants.VOIDED = 'VOIDED';
WorldpayConstants.PENDING = 'PENDING';
WorldpayConstants.REFUSED = 'REFUSED';
WorldpayConstants.OPEN = 'OPEN';
WorldpayConstants.XMLHEADER =
    '<?xml version="1.0"?><!DOCTYPE paymentService PUBLIC "-//Worldpay//DTD Worldpay PaymentService v1//EN" "http://dtd.worldpay.com/paymentService_v1.dtd">';
WorldpayConstants.STATEMENTNARRATIVE = '<statementNarrative></statementNarrative>';
WorldpayConstants.ORDERDESCRIPTION = 'Merchant Order Number : ';
WorldpayConstants.XMLPAYMENTDETAILS = '<paymentDetails></paymentDetails>';
WorldpayConstants.ECHECKSALE = '<echeckSale></echeckSale>';
WorldpayConstants.CSE = '<CSE-DATA></CSE-DATA>';
WorldpayConstants.ACCEPT = 'accept';
WorldpayConstants.MD = 'MD';
WorldpayConstants.PARES = 'PaRes';
WorldpayConstants.SERVICE_ID = 'int_worldpay.http.worldpay.payment.post';
WorldpayConstants.CANCEL_OR_REFUND = 'CancelOrRefund';
WorldpayConstants.EMPTY_RESPONSE = 'Empty Response';
WorldpayConstants.KLARNA_LOCALE = 'en-gb';
WorldpayConstants.DIRECT = 'DIRECT';
WorldpayConstants.REDIRECT = 'REDIRECT';
WorldpayConstants.CANCELLEDSTATUS = 'CANCELLED';
WorldpayConstants.FAILEDSTATUS = 'FAILED';
WorldpayConstants.COMPLETED = 'COMPLETED';
WorldpayConstants.NEW = 'NEW';
WorldpayConstants.CONFLICT = 'CONFLICT';
WorldpayConstants.MATCH = 'MATCH';
WorldpayConstants.EXPIRED = 'EXPIRED';
WorldpayConstants.CREATED = 'CREATED';
WorldpayConstants.SENT_FOR_REFUND = 'SENT_FOR_REFUND';
WorldpayConstants.SETTLED = 'SETTLED';
WorldpayConstants.INFORMATION_REQUESTED = 'INFORMATION_REQUESTED';
WorldpayConstants.CHARGED_BACK = 'CHARGED_BACK';
WorldpayConstants.XMLPAYMENTSERVICE = 'paymentService';
WorldpayConstants.XMLORDERSTATUSEVENT = 'orderStatusEvent';
WorldpayConstants.XMLLASTEVENT = 'lastEvent';
WorldpayConstants.XMLPAYMENTOPTION = 'paymentOption';
WorldpayConstants.merchanttokenType = 'Merchant';
// APM Names
WorldpayConstants.CHINAUNIONPAY = 'CHINAUNIONPAY-SSL';
WorldpayConstants.ALIPAY = 'ALIPAY-SSL';
WorldpayConstants.ALIPAYMOBILE = 'ALIPAYMOBILE-SSL';
WorldpayConstants.SOFORT = 'SOFORT-SSL';
WorldpayConstants.SOFORT_SWITZERLAND = 'SOFORT_CH-SSL';
WorldpayConstants.IDEAL = 'IDEAL-SSL';
WorldpayConstants.PAYPAL = 'PAYPAL-EXPRESS';
WorldpayConstants.PAYPAL_SSL = 'PAYPAL-SSL';
WorldpayConstants.MISTERCASH = 'MISTERCASH-SSL';
WorldpayConstants.WORLDPAY = 'Worldpay';
WorldpayConstants.CREDITCARD = 'CREDIT_CARD';
WorldpayConstants.GOOGLEPAY = 'PAYWITHGOOGLE-SSL';
WorldpayConstants.P24 = 'PRZELEWY-SSL';
WorldpayConstants.KONBINI = 'KONBINI-SSL';
WorldpayConstants.ELV = 'SEPA_DIRECT_DEBIT-SSL';
WorldpayConstants.POLI = 'POLI-SSL';
WorldpayConstants.NORDEAFI = 'SOLO-SSL';
WorldpayConstants.NORDEASE = 'EBETALNING-SSL';
WorldpayConstants.KLARNA = 'KLARNA-SSL';
WorldpayConstants.KLARNASLICEIT = 'KLARNA_SLICEIT-SSL';
WorldpayConstants.KLARNAPAYLATER = 'KLARNA_PAYLATER-SSL';
WorldpayConstants.KLARNAPAYNOW = 'KLARNA_PAYNOW-SSL';
WorldpayConstants.WECHATPAY = 'WECHATPAY-SSL';
WorldpayConstants.ACHPAY = 'ACH_DIRECT_DEBIT-SSL';
WorldpayConstants.APPLEPAY = 'DW_APPLE_PAY';

WorldpayConstants.BRAZILCOUNTRYCODE = 'BR';

WorldpayConstants.WEVDAVPATH = '/on/demandware.servlet/webdav/Sites';
WorldpayConstants.PMETHOD = 'https://';
// Error Numbers
WorldpayConstants.NOTIFYERRORCODE111 = '111';
WorldpayConstants.NOTIFYERRORCODE112 = '112';
WorldpayConstants.NOTIFYERRORCODE113 = '113';
WorldpayConstants.NOTIFYERRORCODE114 = '114';
WorldpayConstants.NOTIFYERRORCODE115 = '115';
WorldpayConstants.NOTIFYERRORCODE116 = '116';
WorldpayConstants.NOTIFYERRORCODE117 = '117';
WorldpayConstants.NOTIFYERRORCODE118 = '118';
WorldpayConstants.NOTIFYERRORCODE119 = '119';
WorldpayConstants.NOTIFYERRORCODE120 = '120';

WorldpayConstants.MAXUPDATELIMITERRORCODE = '5';

WorldpayConstants.MESSAGEDIGEST = 'MD5';
WorldpayConstants.LIGHTBOX = 'lightbox';
WorldpayConstants.PAYMENTSTATUS = 'paymentStatus';
WorldpayConstants.APMNAME = 'apmName';
WorldpayConstants.ORDERTOKEN = 'order_token';
WorldpayConstants.ORDERID = 'order_id';
WorldpayConstants.DEBITCREDITINDICATOR = 'credit';
WorldpayConstants.CUSTOMERORDER = 'Customer';

WorldpayConstants.MERCHANT_TOKEN_SCOPE = 'merchant';
WorldpayConstants.SHOPPER_TOKEN_SCOPE = 'shopper';

WorldpayConstants.MULTI_MERCHANT_CHANNEL_DESKTOP_NAME = 'Desktop';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_DESKTOP_VALUE = 'MultiMerchantChannelDesktop';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_MOBILE_NAME = 'Mobile';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_MOBILE_VALUE = 'MultiMerchantChannelMobile';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_IPAD_NAME = 'IPad';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_IPAD_VALUE = 'MultiMerchantChannelIPad';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_NAME = 'CSC';
WorldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_VALUE = 'MultiMerchantChannelCSC';
WorldpayConstants.DDC_ALG = 'HS256';

WorldpayConstants.AUTHORIZATION_FAILED = 'authorizationFailed';
WorldpayConstants.AUTHENTICATION_FAILED = 'authenticationFailed';
WorldpayConstants.SECOND_AUTHORIZATION_FAILED = 'secondAuthorizationFailed';
WorldpayConstants.SECOND_AUTHORIZATION_FAILED3DSTWO = 'secondAuthorizationFailed3dsTwo';
WorldpayConstants.UPDATE_TOKEN_FAILED = 'updateTokenFailed';
WorldpayConstants.CONFIRMATION_REQKLARNA_FAILED = 'confirmationReqKlarnaFailed';
WorldpayConstants.INITIATE_CANCEL_ORDER_FAILED = 'initiateCancelOrderFailed';
WorldpayConstants.ORDERINQUIRY_FAILED = 'orderInquiryFailed';
WorldpayConstants.CAPTURE_FAILED = 'captureFailed';
WorldpayConstants.VOIDSALE_FAILED = 'voidsaleFailed';
WorldpayConstants.PARTIAL_CAPTURE_FAILED = 'partialCaptureFailed';
WorldpayConstants.PARTIAL_REFUND_FAILED = 'partialRefundFailed';
WorldpayConstants.ORDER_CANCEL_FAILED = 'orderCancelFailed';
WorldpayConstants.DELETE_TOKEN_FAILED = 'deleteTokenFailed';
WorldpayConstants.DDC_FAILED = 'ddcFailed';
WorldpayConstants.WORLDPAY_MAC_MISSING_VAL = 'worldpayMACMissingVal';
WorldpayConstants.NOMINAL_VALUE_CHECK_FAILED = 'iavFailed';
WorldpayConstants.NOMINAL_VALUE_CARD_FAILERROR = 'nominalValCardFailError';
WorldpayConstants.NOMINAL_VALUE_PAYMENT_ERROR = 'nominalValPaymentError';
WorldpayConstants.REFUSED_STATUS_ORDER = 'refusedOrder';
WorldpayConstants.ORDER_STATUS_PENDINGERROR = 'pendingError';
WorldpayConstants.ORDER_STATUS_PENDINGFAILURE = 'pendingFailed';
WorldpayConstants.ORDER_STATUS_PENDINGEXPIRED = 'pendingExpired';
WorldpayConstants.ORDER_STATUS_CANCELLED = 'orderCancelled';
WorldpayConstants.FRAUD_DETECTION = 'fraudDetection';

WorldpayConstants.PAY_BY_LINK_UNAUTHORISED = 'PAY_BY_LINK_AUTHORIZATION_NOT_ATTEMPTED';

WorldpayConstants.PREFERRED_CARDS_REDIRECT = 'ALL';

module.exports = WorldpayConstants;
