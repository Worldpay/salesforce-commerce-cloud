Feature: Dynamic Narratives

@Dynamic Narratives - CC, HPP and GooglePay
    Scenario: Guest Flow: Verify that dynamic narrative option is not present for CC, HPP and GooglePay payment methods.
	 	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|SG|AL|El Paso|12345|3333333333|
		Then user selects HPP and make sure no narrative option is present
		Then user selects GooglePay and make sure no narrative option is present
		Then user selects CreditCard and make sure no narrative option is present

@Dynamic Narratives - Ideal
    Scenario: Guest Shopper is able to place order via Ideal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email, phone number, country & narratrive for Ideal 
        |email|phone|country|narrative|
        |code1auto1@yopmail.com|3333333333|BE|Birthday Gift!|
        And Apm Print the Order Number
        |Ideal Guest Authorise with Narrative|

@Dynamic Narratives - Paypal
    Scenario: Guest Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|CN|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email, phone number, country & narratrive for paypal
        |email|phone|country|narrative|
        |code1auto1@yopmail.com|3333333333|US|For House-Warming.|
        And Apm Print the Order Number
        |Paypal Guest Auth with Narrative|
		


