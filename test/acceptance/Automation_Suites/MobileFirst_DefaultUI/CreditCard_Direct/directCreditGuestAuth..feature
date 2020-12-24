Feature: Guest Direct Order +ve flows
    As a guest shopper, I want to place an order with Direct Credit Card Payment Method

@Guest_DirectOrder_Normal_Diners_Auth.
    Scenario: Guest User is able to place order via Normal Diners Card in Direct Method
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
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Guest Direct Normal Diners Auth.|
 
@Guest_DirectOrder_3D_VisaDebit_Auth.
    Scenario: Guest User is able to place order via 3D Visa Debit Card in Direct Method
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
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Submit Button in 3D page
		|magicValue|
		|IDENTIFIED|
		And Apm Print the Order Number
        |Guest Direct 3D VisaDebit Auth.|

@Guest_DirectOrder_3DS1_VisaElectron_Auth.
    Scenario: Guest User is able to place order via 3DS1 Visa Electron Card in Direct Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V1_CHALLENGE_NOT_IDENTIFIED|4917300800000000|02|2022|545|
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm Print the Order Number
        |Guest Direct 3DS1 VisaElectron Auth.|

@Guest_DirectOrder_3DS2_Frictionless_Master_Auth.
    Scenario: Guest User is able to place order via 3DS2 frictionless master Card in Direct Method
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|SG|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|3DS_V2_FRICTIONLESS_IDENTIFIED|5454545454545454|02|2022|545|
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Guest Direct 3DS2 Frictionless Master Auth.|



