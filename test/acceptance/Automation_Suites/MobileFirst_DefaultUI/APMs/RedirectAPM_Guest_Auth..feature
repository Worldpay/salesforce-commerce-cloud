Feature: Guest Redirect APMs Auth. - China Union Pay, Giropay, Klarna Pay now, Pay later & Slice It, AliPay, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, Yandex, IDEAL, PayPal

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
        |Alipay Auth. Guest|


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
        |Sofort Auth. Guest|

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
        |Boleto PendingOpen Guest|


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
        |CashU Auth. Guest|

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
        |Mistercash Auth. Guest|

@Klarna Pay Later Auth.
    Scenario: Guest Shopper is able to place order via klarnapaylater
		Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Later
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDING|US|
        And Apm Print the Order Number
        |klarnapaylater Pending. Guest| 


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
        |przelewy24 Auth. Guest| 


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
        |poli Auth. Guest| 


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
        |qiwi Auth. Guest|  


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
        |yandex Auth. Guest|


@Klarna Pay Now Auth.
    Scenario: Guest Shopper is able to place order via klarnapaynow
       When Apm shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Now
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|US|
        And Apm Print the Order Number
        |klarnapaynow Auth. Guest|  



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
        |Ideal Authoise. Guest|

@Paypal
    Scenario: Guest Shopper is able to place order via Paypal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|response|
        |code1auto1@yopmail.com|3333333333|US|Auth|
        And Apm Print the Order Number
        |Paypal Auth. Guest|

@Klarna Slice IT Auth.
    Scenario: Guest Shopper is able to place order via klarnasliceit
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Slice It
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|US|
        And Apm Print the Order Number
        |klarnasliceit Auth. Guest| 