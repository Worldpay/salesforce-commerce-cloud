Feature: Guest Direct Order Placement
    As a guest shopper, I am unable to place an Direct Credit Card Payment Method Order with error magic values
	
@Guest_DirectOrder_Refused
    Scenario: Guest User is  unable to place order with REFUSED magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|REFUSED|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Guest Direct Refused|

@Guest_DirectOrder_Error
    Scenario: Guest User is  unable to place order with ERROR magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|ERROR|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Guest Direct Error|

@Guest_DirectOrder_3D_Visa_Error.
     Scenario: Guest User is  unable to place 3D order when ERROR magic value is opted
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3D|4462030000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Submit Button in 3D page
		|magicValue|
		|3DERROR|
		And Apm verify for error scenerios
        |Guest Direct 3D Error Visa|

@Guest_DirectOrder_3DS2_Visa_Error
    Scenario: Guest User is  unable to place 3DS2 order when ERROR magic value
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V1_CHALLENGE_UNKNOWN_IDENTITY|4917300800000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm verify for error scenerios
        |Guest Direct 3DS2 Error Visa|

@Guest_DirectOrder_3DS2_Frictionless_Master_Error
    Scenario: Guest User is  unable to place 3DS2 frictionless order when ERROR magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V2_FRICTIONLESS_REJECTED|5163613613613613|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Guest Direct 3DS2 Frictionless Error Master|




