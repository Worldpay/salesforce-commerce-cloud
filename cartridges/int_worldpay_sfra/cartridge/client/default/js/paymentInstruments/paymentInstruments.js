'use strict';
module.exports = function () {
	/*
	*card type and security code handling where process differnt card types.
	*/
    $('body').on('focusout', 'form.payment-form #cardNumber', function (evt) {// eslint-disable-line
		if (undefined !== $('input#cardNumber').data('cleave')) {// eslint-disable-line
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
        unknown: 'Unknown'
    };

			var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf($('input#cardNumber').data('cleave').properties.creditCardType) > -1 // eslint-disable-line
					?
					$('input#cardNumber').data('cleave').properties.creditCardType // eslint-disable-line
					:
					'unknown'];
			$('#cardType').val(cardType); // eslint-disable-line
			$('.card-number-wrapper').attr('data-type', cardType); // eslint-disable-line
}
        var cType = $('.card-number-wrapper')[0].dataset.type;// eslint-disable-line
        if (cType === 'visa' || cType === 'mastercard' || cType === 'discover' || cType === 'maestro' || cType === 'laser' || cType === 'uatp' || cType === 'diners' || cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);// eslint-disable-line
        } else {
            $('#securityCode').attr('maxlength', 4);// eslint-disable-line
        }
        return true;
    });
};
