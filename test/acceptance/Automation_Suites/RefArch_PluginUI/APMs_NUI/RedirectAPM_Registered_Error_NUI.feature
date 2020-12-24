Feature: NUI Registered Redirect APMs Error - China Union Pay, Giropay, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, IDEAL, PayPal


@Chinaunionpay Refused NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via Chinaunionpay
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|CN|
        And Apm verify for NUI error scenerios
        |ChinaUnionPay Refused. NUI Registered|


@Giropay Refused NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via giropay
       Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for giropay
        |email|phone|bankcode|status|country|
        |code1auto1@yopmail.com|3333333333|98765|REFUSED|DE|
        And Apm verify for NUI error scenerios
        |giropay Refused. NUI Registered|

@Sofort Cancel NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via Sofort
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and country for sofort
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|AT|
        And Apm verify for NUI error scenerios
        |Sofort Cancelled. NUI Registered|

@Boleto Pending Error NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via Boleto
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email, phone number, cpf and status for boleto
        |email|phone|status|country|cpf|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|BR|263.946.533-30|
        And Apm verify for NUI error scenerios
        |Boleto PendingError. NUI Registered|

@CashU Pending Fail NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via CashU
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for cashu
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|AE|
        And Apm verify for NUI error scenerios
        |CashU PendingFailure. NUI Registered|

@Mistercash Pending Expired NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via Mistercash
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for mistercash
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|BE|
        And Apm verify for NUI error scenerios
        |Mistercash PendingExpired. NUI Registered|

@PRZELEWY24 Pending Fail NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via przelewy24
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|PL|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for przelewy24
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|PL|
        And Apm verify for NUI error scenerios
        |przelewy24 PendingFailure. NUI Registered| 

@Poli Pending Error NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via poli
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|NZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for poli
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|NZ|
        And Apm verify for NUI error scenerios
        |poli PendingError. NUI Registered|

@QIWI Cancel NUI
    Scenario: With -ve magic value Registered Shopper is able to place order via qiwi
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|KZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for qiwi
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|KZ|
        And Apm verify for NUI error scenerios
        |qiwi Cancelled. NUI Registered|  

