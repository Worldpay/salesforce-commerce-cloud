Feature: Guest Re-Direct Order -ve flows
    As a guest shopper, I am unable to place an order with Re-Direct Credit Card Payment Method refused magic value

@Guest_ReDirectOrder_Normal_JCB_Error.
    Scenario: Guest User is able to place order via normal JCB Card in Re-Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And Shopper fills email, phone number & preferred card for HPP
		|Email|Phone Number|Preferred Card|
		|code1auto1@yopmail.com|8765432109|ALL|
		Then Shopper selects Master Card on HPP
		And Shopper fills the credit card details for HPP
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|3528000700000000|REFUSED|02|22|545|
		And Apm verify for error scenerios
        |Guest HPP Normal JCB Refused.|

@Guest_ReDirectOrder_Normal__Master_Error.
    Scenario: Guest User is able to place order via normal JCB Card in Re-Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And Shopper fills email, phone number & preferred card for HPP
		|Email|Phone Number|Preferred Card|
		|code1auto1@yopmail.com|8765432109|ALL|
		Then Shopper selects Master Card on HPP
		And Shopper fills the credit card details for HPP
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5454545454545454|ERROR|02|22|545|
		And Apm verify for error scenerios
        |Guest HPP Normal Master Error.|

@Guest_ReDirectOrder_3D_Amex_Error.
    Scenario: Guest User is able to place order via 3D Amex Card in re-Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And Shopper fills email, phone number & preferred card for HPP
		|Email|Phone Number|Preferred Card|
		|code1auto1@yopmail.com|8765432109|ALL|
		Then Shopper selects Master Card on HPP
		And Shopper fills the credit card details for HPP
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|343434343434343|3D|02|22|5452|
		Then Shopper selects 3d magic value "3DERROR" and Submits on HPP 3D page
		And Apm verify for error scenerios
        |Guest HPP 3D Amex Error.|

@Guest_ReDirectOrder_3DS1_Master_Error.
    Scenario: Guest User is able to place order via 3DS! Master Card in Re-Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And Shopper fills email, phone number & preferred card for HPP
		|Email|Phone Number|Preferred Card|
		|code1auto1@yopmail.com|8765432109|ALL|
		Then Shopper selects Master Card on HPP
		And Shopper fills the credit card details for HPP
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|5454545454545454|3DS_V2_CHALLENGE_UNKNOWN_IDENTITY|02|22|545|
		Then Shopper clicks ok button on HPP 3DS page
		And Apm verify for error scenerios
        |Guest HPP 3DS1 Master Error.|

@Guest_ReDirectOrder_3DS2_Frictionless_VisaPurchase_Error.
    Scenario: Guest User is able to place order via Diners Card in Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And Shopper fills email, phone number & preferred card for HPP
		|Email|Phone Number|Preferred Card|
		|code1auto1@yopmail.com|8765432109|ALL|
		Then Shopper selects Master Card on HPP
		And Shopper fills the credit card details for HPP
		|Card Number|Card Name|Expiration Month|Expiration Year|Security Code|
		|4484070000000000|3DS_V2_FRICTIONLESS_REJECTED|02|22|545|
		And Apm verify for error scenerios
        |Guest HPP 3DS2 Frictionless Visa Purchase Error.|