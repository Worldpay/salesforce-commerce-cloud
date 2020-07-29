Feature: Guest Direct Order Placement
    As a guest shopper, I want to place an order with Direct Credit Card Payment Method

@Guest_DirectOrder_Diners_Auth.
    Scenario: Guest User is able to place order via Diners Card in Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|codeg autog|36700102000000|02|2022|545|
		Then Verify that added card should be Diners Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Guest Direct Diners|
 
@Guest_DirectOrder_3D_Visa_Auth.
    Scenario: Guest User is able to place order via 3D Visa Card in Direct Method
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
		|IDENTIFIED|
		And Apm Print the Order Number
        |Guest Direct 3D Auth. Visa|

@Guest_DirectOrder_3DS2_Visa_Auth.
    Scenario: Guest User is able to place order via 3DS2 Visa Card in Direct Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V1_CHALLENGE_NOT_IDENTIFIED|4917300800000000|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm Print the Order Number
        |Guest Direct 3DS2 Auth. Visa|

@Guest_DirectOrder_3DS2_Frictionless_Master_Auth.
    Scenario: Guest User is able to place order via 3DS@ frictionless master Card in Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V2_FRICTIONLESS_IDENTIFIED|5163613613613613|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Guest Direct 3DS2 Frictionless Auth. Master|



