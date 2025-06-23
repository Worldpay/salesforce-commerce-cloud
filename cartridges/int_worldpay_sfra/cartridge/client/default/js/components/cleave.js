var base = require('base/components/cleave');

var Cleave = require('cleave.js').default;

// Handle all WP supported Card Brands
base.handleCreditCardNumber = function (cardFieldSelector, cardTypeSelector) {
    var cleave = new Cleave(cardFieldSelector, {
        creditCard: true,
        onCreditCardTypeChanged: function (type) {
            var creditCardTypes = {
                visa: 'Visa',
                mastercard: 'MasterCard',
                amex: 'Amex',
                discover: 'Discover',
                uatp: 'Airplus',
                diners: 'DinersClub',
                dankort: 'Dankort',
                instapayment: 'Instapayment',
                jcb: 'JCB',
                maestro: 'Maestro',
                laser: 'Laser',
                general: 'General',
                unionPay: 'UnionPay',
                mir: 'Mir',
                generalStrict: 'GeneralStrict',
                cb: 'CB',
                unknown: 'Unknown'
            };

            var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf(type) > -1 ? type : 'unknown'];
            $(cardTypeSelector).val(cardType);
            $('.card-number-wrapper').attr('data-type', type);
            if (type === 'visa' || type === 'mastercard' || type === 'discover') {
                $('#securityCode').attr('maxlength', 3);
            } else {
                $('#securityCode').attr('maxlength', 4);
            }
        }
    });

    $(cardFieldSelector).data('cleave', cleave);
};

module.exports = base;
