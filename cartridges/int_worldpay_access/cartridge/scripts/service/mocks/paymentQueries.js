'use strict';


const mockValue = {
    timestamp: '2025-10-22T09:27:55.660Z',
    paymentId: 'pays9flZXEn5oyyed4ImIr200',
    transactionReference: '00000006',
    narrative: {
        line1: 'HPP Test Transaction'
    },
    transactionType: 'oneTime',
    authorizationType: 'authorization',
    lastEvent: 'settlementRequestSubmitted',
    entity: 'default',
    issuer: {
        authorizationCode: '562409'
    },
    scheme: {
        reference: '060720116005062'
    },
    paymentInstrument: {
        type: 'card/plain+masked',
        card: {
            number: {
                last4Digits: '1000',
                cardBin: '4000**'
            },
            brand: 'visa'
        }
    },
    value: {
        currency: 'EUR',
        amount: 12074
    },
    events: [
        {
            eventName: 'settlementRequestSubmitted',
            timestamp: '2025-10-22T09:27:56.209Z',
            commandId: 'cmdgc2CVylySr_84HuJKic310'
        },
        {
            eventName: 'settlementRequested',
            timestamp: '2025-10-22T09:27:56.140Z',
            commandId: 'cmdgc2CVylySr_84HuJKic310',
            type: 'fullSettlement',
            value: {
                currency: 'EUR',
                amount: 12074
            }
        },
        {
            eventName: 'authorizationSucceeded',
            timestamp: '2025-10-22T09:27:56.039Z',
            commandId: 'cmdnTyxGtP0RlVbnNG9U4tTi0',
            outcome: 'authorized'
        },
        {
            eventName: 'authorizationRequested',
            timestamp: '2025-10-22T09:27:55.660Z',
            commandId: 'cmdnTyxGtP0RlVbnNG9U4tTi0'
        }
    ],
    _links: {
        self: {
            href: '/paymentQueries/payments/pays9flZXEn5oyyed4ImIr200'
        },
        'cardPayments:events': {
            href: 'https://try.access.worldpay.com/payments/events/eyJrIjoiazNhYjYzMiIsImxpbmtWZXJzaW9uIjoiNi4wLjAifQ==.sN:g8wd64bwkbrp0md+bPxcanBnk2zLdsIqSa1pR99HatXuGLSimOE1OAmHOTLsBQRCGipuwm1Z5U6RxWsL2AChMHeJVoeH2lrBWCRyjZYTushccw5rJWHh3SQ5jK0LLDUODORCvtaLcAEJOxqAtbbEXu+cjXMd:6WJBmO81FmlAbq75P+7ex8e:d7NI4nGKsZ3GKWWQ1V:TCVlI:ZVDkvcIrSucWd1wzSzC9kyqBDBISPm0GzJ1:MzhcpfbQ7o2Z73qFr23CrFNJAh+vWu2X1Xert:DfDk71RlPi9CL0EzIJxoeRZIP9FsJYJyaJCpr7OgsNMwy5Tz+chDxYJsUx3NTFN5uDidAx79p+64ZWcw='
        },
        'cardPayments:refund': {
            href: 'https://try.access.worldpay.com/payments/settlements/refunds/full/eyJrIjoiazNhYjYzMiIsImxpbmtWZXJzaW9uIjoiNi4wLjAifQ==.sN:g8wd64bwkbrp0md+bPxcanBnk2zLdsIqSa1pR99HatXuGLSimOE1OAmHOTLsBQRCGipuwm1Z5U6RxWsL2AChMHeJVoeH2lrBWCRyjZYTushccw5rJWHh3SQ5jK0LLDUODORCvtaLcAEJOxqAtbbEXu+cjXMd:6WJBmO81FmlAbq75P+7ex8e:d7NI4nGKsZ3GKWWQ1V:TCVlI:ZVDkvcIrSucWd1wzSzC9kyqBDBISPm0GzJ1:MzhcpfbQ7o2Z73qFr23CrFNJAh+vWu2X1Xert:DfDk71RlPi9CL0EzIJxoeRZIP9FsJYJyaJCpr7OgsNMwy5Tz+chDxYJsUx3NTFN5uDidAx79p+64ZWcw='
        },
        'cardPayments:reverse': {
            href: 'https://try.access.worldpay.com/payments/authorizations/reversals/eyJrIjoiazNhYjYzMiIsImxpbmtWZXJzaW9uIjoiNi4wLjAifQ==.sN:g8wd64bwkbrp0md+bPxcanBnk2zLdsIqSa1pR99HatXuGLSimOE1OAmHOTLsBQRCGipuwm1Z5U6RxWsL2AChMHeJVoeH2lrBWCRyjZYTushccw5rJWHh3SQ5jK0LLDUODORCvtaLcAEJOxqAtbbEXu+cjXMd:6WJBmO81FmlAbq75P+7ex8e:d7NI4nGKsZ3GKWWQ1V:TCVlI:ZVDkvcIrSucWd1wzSzC9kyqBDBISPm0GzJ1:MzhcpfbQ7o2Z73qFr23CrFNJAh+vWu2X1Xert:DfDk71RlPi9CL0EzIJxoeRZIP9FsJYJyaJCpr7OgsNMwy5Tz+chDxYJsUx3NTFN5uDidAx79p+64ZWcw='
        },
        'cardPayments:partialRefund': {
            href: 'https://try.access.worldpay.com/payments/settlements/refunds/partials/eyJrIjoiazNhYjYzMiIsImxpbmtWZXJzaW9uIjoiNi4wLjAifQ==.sN:g8wd64bwkbrp0md+bPxcanBnk2zLdsIqSa1pR99HatXuGLSimOE1OAmHOTLsBQRCGipuwm1Z5U6RxWsL2AChMHeJVoeH2lrBWCRyjZYTushccw5rJWHh3SQ5jK0LLDUODORCvtaLcAEJOxqAtbbEXu+cjXMd:6WJBmO81FmlAbq75P+7ex8e:d7NI4nGKsZ3GKWWQ1V:TCVlI:ZVDkvcIrSucWd1wzSzC9kyqBDBISPm0GzJ1:MzhcpfbQ7o2Z73qFr23CrFNJAh+vWu2X1Xert:DfDk71RlPi9CL0EzIJxoeRZIP9FsJYJyaJCpr7OgsNMwy5Tz+chDxYJsUx3NTFN5uDidAx79p+64ZWcw='
        }
    }
};

module.exports = {
    mockValue
};
