Feature: Registered Redirect APMs Error - China Union Pay, Giropay, Klarna Pay now, Pay later & SliceIt, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, IDEAL, PayPal


@Chinaunionpay Refused
    Scenario: With -ve magic value Registered Shopper is unable to place order via Chinaunionpay
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
        And Apm Shopper fills email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|CN|
        And Apm verify for error scenerios
        |ChinaUnionPay Refused. Registered|


@Giropay Refused
    Scenario: With -ve magic value Registered Shopper is unable to place order via giropay
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
        And Apm Shopper fills email and phone number and status for giropay
        |email|phone|bankcode|status|country|
        |code1auto1@yopmail.com|3333333333|98765|REFUSED|DE|
        And Apm verify for error scenerios
        |giropay Refused. Registered|

@Klarna Pay Now Error
    Scenario: With -ve magic value Registered Shopper is unable to place order via klarnapaynow
       When Apm shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Now
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|ERROR|US|
        And Apm verify for error scenerios
        |klarnapaynow Error. Registered|  


@Sofort Cancel
    Scenario: With -ve magic value Registered Shopper is unable to place order via Sofort
        Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for sofort
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|AT|
        And Apm verify for error scenerios
        |Sofort Cancelled. Registered|

@Boleto Pending Error
    Scenario: With -ve magic value Registered Shopper is unable to place order via Boleto
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
        And Apm Shopper fills email, phone number, cpf and status for boleto
        |email|phone|status|country|cpf|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|BR|263.946.533-30|
        And Apm verify for error scenerios
        |Boleto PendingError.Registered|

@CashU Pending Fail
    Scenario: With -ve magic value Registered Shopper is unable to place order via CashU
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
        And Apm Shopper fills email and phone number and status for cashu
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|AE|
        And Apm verify for error scenerios
        |CashU PendingFailure. Registered|

@Klarna Pay Later Cancel
    Scenario: With -ve magic value Registered Shopper is unable to place order via klarnapaylater
        When Apm shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Later
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCEL|US|
        And Apm verify for error scenerios
        |klarnapaylater Cancel. Registered| 

@Mistercash Pending Expired
    Scenario: With -ve magic value Registered Shopper is unable to place order via Mistercash
         Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for mistercash
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|BE|
        And Apm verify for error scenerios
        |Mistercash PendingExpired. Registered|

@PRZELEWY24 Pending Fail
    Scenario: With -ve magic value Registered Shopper is unable to place order via przelewy24
         Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|PL|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for przelewy24
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|PL|
        And Apm verify for error scenerios
        |przelewy24 PendingFailure. Registered| 

@Poli Pending Error
    Scenario: With -ve magic value Registered Shopper is unable to place order via poli
         Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|NZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for poli
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|NZ|
        And Apm verify for error scenerios
        |poli PendingError.Registered| 

@QIWI Cancel
    Scenario: With -ve magic value Registered Shopper is unable to place order via qiwi
         Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|KZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for qiwi
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|KZ|
        And Apm verify for error scenerios
        |qiwi Cancelled. Registered|  

@Klarna Slice IT Refused
    Scenario: With -ve magic value Registered Shopper is unable to place order via klarnasliceit
        When Apm shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Slice It
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|US|
        And Apm verify for error scenerios
        |klarnasliceit Refused. Registered| 

@Ideal
    Scenario: With -ve magic value Registered Shopper is unable to place order via Ideal
        When Apm shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for Ideal Refuse Scenario
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|BE|
        And Apm verify for error scenerios
        |Ideal Refused. Registered|

@Paypal
    Scenario: With -ve magic value Registered Shopper is unable to place order via Paypal
        When Apm shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|response|
        |code1auto1@yopmail.com|3333333333|US|Cancel|
        And Apm verify for error scenerios
        |Paypal Cancel. Registered|