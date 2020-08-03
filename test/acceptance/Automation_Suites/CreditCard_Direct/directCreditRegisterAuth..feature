Feature: Registered Direct Order Placement
    As a registered shopper, I want to place an order with Direct Credit Card Payment Method

@Registered_DirectOrder_Diners_Auth.
    Scenario: Registered User is able to place order via Diners Card in Direct Method
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
		Then User add a new card details by unchecking save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|codeg autog|36700102000000|02|2022|545|
		Then Verify that added card should be Diners Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Registered Direct Auth. Diners|
		Then Go to MyAccount Page
		And Verify no Payment Saved
 
@Registered_DirectOrder_3D_Visa_Auth.
    Scenario: Registered User is able to place order via 3D Visa Card in Direct Method
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
		Then User add a new card details by unchecking save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3D|4462030000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Submit Button in 3D page
		|magicValue|
		|IDENTIFIED|
		And Apm Print the Order Number
        |Registered Direct 3D Auth. Visa|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_3DS2_Visa_Auth.
    Scenario: Registered User is able to place order via 3DS2 Visa Card in Direct Method
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
		Then User add a new card details with no save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V1_CHALLENGE_NOT_IDENTIFIED|4917300800000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm Print the Order Number
        |Registered Direct 3DS2 Auth. Visa|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_DirectOrder_3DS2_Frictionless_Master_Auth.
    Scenario: Registered User is able to place order via 3DS@ frictionless master Card in Direct Method
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
		Then User add a new card details with no save option
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V2_FRICTIONLESS_IDENTIFIED|5163613613613613|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Registered Direct 3DS2 Frictionless Auth. Master|
		Then Go to MyAccount Page
		And Verify no Payment Saved



