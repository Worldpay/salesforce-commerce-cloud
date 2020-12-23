Feature: Extended Response Codes
	
@REFUSED55 Guest
    Scenario: During Direct Card Guest Checkout with magic value REFUSED55, cofigured extended response code message is shown. 
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|REFUSED55|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then validate error message
		And Apm verify for error scenerios
        |Guest Direct Refused|

@REFUSED55 Registered
    Scenario: During Direct Card Registered Checkout with magic value REFUSED55, cofigured extended response code message is shown. 
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
			|codegautog@yopmail.com|3333333333|REFUSED55|4484070000000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then validate error message
		And Apm verify for error scenerios
        |Registered Direct Refused|
		Then Go to MyAccount Page
		And Verify no Payment Saved