Feature: Guest Checkout | Credit Card Re-Direct - HPP

 #NORMAL FLOW

@Guest_HPPOrder_AUTHORISED_MAESTRO_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with AUTHORISED magic value and Maestro card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Maestro|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|6759649826438453|Authorised|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
		

				 
#3d FLOW

@Guest_HPPOrder_3D_IDENTIFIED_MASTERDebit_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3D magic value IDENTIFIED and Master Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Canada" billing address
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Master Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5163613613613613|3D|02|24|224|
		And Shopper clicks on Submit Button on HPP
		Then Shopper selects 3d magic value "IDENTIFIED" and Submits on HPP 3D page
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
		

@Guest_HPPOrder_3D_NOT_IDENTIFIED_JCB_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3D magic value NOT_IDENTIFIED and JCB card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Canada" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|JCB|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|3528000700000000|3D|02|24|224|
		And Shopper clicks on Submit Button on HPP
		Then Shopper selects 3d magic value "NOT_IDENTIFIED" and Submits on HPP 3D page
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
		

@Guest_HPPOrder_3D_IDENTIFIED_NOID_VISAElectron_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3D magic value IDENTIFIED_NOID and VISA Electron card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Visa Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4917300800000000|3D|02|24|224|
		And Shopper clicks on Submit Button on HPP
		Then Shopper selects 3d magic value "IDENTIFIED_NOID" and Submits on HPP 3D page
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
	

@Guest_HPPOrder_3D_NOT_IDENTIFIED_NOID_AMEX_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3D magic value NOT_IDENTIFIED_NOID and Amex card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|American Express|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|343434343434343|3D|02|24|0224|
		And Shopper clicks on Submit Button on HPP
		Then Shopper selects 3d magic value "NOT_IDENTIFIED_NOID" and Submits on HPP 3D page
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
		

@Guest_HPPOrder_3D_3DS_VALID_ERROR_VISA_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3D magic value 3DS_VALID_ERROR and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Germany" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Germany" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4444333322221111|3D|02|24|224|
		And Shopper clicks on Submit Button on HPP
		Then Shopper selects 3d magic value "3DS_VALID_ERROR" and Submits on HPP 3D page
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page
		And log the order number
		


#3DS CHALLENGE FLOW

@Guest_HPPOrder_3DS1_3DS_V1_CHALLENGE_IDENTIFIED_VISA_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_IDENTIFIED and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4444333322221111|3DS_V1_CHALLENGE_IDENTIFIED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS2_3DS_V2_CHALLENGE_IDENTIFIED_MASTER_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS2 magic value 3DS_V2_CHALLENGE_IDENTIFIED and Master card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Master Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5454545454545454|3DS_V2_CHALLENGE_IDENTIFIED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS1_3DS_V1_CHALLENGE_NOT_IDENTIFIED_VISAPurchaing_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_NOT_IDENTIFIED and Visa Purchasing card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4484070000000000|3DS_V1_CHALLENGE_NOT_IDENTIFIED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS1_3DS_V1_CHALLENGE_VALID_ERROR_MASTER_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_VALID_ERROR and Master card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Master Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5555555555554444|3DS_V1_CHALLENGE_VALID_ERROR|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS2_3DS_V2_CHALLENGE_VALID_ERROR_AMEX_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS2 magic value 3DS_V2_CHALLENGE_VALID_ERROR and Amex card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP	
		|Preferred Card|
		|American Express|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|343434343434343|3DS_V2_CHALLENGE_VALID_ERROR|02|24|0224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS_3DS_BYPASSED_AFTER_CHALLENGE_VISAPurchasing_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS magic value 3DS_BYPASSED_AFTER_CHALLENGE and Visa Purchasing Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Visa Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4484070000000000|3DS_BYPASSED_AFTER_CHALLENGE|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper clicks on Ok button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

#3DS FRICTIONLESS FLOW

@Guest_HPPOrder_3DS2_3DS_V2_FRICTIONLESS_IDENTIFIED_AMEX_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_IDENTIFIED and Amex card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Amex Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|343434343434343|3DS_V2_FRICTIONLESS_IDENTIFIED|02|24|0224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS1_3DS_V1_NOT_ENROLLED_VISA_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS1 magic value 3DS_V1_NOT_ENROLLED and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Brazil" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Brazil" billing address
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4911830000000|3DS_V1_NOT_ENROLLED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS1_3DS_V1_UNKNOWN_ENROLMENT_JCB_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS1 magic value 3DS_V1_UNKNOWN_ENROLMENT and JCB card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "France" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "France" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|JCB|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|3528000700000000|3DS_V1_UNKNOWN_ENROLMENT|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS2_3DS_V2_FRICTIONLESS_NOT_IDENTIFIED_VisaElectron_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_NOT_IDENTIFIED and Visa Electron card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4917300800000000|3DS_V2_FRICTIONLESS_NOT_IDENTIFIED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS2_3DS_V2_FRICTIONLESS_VALID_ERROR_MASTERDebit_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_VALID_ERROR and Master Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|ALL|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper selects Master Card on HPP
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5163613613613613|3DS_V2_FRICTIONLESS_VALID_ERROR|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		

@Guest_HPPOrder_3DS_3DS_BYPASSED_VISADebit_Auth.
    Scenario: Verify that the guest user is able to do HPP Checkout sucessfully with 3DS magic value 3DS_BYPASSED and Visa Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper selects CreditCard Re-Direct
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper selects preferred card for HPP
		|Preferred Card|
		|Visa|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper adds payment details on HPP card payment form
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4462030000000000|3DS_BYPASSED|02|24|224|
		And Shopper clicks on Submit Button on HPP
		And Shopper confirms the payment method is "Payment By Credit Card - Redirect" on the Order Confirmation page  
		And log the order number
		