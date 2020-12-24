Feature: Issuer Insights

@Issuer Insights01 - Guest Diners
    Scenario: Guest User placing a Direct Credit Card (Diners) order with Issuer Insights01 Magic Value.
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|SG|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|Issuer Insights01|36700102000000|03|2023|545|
		Then Verify that added card should be Diners Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Issuer Insights01 - Guest Direct Diners|
 
@Issuer Insights03 - Guest Visa
    Scenario: Guest User placing a Direct Credit Card (Visa) order with Issuer Insights03 Magic Value.
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
		Then Guest User add a new card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|codegautog@yopmail.com|3333333333|Issuer Insights03|4462030000000000|02|2023|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Apm Print the Order Number
        |Issuer Insights03 - Guest Direct Visa|

@Issuer Insights06 - Saved Card Master
    Scenario: Registered User placing a saved Credit Card (Master) direct order with Issuer Insights06 Magic Value.
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
		Then Shopper Click on Add New Payment
		And User add a new card details in Account
		|Name on Card |Card Number |Expiration Month|Expiration Year|
		|Issuer Insights06|5454545454545454|01|2023|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And User fills email, phone number & cvv
			|emailID|PhoneNo|cvv|
			|code1auto1@yopmail.com|(33) 1 43 12 48 65|545|
		Then User Click on Next Place Order Button
		Then User Click on Place Order
		And Apm Print the Order Number
        |Issuer Insights06 - Saved Card Master|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 



