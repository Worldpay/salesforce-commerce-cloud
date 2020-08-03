Feature: Registered Direct Order Placement
    As a registered shopper, I am unable to place an Direct Credit Card Payment Method Order with error magic values
	
@Registered_DirectOrder_Refused
    Scenario: Registered User is  unable to place order with REFUSED magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then User add a new card details with save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|REFUSED|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Registered Direct Refused|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_Error
    Scenario: Registered User is  unable to place order with ERROR magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then User add a new card details with save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|ERROR|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Registered Direct Error|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_3D_Visa_Error.
     Scenario: Registered User is  unable to place 3D order when ERROR magic value is opted
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then User add a new card details with save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3D|4462030000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Submit Button in 3D page
		|magicValue|
		|3DERROR|
		And Apm verify for error scenerios
        |Registered Direct 3D Error Visa|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_3DS2_Visa_Error
    Scenario: Registered User is  unable to place 3DS2 order when ERROR magic value
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then User add a new card details with save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V1_CHALLENGE_UNKNOWN_IDENTITY|4917300800000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm verify for error scenerios
        |Registered Direct 3DS2 Error Visa|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_3DS2_Frictionless_Master_Error
    Scenario: Registered User is  unable to place 3DS2 frictionless order when ERROR magic value
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then User add a new card details with save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V2_FRICTIONLESS_REJECTED|5163613613613613|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm verify for error scenerios
        |Registered Direct 3DS2 Frictionless Error Master|
		Then Go to MyAccount Page
		And Verify no Payment Saved




