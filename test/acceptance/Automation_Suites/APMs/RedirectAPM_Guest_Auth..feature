Feature: Guest Redirect APMs Auth. - China Union Pay, Enets, Giropay, Klarna Pay now & Pay later, AliPay, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, Yandex, IDEAL, PayPal

@Chinaunionpay Auth.
    Scenario: Guest Shopper is able to place order via Chinaunionpay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|CN|
        And Apm Print the Order Number
        |ChinaUnionPay Auth. Guest|

@ENETS Auth.
    Scenario: Guest Shopper is able to place order via enets
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for enets
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|SG|
        And Apm Print the Order Number
        |enets auth. Guest|

@Giropay Auth.
    Scenario: Guest Shopper is able to place order via giropay
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for giropay
        |email|phone|bankcode|status|country|
        |code1auto1@yopmail.com|3333333333|98765|AUTHORISED|DE|
        And Apm Print the Order Number
        |giropay auth. Guest|


@Alipay Auth
    Scenario: Guest Shopper is able to place order via Alipay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for alipay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|CN|
        And Apm Print the Order Number
        |Alipay Guest AUTHORISED|


@Sofort Auth
    Scenario: Guest Shopper is able to place order via Sofort
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for sofort
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|AT|
        And Apm Print the Order Number
        |Sofort Guest AUTHORISED|

@Boleto Pending Open
    Scenario: Guest Shopper is able to place order via Boleto
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email, phone number, cpf and status for boleto
        |email|phone|status|country|cpf|
        |code1auto1@yopmail.com|3333333333|PENDINGOPEN|BR|263.946.533-30|
        And Apm Print the Order Number
        |Boleto Guest PENDINGOPEN|


@CashU Auth
    Scenario: Guest Shopper is able to place order via CashU
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for cashu
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|AE|
        And Apm Print the Order Number
        |CashU Guest AUTHORISED|

@Mistercash Auth
    Scenario: Guest Shopper is able to place order via Mistercash
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for mistercash
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|BE|
        And Apm Print the Order Number
        |Mistercash Guest AUTHORISED|

@Klarna Pay Later Auth.
    Scenario: Guest Shopper is able to place order via klarnapaylater
       When Apm shopper selects yes or no for uk tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills uk shipping Address
        |firstName|lastName|addressOne|addressTwo|country|county|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna
        |email|phone|producttype|status|country|
        |code1auto1@yopmail.com|3333333333|KLARNA_PAYLATER-SSL|AUTHORISED|GB|
        And Apm Print the Order Number
        |klarnapaylater auth. Guest| 


@PRZELEWY24 Auth
    Scenario: Guest Shopper is able to place order via przelewy24
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|PL|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for przelewy24
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|PL|
        And Apm Print the Order Number
        |przelewy24 Guest AUTHORISED| 


@Poli Auth
    Scenario: Guest Shopper is able to place order via poli
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|NZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for poli
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|NZ|
        And Apm Print the Order Number
        |poli Guest AUTHORISED| 


@QIWI Auth
    Scenario: Guest Shopper is able to place order via qiwi
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|KZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for qiwi
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|KZ|
        And Apm Print the Order Number
        |qiwi Guest AUTHORISED|  


@Yandex Auth
    Scenario: Guest Shopper is able to place order via yandex
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|RU|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for yandex
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|RU|
        And Apm Print the Order Number
        |yandex Guest AUTHORISED|


@Klarna Pay Now Auth.
    Scenario: Guest Shopper is able to place order via klarnapaynow
       When Apm shopper selects yes or no for uk tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills uk shipping Address
        |firstName|lastName|addressOne|addressTwo|country|county|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna
        |email|phone|producttype|status|country|
        |code1auto1@yopmail.com|3333333333|KLARNA_PAYNOW-SSL|AUTHORISED|GB|
        And Apm Print the Order Number
        |klarnapaynow auth. Guest|  



@Ideal
    Scenario: Guest Shopper is able to place order via Ideal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for Ideal 
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|BE|
        And Apm Print the Order Number
        |Ideal Guest Authorise|

@Paypal
    Scenario: Guest Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|CN|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|US|
        And Apm Print the Order Number
        |Paypal Guest Auth|