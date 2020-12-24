Feature: NUI Registered Redirect APMs Auth. NUI - China Union Pay, Giropay, AliPay, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, Yandex, IDEAL, PayPal

@Chinaunionpay Auth. NUI
    Scenario: Registered Shopper is able to place order via Chinaunionpay
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|CN|
        And Apm Print the Order Number
        |ChinaUnionPay Auth. NUI Registered|

@Giropay Auth. NUI
    Scenario: Registered Shopper is able to place order via giropay
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
        |code1auto1@yopmail.com|3333333333|98765|AUTHORISED|DE|
        And Apm Print the Order Number
        |giropay Auth. NUI Registered|


@Alipay Auth NUI
    Scenario: Registered Shopper is able to place order via Alipay
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
        And Apm Shopper fills new ui email and phone number and status for alipay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|CN|
        And Apm Print the Order Number
        |Alipay Auth. NUI Registered|

@Sofort Auth NUI
    Scenario: Registered Shopper is able to place order via Sofort
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|AT|
        And Apm Print the Order Number
        |Sofort Auth. NUI Registered|

@Boleto Pending Open NUI
    Scenario: Registered Shopper is able to place order via Boleto
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
        |code1auto1@yopmail.com|3333333333|PENDINGOPEN|BR|263.946.533-30|
        And Apm Print the Order Number
        |Boleto PendingOpen. NUI Registered|


@CashU Auth NUI
    Scenario: Registered Shopper is able to place order via CashU
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|AE|
        And Apm Print the Order Number
        |CashU Auth. NUI Registered|

@Mistercash Auth NUI
    Scenario: Registered Shopper is able to place order via Mistercash
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|BE|
        And Apm Print the Order Number
        |Mistercash Auth. NUI Registered|

@Yandex Pending Open NUI
    Scenario: Registered Shopper is able to place order via yandex
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|RU|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for yandex
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGOPEN|RU|
        And Apm Print the Order Number
        |yandex PendingOpen NUI Registered| 


@Alipay Pending Open NUI
    Scenario: Registered Shopper is able to place order via Alipay
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
        And Apm Shopper fills new ui email and phone number and status for alipay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGOPEN|CN|
        And Apm Print the Order Number
        |Alipay PendingOpen NUI Registered|

@PRZELEWY24 Auth NUI
    Scenario: Registered Shopper is able to place order via przelewy24
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|PL|
        And Apm Print the Order Number
        |przelewy24 Auth. NUI Registered| 


@Poli Auth NUI
    Scenario: Registered Shopper is able to place order via poli
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|NZ|
        And Apm Print the Order Number
        |poli Auth. NUI Registered| 


@QIWI Auth NUI
    Scenario: Registered Shopper is able to place order via qiwi
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
        |code1auto1@yopmail.com|3333333333|AUTHORISED|KZ|
        And Apm Print the Order Number
        |qiwi Auth. NUI Registered|  


@Yandex Auth NUI
    Scenario: Registered Shopper is able to place order via yandex
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|RU|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for yandex
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|RU|
        And Apm Print the Order Number
        |yandex Auth. NUI Registered|


@Ideal NUI
    Scenario: Registered Shopper is able to place order via Ideal
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
        And Apm Shopper fills new ui email and phone number and country for Ideal 
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|BE|
        And Apm Print the Order Number
        |Ideal Auth. NUI Registered|

@Paypal NUI
    Scenario: Registered Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|CN|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and country for paypal
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|US|
        And Apm Print the Order Number
        |Paypal Auth. NUI Registered|