Feature: Guest checkout | APMs - Paypal, Klarna Pay Now, Klarna Pay Later, Klarna Slice It

@Paypal
    Scenario: Guest Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then Shopper submits email "codeceptguest@yopmail.com" on customer section
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills phone number and country for paypal
        |phone|country|response|
        |3333333333|US|Auth|
        And log the order number
  


@Klarna Pay Now Auth.
    Scenario: Guest Shopper is able to place order via klarnapaynow
       When Apm shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then Shopper submits email "codeceptguest@yopmail.com" on customer section
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills phone number and status for klarna Pay Now
        |phone|status|country|
        |3333333333|AUTHORISED|US|
        And log the order number
     


@Klarna Pay Later Auth.
    Scenario: Guest Shopper is able to place order via klarnapaylater
		Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then Shopper submits email "codeceptguest@yopmail.com" on customer section
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills phone number and status for klarna Pay Later
        |phone|status|country|
        |3333333333|PENDING|US|
        And log the order number
     


@Klarna Slice IT Auth.
    Scenario: Guest Shopper is able to place order via klarnasliceit
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then Shopper submits email "codeceptguest@yopmail.com" on customer section
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills phone number and status for klarna Slice It
        |phone|status|country|
        |3333333333|AUTHORISED|US|
        And log the order number
         

