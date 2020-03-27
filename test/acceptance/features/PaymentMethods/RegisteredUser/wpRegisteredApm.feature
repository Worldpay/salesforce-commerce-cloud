Feature: Add Product To Cart
    As a shopper, I want to search for a product and add it to cart


@Paypal
    Scenario: Registered Shopper is able to place order via Paypal
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
         And Apm selects color
        When Apm he adds the product to cart
        And Apm Shopper fills email and password 
        |email|password|
        |admin@gmail.com|Abcd@1234|
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|CN|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|
        |admin@gmail.com|3333333333|US|
        And Apm Print the Order Number
@Ideal
    Scenario: Registered Shopper is able to place order via Ideal
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
        And Apm Shopper fills email and password 
        |email|password|
        |admin@gmail.com|Abcd@1234|
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for Ideal 
        |email|phone|country|
        |admin@gmail.com|3333333333|BE|
        And Apm Print the Order Number
@Sofort
    Scenario: Registered Shopper is able to place order via Sofort
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
        And Apm Shopper fills email and password 
        |email|password|
        |admin@gmail.com|Abcd@1234|
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for sofort
        |email|phone|country|
        |admin@gmail.com|3333333333|BE|
        And Apm Print the Order Number
@Wechatpay
    Scenario: Registered Shopper is able to place order via Wechatpay
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
        And Apm Shopper fills email and password 
        |email|password|
        |admin@gmail.com|Abcd@1234|
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number for wechatpay
        |email|phone|
        |admin@gmail.com|3333333333|
        And Apm Print the Order Number
@Alipay
    Scenario: Registered Shopper is able to place order via Alipay
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
        And Apm Shopper fills email and password 
        |email|password|
        |admin@gmail.com|Abcd@1234|
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for alipay
        |email|phone|status|country|
        |admin@gmail.com|3333333333|PENDINGOPEN|CN|
        And Apm Print the Order Number
        
@GooglePay
 Scenario: Registered User is able to place order using Google pay payment method.
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|giftgiftgift999@gmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
		Then Verify that user has navigated to Shipping Page
        	Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65|
		
		Then User selects googlepay as payment method
		Then User fills Email and Phone number for googlepay
			|Email|Phonenumber|
			|giftgiftgift999@gmail.com|3333333333|
		Then User clicks on Buy with GPay
		Then User enters respective google emailid
		|gId|gPwd|
		|enishikant1@gmail.com|Sap@12345|
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
   
        
        
        
      
        
      