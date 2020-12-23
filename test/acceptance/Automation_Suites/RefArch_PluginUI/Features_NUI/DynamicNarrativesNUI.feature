Feature: NUI Dynamic Narratives

@Dynamic Narratives NUI - CC, HPP and GooglePay
    Scenario: Guest Flow: Verify that dynamic narrative option is not present for CC, HPP and GooglePay payment methods.
	 	Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|SG|AL|El Paso|12345|3333333333|
		Then user selects HPP on new ui and make sure no narrative option is present
		Then user selects GooglePay on new ui and make sure no narrative option is present
		Then user selects CreditCard on new ui and make sure no narrative option is present

@Dynamic Narratives NUI - Ideal
    Scenario: Guest Shopper is able to place order via Ideal
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and country for Ideal 
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|BE|
        And Apm Print the Order Number
        |NUI Ideal Guest Authorise without Narrative|

@Dynamic Narratives NUI - Paypal
    Scenario: Guest Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills on new ui email, phone number, country & narratrive for paypal
        |email|phone|country|narrative|
        |code1auto1@yopmail.com|3333333333|GB|For House-Warming.|
        And Apm Print the Order Number
        |NUI Paypal Guest Auth with Narrative|
		


