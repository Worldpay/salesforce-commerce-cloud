Feature: Guest Checkout | Credit Card Direct

 #NORMAL FLOW

@Guest_DirectOrder_AUTHORISED_AIRPLUS_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with AUTHORISED magic value and Airplus card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|AUTHORISED|122000000000003|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit Airplus" on the Order Confirmation page
		And log the order number
		
		 
#3d FLOW

@Guest_DirectOrder_3D_Authenticated_MASTERDebit_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3D magic value Authenticated and Master Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Canada" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3D|5163613613613613|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper Click on Submit Button in 3D page
		|magicValue|
		|IDENTIFIED|
		And Shopper confirms the payment method is "Credit MasterCard" on the Order Confirmation page
		And log the order number
		

@Guest_DirectOrder_3D_AuthenticationOfferedButNotUsed_JCB_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3D magic value AuthenticationOfferedButNotUsed and JCB card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Canada" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3D|3528000700000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper Click on Submit Button in 3D page
		|magicValue|
		|NOT_IDENTIFIED|
		And Shopper confirms the payment method is "Credit JCB" on the Order Confirmation page
		And log the order number
		

@Guest_DirectOrder_3D_IdentifiedNoXIDReceived_VISAElectron_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3D magic value IdentifiedNoXIDReceived and VISA Electron card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3D|4917300800000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper Click on Submit Button in 3D page
		|magicValue|
		|IDENTIFIED_NOID|
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page
		And log the order number
		

@Guest_DirectOrder_3D_NotIdentifiedNoXIDReceived_AMEX_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3D magic value NotIdentifiedNoXIDReceived and Amex card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3D|343434343434343|01|2024|0124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper Click on Submit Button in 3D page
		|magicValue|
		|NOT_IDENTIFIED_NOID|
		And Shopper confirms the payment method is "Credit Amex" on the Order Confirmation page
		And log the order number
		

@Guest_DirectOrder_3D_ErrorCodeIsValid_VISA_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3D magic value ErrorCodeIsValid and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Germany" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Germany" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3D|4444333322221111|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper Click on Submit Button in 3D page
		|magicValue|
		|3DS_VALID_ERROR|
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page
		And log the order number
		

#3DS CHALLENGE FLOW

@Guest_DirectOrder_3DS1_3DS_V1_CHALLENGE_IDENTIFIED_VISA_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_IDENTIFIED and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V1_CHALLENGE_IDENTIFIED|4444333322221111|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS2_3DS_V2_CHALLENGE_IDENTIFIED_MASTER_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS2 magic value 3DS_V2_CHALLENGE_IDENTIFIED and Master card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V2_CHALLENGE_IDENTIFIED|5454545454545454|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit MasterCard" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS1_3DS_V1_CHALLENGE_NOT_IDENTIFIED_VISAPurchaing_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_NOT_IDENTIFIED and Visa Purchasing card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V1_CHALLENGE_NOT_IDENTIFIED|4484070000000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS1_3DS_V1_CHALLENGE_VALID_ERROR_MASTER_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS1 magic value 3DS_V1_CHALLENGE_VALID_ERROR and Master card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V1_CHALLENGE_VALID_ERROR|5555555555554444|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit MasterCard" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS2_3DS_V2_CHALLENGE_VALID_ERROR_JCB_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS2 magic value 3DS_V2_CHALLENGE_VALID_ERROR and JCB card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "Denmark" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Denmark" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V2_CHALLENGE_VALID_ERROR|3528000700000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit JCB" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS_3DS_BYPASSED_AFTER_CHALLENGE_VISAPurchasing_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS magic value 3DS_BYPASSED_AFTER_CHALLENGE and Visa Purchasing Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_BYPASSED_AFTER_CHALLENGE|4484070000000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
		


#3DS FRICTIONLESS FLOW

@Guest_DirectOrder_3DS2_3DS_V2_FRICTIONLESS_IDENTIFIED_AMEX_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_IDENTIFIED and Amex card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V2_FRICTIONLESS_IDENTIFIED|343434343434343|01|2024|0124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit Amex" on the Order Confirmation page  
		And log the order number
	

@Guest_DirectOrder_3DS1_3DS_V1_NOT_ENROLLED_VISA_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS1 magic value 3DS_V1_NOT_ENROLLED and Visa card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V1_NOT_ENROLLED|4911830000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS1_3DS_V1_UNKNOWN_ENROLMENT_JCB_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS1 magic value 3DS_V1_UNKNOWN_ENROLMENT and JCB card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "France" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "France" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V1_UNKNOWN_ENROLMENT|3528000700000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit JCB" on the Order Confirmation page  
		And log the order number
		

@Guest_DirectOrder_3DS2_3DS_V2_FRICTIONLESS_NOT_IDENTIFIED_VisaElectron_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_NOT_IDENTIFIED and Visa Electron card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V2_FRICTIONLESS_NOT_IDENTIFIED|4917300800000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
	

@Guest_DirectOrder_3DS2_3DS_V2_FRICTIONLESS_VALID_ERROR_MASTERDebit_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS2 magic value 3DS_V2_FRICTIONLESS_VALID_ERROR and Master Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_V2_FRICTIONLESS_VALID_ERROR|5163613613613613|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit MasterCard" on the Order Confirmation page  
		And log the order number
	

@Guest_DirectOrder_3DS_3DS_BYPASSED_VISADebit_Auth.
    Scenario: Verify that the guest user is able to do Direct Checkout sucessfully with 3DS magic value 3DS_BYPASSED and Visa Debit card
	 	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper submits email "codeceptguest@yopmail.com" on customer section
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills phone number on payment section
			|phoneno|
			|8765342190|
		And Shopper adds payment details on direct card payment form
			|Name on Card|Card Number|ExpiryMonth|ExpryYear|CVV|
			|3DS_BYPASSED|4462030000000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And Shopper confirms the payment method is "Credit Visa" on the Order Confirmation page  
		And log the order number
		



